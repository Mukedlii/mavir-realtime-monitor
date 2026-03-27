import { Actor } from 'apify';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { parseStringPromise } from 'xml2js';

const SUPPORTED_COUNTRIES = ['DE', 'FR', 'AT', 'HU', 'CZ', 'SK', 'RO', 'PL', 'IT', 'ES', 'NL', 'BE', 'CH', 'SI', 'HR'];

const BIDDING_ZONES = {
    DE: '10Y1001A1001A83F',
    FR: '10YFR-RTE------C',
    AT: '10YAT-APG------L',
    HU: '10YHU-MAVIR----U',
    CZ: '10YCZ-CEPS-----N',
    SK: '10YSK-SEPS-----K',
    RO: '10YRO-TEL------P',
    PL: '10YPL-AREA-----S',
    IT: '10YIT-GRTN-----B',
    ES: '10YES-REE------0',
    NL: '10YNL----------L',
    BE: '10YBE----------2',
    CH: '10YCH-SWISSGRIDZ',
    SI: '10YSI-ELES-----O',
    HR: '10YHR-HEP------M'
};

const ENTSOE_TOKEN = '55be67c8-a36b-4bab-86ff-23488e71e60f';

await Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        countries = SUPPORTED_COUNTRIES,
        priceThreshold = 200,
        emailTo,
        emailFrom,
        gmailUser,
        gmailPass
    } = input;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const periodStart = today.toISOString().split('T')[0].replace(/-/g, '') + '0000';
    const periodEnd = tomorrow.toISOString().split('T')[0].replace(/-/g, '') + '0000';
    const todayStr = today.toISOString().split('T')[0];

    const results = [];
    const alerts = [];

    const promises = countries.map(async (country) => {
        // Try ENTSO-E first
        try {
            const biddingZone = BIDDING_ZONES[country];
            if (!biddingZone) throw new Error('No bidding zone for ' + country);

            const url = `https://web-api.tp.entsoe.eu/api?securityToken=${ENTSOE_TOKEN}&documentType=A44&in_Domain=${biddingZone}&out_Domain=${biddingZone}&periodStart=${periodStart}&periodEnd=${periodEnd}`;
            
            const response = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const parsed = await parseStringPromise(response.data);
            const timeSeries = parsed?.Publication_MarketDocument?.TimeSeries;

            if (timeSeries && timeSeries.length > 0) {
                const prices = [];
                
                for (const ts of timeSeries) {
                    const periods = ts.Period || [];
                    for (const period of periods) {
                        const points = period.Point || [];
                        for (const point of points) {
                            const priceAmount = parseFloat(point['price.amount']?.[0]);
                            if (!isNaN(priceAmount)) {
                                prices.push(priceAmount);
                            }
                        }
                    }
                }

                if (prices.length > 0) {
                    const maxPrice = Math.max(...prices);
                    const minPrice = Math.min(...prices);
                    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

                    if (maxPrice > priceThreshold) {
                        alerts.push({
                            country,
                            maxPrice: parseFloat(maxPrice.toFixed(2)),
                            threshold: priceThreshold
                        });
                    }

                    console.log(`${country}: ENTSO-E OK - max ${maxPrice.toFixed(2)} EUR/MWh`);
                    return {
                        country,
                        date: todayStr,
                        maxPrice: parseFloat(maxPrice.toFixed(2)),
                        minPrice: parseFloat(minPrice.toFixed(2)),
                        avgPrice: parseFloat(avgPrice.toFixed(2)),
                        currency: 'EUR/MWh',
                        dataPoints: prices.length,
                        source: 'ENTSO-E'
                    };
                }
            }

            throw new Error('No price data in ENTSO-E response');

        } catch (entsoeError) {
            console.log(`${country}: ENTSO-E failed (${entsoeError.message}), trying Energy-Charts...`);
            
            // Fallback to Energy-Charts
            try {
                const url = `https://api.energy-charts.info/price?bzn=${country}&start=${todayStr}&end=${todayStr}`;
                
                const response = await axios.get(url, {
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const data = response.data;

                if (data.price && Array.isArray(data.price)) {
                    const validPrices = data.price.filter(p => p !== null && !isNaN(p));
                    
                    if (validPrices.length > 0) {
                        const maxPrice = Math.max(...validPrices);
                        const minPrice = Math.min(...validPrices);
                        const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;

                        if (maxPrice > priceThreshold) {
                            alerts.push({
                                country,
                                maxPrice: parseFloat(maxPrice.toFixed(2)),
                                threshold: priceThreshold
                            });
                        }

                        console.log(`${country}: Energy-Charts OK - max ${maxPrice.toFixed(2)} EUR/MWh`);
                        return {
                            country,
                            date: todayStr,
                            maxPrice: parseFloat(maxPrice.toFixed(2)),
                            minPrice: parseFloat(minPrice.toFixed(2)),
                            avgPrice: parseFloat(avgPrice.toFixed(2)),
                            currency: 'EUR/MWh',
                            dataPoints: validPrices.length,
                            source: 'Energy-Charts'
                        };
                    }
                }
            } catch (energyChartsError) {
                console.log(`${country}: Both sources failed`);
                return {
                    country,
                    date: todayStr,
                    error: `ENTSO-E: ${entsoeError.message}, Energy-Charts: ${energyChartsError.message}`,
                    source: 'Failed'
                };
            }
        }

        return null;
    });

    const fetchedResults = await Promise.all(promises);
    results.push(...fetchedResults.filter(r => r !== null));

    // Email alert
    if (alerts.length > 0 && emailTo && gmailUser && gmailPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: gmailUser,
                    pass: gmailPass
                }
            });

            const alertList = alerts.map(a => 
                `<li><strong>${a.country}</strong>: ${a.maxPrice} EUR/MWh</li>`
            ).join('');

            await transporter.sendMail({
                from: emailFrom || gmailUser,
                to: emailTo,
                subject: `⚡ Energy Alert - ${alerts.length} Countries Above Threshold`,
                html: `<h2>⚡ European Electricity Price Alert</h2>
                    <ul>${alertList}</ul>
                    <p>Threshold: ${priceThreshold} EUR/MWh | ${todayStr} | Source: ENTSO-E</p>`
            });

            console.log(`Alert sent for ${alerts.length} countries`);
        } catch (e) {
            console.log('Email failed:', e.message);
        }
    }

    await Actor.pushData({
        timestamp: new Date().toISOString(),
        date: todayStr,
        totalCountries: countries.length,
        successfulFetches: results.filter(r => !r.error).length,
        failedFetches: results.filter(r => r.error).length,
        alertsSent: alerts.length,
        priceThreshold,
        primarySource: 'ENTSO-E',
        fallbackSource: 'Energy-Charts',
        countries: results
    });

    console.log(`Done: ${results.length} countries, ${alerts.length} alerts`);
});
