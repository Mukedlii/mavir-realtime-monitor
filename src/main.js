import { Actor } from 'apify';
import axios from 'axios';
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
    let errorMessage = null;

    // Energy-Charts API (egyetlen megbízható forrás)
    try {
        const today = new Date().toISOString().split('T')[0];
        const energyChartsUrl = `https://api.energy-charts.info/price?bzn=HU&start=${today}&end=${today}`;
        
        const response = await axios.get(energyChartsUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const data = response.data;
        
        if (data.price && Array.isArray(data.price)) {
            data.price.forEach((price, i) => {
                if (price !== null && !isNaN(price)) {
                    allPrices.push({ source: 'Energy-Charts', hour: i, price });
                    if (price > maxPrice) maxPrice = price;
                }
            });
            dataSource = 'Energy-Charts';
            console.log(`Energy-Charts OK: ${allPrices.length} prices, max: ${maxPrice}`);
        } else {
            errorMessage = 'Energy-Charts API response invalid structure';
        }
    } catch (error) {
        errorMessage = `Energy-Charts failed: ${error.message}`;
        console.log(errorMessage);
    }

    // Email küldés ha ár > threshold ÉS van adat
    if (maxPrice > priceThreshold && emailTo && gmailUser && gmailPass && allPrices.length > 0) {
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

            await transporter.sendMail({
                from: emailFrom || gmailUser,
                to: emailTo,
                subject: `⚡ Energy Price Alert - ${maxPrice.toFixed(2)} EUR/MWh`,
                html: `<h2>⚡ Energy Price Alert</h2><p>Current price: <strong>${maxPrice.toFixed(2)} EUR/MWh</strong></p><p>Threshold: ${priceThreshold} EUR/MWh</p><p>Source: ${dataSource}</p>`
            });

            console.log(`Alert sent! Price: ${maxPrice} EUR/MWh from ${dataSource}`);
        } catch (emailError) {
            console.log('Email send failed:', emailError.message);
        }
    }

    await Actor.pushData({
        timestamp: new Date().toISOString(),
        dataSource,
        maxPrice: maxPrice || null,
        threshold: priceThreshold,
        alertSent: maxPrice > priceThreshold && allPrices.length > 0,
        totalPrices: allPrices.length,
        prices: allPrices.length > 0 ? allPrices : [],
        error: errorMessage
    });

    console.log('Actor finished successfully');
});
