import { Actor } from 'apify';
import { chromium } from 'playwright';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

await Actor.init();

// ============================================================================
// INPUT PARAMETERS
// ============================================================================

const input = await Actor.getInput() ?? {};
const {
    dataSource = 'mavir', // mavir | hupx | both
    priceThreshold = 50000, // HUF/MWh - send alert if exceeded
    enableEmailAlerts = false,
    emailProvider = 'nodemailer', // nodemailer | sendgrid
    smtpHost = 'smtp.gmail.com',
    smtpPort = 587,
    smtpUser = null,
    smtpPassword = null,
    sendgridApiKey = null,
    alertEmailFrom = 'alerts@energymonitor.io',
    alertEmailTo = null, // comma-separated list
    debugMode = false,
} = input;

const results = {
    timestamp: new Date().toISOString(),
    sources: {},
    alerts: [],
};

// ============================================================================
// MAVIR SCRAPER (Playwright + Network Intercept)
// ============================================================================

async function scrapeMavir() {
    console.log('🔌 Starting MAVIR scraper with Playwright...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport: { width: 1920, height: 1080 },
        });

        const page = await context.newPage();
        
        // API request intercept - capture JSON responses
        const apiRequests = [];
        
        page.on('response', async (response) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';
            
            // Look for JSON API calls
            if (contentType.includes('application/json') || url.includes('/api/') || url.includes('.json')) {
                try {
                    const body = await response.json();
                    apiRequests.push({
                        url,
                        status: response.status(),
                        body,
                    });
                    
                    if (debugMode) {
                        console.log('📡 Captured API call:', url);
                        console.log('📦 Response:', JSON.stringify(body, null, 2));
                    }
                } catch (e) {
                    // Not JSON, skip
                }
            }
        });

        // Navigate to MAVIR real-time data page
        console.log('🌐 Navigating to MAVIR...');
        await page.goto('https://www.mavir.hu/web/mavir/actual-data', {
            waitUntil: 'networkidle',
            timeout: 30000,
        });

        // Wait for dynamic content to load
        await page.waitForTimeout(3000);

        // Try to extract price from page content (fallback)
        const pageData = await page.evaluate(() => {
            const priceElement = document.querySelector('[class*="price"], [id*="price"], [data-price]');
            const generationElements = document.querySelectorAll('[class*="generation"], [class*="production"]');
            
            return {
                priceText: priceElement ? priceElement.innerText : null,
                generationCount: generationElements.length,
                bodyText: document.body.innerText.substring(0, 500), // First 500 chars for debugging
            };
        });

        if (debugMode) {
            console.log('📄 Page data:', pageData);
            console.log('📡 Total API requests captured:', apiRequests.length);
        }

        // Process captured API requests
        let priceData = null;
        let generationData = null;

        for (const req of apiRequests) {
            // Look for price data in API responses
            if (req.body && typeof req.body === 'object') {
                // Common patterns for price data
                if (req.body.price || req.body.spotPrice || req.body.currentPrice) {
                    priceData = {
                        value: req.body.price || req.body.spotPrice || req.body.currentPrice,
                        unit: 'HUF/MWh',
                        source: req.url,
                        timestamp: new Date().toISOString(),
                    };
                }

                // Look for generation/production data
                if (req.body.generation || req.body.production || req.body.mix) {
                    generationData = {
                        data: req.body.generation || req.body.production || req.body.mix,
                        source: req.url,
                        timestamp: new Date().toISOString(),
                    };
                }
            }
        }

        results.sources.mavir = {
            success: true,
            price: priceData,
            generation: generationData,
            apiCallsCaptured: apiRequests.length,
            pageSnapshot: debugMode ? pageData : undefined,
        };

        await browser.close();
        console.log('✅ MAVIR scraping completed');

    } catch (error) {
        console.error('❌ MAVIR scraping failed:', error.message);
        results.sources.mavir = {
            success: false,
            error: error.message,
        };
        await browser.close();
    }
}

// ============================================================================
// HUPX SCRAPER (CSV fallback)
// ============================================================================

async function scrapeHupx() {
    console.log('📊 Starting HUPX scraper (CSV)...');
    
    try {
        // HUPX Hungarian Power Exchange - public CSV data
        // URL may vary, adjust based on actual site structure
        const hupxUrl = 'https://www.hupx.hu/en/market-data/dam/dam-results';
        
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(hupxUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // Look for CSV download link
        const csvLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*=".csv"], a[href*="download"]'));
            return links.map(link => ({
                href: link.href,
                text: link.innerText,
            }));
        });

        if (debugMode) {
            console.log('📎 CSV links found:', csvLinks);
        }

        await browser.close();

        // Find today's CSV (latest)
        const todayLink = csvLinks.find(link => 
            link.text.includes(new Date().toISOString().slice(0, 10)) ||
            link.text.toLowerCase().includes('latest') ||
            link.text.toLowerCase().includes('today')
        ) || csvLinks[0];

        if (!todayLink) {
            throw new Error('No CSV download link found on HUPX');
        }

        // Download CSV
        console.log('⬇️  Downloading CSV from:', todayLink.href);
        const csvResponse = await axios.get(todayLink.href, { timeout: 15000 });
        const csvData = csvResponse.data;

        // Parse CSV
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        // Extract latest price (usually in first or last row depending on CSV format)
        const latestRecord = records[records.length - 1] || records[0];
        
        // Common CSV column names (adjust based on actual HUPX format)
        const priceColumn = Object.keys(latestRecord).find(key => 
            key.toLowerCase().includes('price') || 
            key.toLowerCase().includes('ár') ||
            key.toLowerCase().includes('huf')
        );

        const price = latestRecord[priceColumn] ? parseFloat(latestRecord[priceColumn].replace(/[^\d.]/g, '')) : null;

        results.sources.hupx = {
            success: true,
            price: {
                value: price,
                unit: 'HUF/MWh',
                source: todayLink.href,
                timestamp: new Date().toISOString(),
                raw: latestRecord,
            },
            totalRecords: records.length,
        };

        console.log('✅ HUPX scraping completed');

    } catch (error) {
        console.error('❌ HUPX scraping failed:', error.message);
        results.sources.hupx = {
            success: false,
            error: error.message,
        };
    }
}

// ============================================================================
// EMAIL ALERTS
// ============================================================================

async function sendEmailAlert(price, source) {
    if (!enableEmailAlerts || !alertEmailTo) {
        console.log('📧 Email alerts disabled or no recipient configured');
        return;
    }

    const subject = `⚠️ Electricity Price Alert: ${price} HUF/MWh`;
    const message = `
🔴 PRICE ALERT 🔴

The Hungarian electricity spot price has exceeded your threshold!

Current Price: ${price} HUF/MWh
Threshold: ${priceThreshold} HUF/MWh
Source: ${source}
Timestamp: ${new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' })}

---
Energy Monitor
https://energy-saas-landing.vercel.app
    `.trim();

    try {
        if (emailProvider === 'sendgrid') {
            // SendGrid
            if (!sendgridApiKey) {
                throw new Error('SendGrid API key not configured');
            }

            sgMail.setApiKey(sendgridApiKey);
            
            const emails = alertEmailTo.split(',').map(e => e.trim());
            
            await sgMail.sendMultiple({
                to: emails,
                from: alertEmailFrom,
                subject,
                text: message,
            });

            console.log('✅ SendGrid email sent to:', emails.join(', '));

        } else {
            // Nodemailer (SMTP)
            if (!smtpUser || !smtpPassword) {
                throw new Error('SMTP credentials not configured');
            }

            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPassword,
                },
            });

            const emails = alertEmailTo.split(',').map(e => e.trim());

            await transporter.sendMail({
                from: alertEmailFrom,
                to: emails.join(', '),
                subject,
                text: message,
            });

            console.log('✅ SMTP email sent to:', emails.join(', '));
        }

        results.alerts.push({
            type: 'email',
            sent: true,
            price,
            threshold: priceThreshold,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        results.alerts.push({
            type: 'email',
            sent: false,
            error: error.message,
        });
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

try {
    console.log('🚀 MAVIR Realtime Monitor starting...');
    console.log('📥 Input config:', input);

    // Scrape data sources
    if (dataSource === 'mavir' || dataSource === 'both') {
        await scrapeMavir();
    }

    if (dataSource === 'hupx' || dataSource === 'both') {
        await scrapeHupx();
    }

    // Check price threshold and send alerts
    const prices = [];
    
    if (results.sources.mavir?.price?.value) {
        prices.push({ value: results.sources.mavir.price.value, source: 'MAVIR' });
    }
    
    if (results.sources.hupx?.price?.value) {
        prices.push({ value: results.sources.hupx.price.value, source: 'HUPX' });
    }

    for (const { value, source } of prices) {
        if (value > priceThreshold) {
            console.log(`⚠️  Price alert triggered: ${value} > ${priceThreshold} (${source})`);
            await sendEmailAlert(value, source);
            results.alerts.push({
                type: 'threshold',
                price: value,
                threshold: priceThreshold,
                source,
            });
        }
    }

    // Save results to dataset
    await Actor.pushData(results);

    console.log('✅ MAVIR Monitor completed successfully');
    console.log('📊 Results:', JSON.stringify(results, null, 2));

} catch (error) {
    console.error('💥 Fatal error:', error);
    await Actor.pushData({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
    throw error;
}

await Actor.exit();
