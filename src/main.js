import { Actor } from 'apify';
import axios from 'axios';
import * as cheerio from 'cheerio';
import nodemailer from 'nodemailer';

await Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        priceThreshold = 100,
        emailTo,
        emailFrom,
        gmailUser,
        gmailPass
    } = input;

    let maxPrice = 0;
    const allPrices = [];
    let dataSource = 'none';

    // 1. Próba: Nordpool scrape
    try {
        const nordpoolUrl = 'https://www.nordpoolgroup.com/en/Market-data1/Dayahead/Area-Prices/ALL1/Hourly/?view=table';
        const response = await axios.get(nordpoolUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const rows = $('table tr');
        
        rows.each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length > 0) {
                // Keressük a HU oszlopot (általában 5-10 között van)
                cells.each((j, cell) => {
                    const text = $(cell).text().trim();
                    const huMatch = text.match(/HU/);
                    if (huMatch) {
                        const priceText = $(cell).next().text().trim();
                        const price = parseFloat(priceText.replace(/[^0-9.,-]/g, '').replace(',', '.'));
                        if (!isNaN(price)) {
                            allPrices.push({ source: 'Nordpool', hour: i, price });
                            if (price > maxPrice) maxPrice = price;
                        }
                    }
                });
            }
        });
        
        if (allPrices.length > 0) {
            dataSource = 'Nordpool';
            console.log(`Nordpool OK: ${allPrices.length} prices`);
        }
    } catch (error) {
        console.log('Nordpool failed:', error.message);
    }

    // 2. Próba: Energy-charts API (ha Nordpool sikertelen)
    if (allPrices.length === 0) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const energyChartsUrl = `https://api.energy-charts.info/price?bzn=HU&start=${today}&end=${today}`;
            
            const response = await axios.get(energyChartsUrl);
            const data = response.data;
            
            if (data.price && Array.isArray(data.price)) {
                data.price.forEach((price, i) => {
                    if (price !== null && !isNaN(price)) {
                        allPrices.push({ source: 'Energy-Charts', hour: i, price });
                        if (price > maxPrice) maxPrice = price;
                    }
                });
                dataSource = 'Energy-Charts';
                console.log(`Energy-Charts OK: ${allPrices.length} prices`);
            }
        } catch (error) {
            console.log('Energy-Charts failed:', error.message);
        }
    }

    // Email küldés ha ár > threshold
    if (maxPrice > priceThreshold && emailTo && gmailUser && gmailPass) {
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
            html: `<h2>⚡ Energy Price Alert</h2><p>Current price: <strong>${maxPrice.toFixed(2)} EUR/MWh</strong></p><p>Threshold: ${priceThreshold} EUR/MWh</p><p>Source: ${dataSource}</p>`
        });

        console.log(`Alert sent! Price: ${maxPrice} EUR/MWh from ${dataSource}`);
    }

    await Actor.pushData({
        timestamp: new Date().toISOString(),
        dataSource,
        maxPrice,
        threshold: priceThreshold,
        alertSent: maxPrice > priceThreshold,
        totalPrices: allPrices.length,
        prices: allPrices
    });
});
