import { Actor } from 'apify';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { parseStringPromise } from 'xml2js';

await Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        priceThreshold = 100,
        emailTo,
        emailFrom,
        gmailUser,
        gmailPass,
        entsoeApiKey
    } = input;

    let maxPrice = 0;
    const allPrices = [];

    // HUPX CSV letöltés és parsálás
    const hupxUrl = 'https://hupx.hu/market-data/dam/hun/download';
    const hupxResponse = await axios.get(hupxUrl, { responseType: 'text' });
    const hupxData = hupxResponse.data;
    
    const lines = hupxData.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 3) {
            const date = parts[0].trim();
            const hour = parts[1].trim();
            const price = parseFloat(parts[2].trim());
            
            if (!isNaN(price)) {
                allPrices.push({ source: 'HUPX', date, hour, price });
                if (price > maxPrice) maxPrice = price;
            }
        }
    }

    // ENTSO-E API lekérés (opcionális)
    if (entsoeApiKey) {
        try {
            const entsoeUrl = 'https://web-api.tp.entsoe.eu/api';
            const today = new Date();
            const periodStart = today.toISOString().split('T')[0].replace(/-/g, '') + '0000';
            const periodEnd = new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0].replace(/-/g, '') + '0000';
            
            const entsoeResponse = await axios.get(entsoeUrl, {
                params: {
                    securityToken: entsoeApiKey,
                    documentType: 'A44',
                    in_Domain: '10YHU-MAVIR----U',
                    out_Domain: '10YHU-MAVIR----U',
                    periodStart,
                    periodEnd
                }
            });
            
            const entsoeXml = await parseStringPromise(entsoeResponse.data);
            
            if (entsoeXml?.Publication_MarketDocument?.TimeSeries) {
                const timeSeries = entsoeXml.Publication_MarketDocument.TimeSeries;
                for (const ts of timeSeries) {
                    if (ts.Period) {
                        for (const period of ts.Period) {
                            if (period.Point) {
                                for (const point of period.Point) {
                                    const price = parseFloat(point['price.amount']?.[0] || 0);
                                    if (price > 0) {
                                        allPrices.push({ source: 'ENTSO-E', price });
                                        if (price > maxPrice) maxPrice = price;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log('ENTSO-E API error (skipped):', error.message);
        }
    }

    // Email küldés ha ár > threshold
    if (maxPrice > priceThreshold && emailTo) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: gmailUser,
                pass: gmailPass
            }
        });

        await transporter.sendMail({
            from: emailFrom || gmailUser,
            to: emailTo,
            subject: `⚡ Energy Price Alert - ${maxPrice.toFixed(2)} EUR/MWh`,
            html: `<h2>⚡ Energy Price Alert</h2><p>Current price: <strong>${maxPrice.toFixed(2)} EUR/MWh</strong></p><p>Threshold: ${priceThreshold} EUR/MWh</p>`
        });

        console.log(`Alert sent! Price: ${maxPrice} EUR/MWh`);
    }

    await Actor.pushData({
        timestamp: new Date().toISOString(),
        maxPrice,
        threshold: priceThreshold,
        alertSent: maxPrice > priceThreshold,
        totalPrices: allPrices.length,
        prices: allPrices
    });
});
