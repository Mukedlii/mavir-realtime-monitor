import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import axios from 'axios';

await Actor.init();

const input = await Actor.getInput() ?? {};
const {
    dataType = 'all', // all | price | generation | forecast
    interval = 'hourly', // hourly | daily
    webhookUrl = null,
    enableNotifications = false,
    priceThreshold = null, // HUF/MWh threshold for alerts
} = input;

const results = {
    timestamp: new Date().toISOString(),
    source: 'MAVIR',
    data: {},
};

// MAVIR API endpoints (public JSON APIs)
const MAVIR_ENDPOINTS = {
    price: 'https://www.mavir.hu/rtm/current-price',
    generation: 'https://www.mavir.hu/rtm/generation-mix',
    forecast: 'https://www.mavir.hu/rtm/forecast-day-ahead',
    consumption: 'https://www.mavir.hu/rtm/consumption',
};

/**
 * Fetch current electricity price (HUF/MWh)
 */
async function fetchCurrentPrice() {
    console.log('Fetching current electricity price...');
    
    try {
        // MAVIR real-time price endpoint
        const response = await axios.get('https://www.mavir.hu/web/mavir/actual-data', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 15000,
        });

        // Parse HTML for current price (MAVIR displays it on main page)
        const crawler = new CheerioCrawler({
            async requestHandler({ $, request }) {
                // Find price element (structure may vary, adjust selector)
                const priceText = $('.current-price, .actual-price, [data-price]').first().text().trim();
                const priceMatch = priceText.match(/[\d\s,]+/);
                
                if (priceMatch) {
                    const price = parseFloat(priceMatch[0].replace(/\s/g, '').replace(',', '.'));
                    
                    results.data.price = {
                        value: price,
                        unit: 'HUF/MWh',
                        timestamp: new Date().toISOString(),
                        raw: priceText,
                    };

                    // Alert if threshold exceeded
                    if (priceThreshold && price > priceThreshold) {
                        results.data.price.alert = true;
                        results.data.price.message = `Price ${price} exceeds threshold ${priceThreshold}`;
                    }
                }
            },
        });

        await crawler.run([response.config.url]);
        
    } catch (error) {
        console.error('Error fetching price:', error.message);
        results.data.price = { error: error.message };
    }
}

/**
 * Fetch generation mix (renewable vs conventional)
 */
async function fetchGenerationMix() {
    console.log('Fetching generation mix...');
    
    try {
        const response = await axios.get('https://www.mavir.hu/web/mavir/actual-data', {
            timeout: 15000,
        });

        const crawler = new CheerioCrawler({
            async requestHandler({ $, request }) {
                const generation = {
                    timestamp: new Date().toISOString(),
                    sources: {},
                    total: 0,
                    renewable_percentage: 0,
                };

                // Parse generation table/chart
                $('[class*="generation"], [id*="production"]').each((i, elem) => {
                    const source = $(elem).find('.source-name').text().trim();
                    const valueText = $(elem).find('.source-value').text().trim();
                    const value = parseFloat(valueText.replace(/[^\d.]/g, ''));

                    if (source && !isNaN(value)) {
                        generation.sources[source] = {
                            value,
                            unit: 'MW',
                            percentage: 0, // Will calculate after total
                        };
                        generation.total += value;
                    }
                });

                // Calculate percentages
                Object.keys(generation.sources).forEach(source => {
                    generation.sources[source].percentage = 
                        ((generation.sources[source].value / generation.total) * 100).toFixed(2);
                });

                // Calculate renewable percentage
                const renewableSources = ['wind', 'solar', 'hydro', 'biomass', 'szél', 'nap', 'víz'];
                generation.renewable_percentage = Object.entries(generation.sources)
                    .filter(([name]) => renewableSources.some(r => name.toLowerCase().includes(r)))
                    .reduce((sum, [, data]) => sum + parseFloat(data.percentage), 0)
                    .toFixed(2);

                results.data.generation = generation;
            },
        });

        await crawler.run([response.config.url]);
        
    } catch (error) {
        console.error('Error fetching generation mix:', error.message);
        results.data.generation = { error: error.message };
    }
}

/**
 * Fetch day-ahead forecast
 */
async function fetchForecast() {
    console.log('Fetching day-ahead forecast...');
    
    try {
        const response = await axios.get('https://www.mavir.hu/web/mavir/forecast', {
            timeout: 15000,
        });

        const crawler = new CheerioCrawler({
            async requestHandler({ $, request }) {
                const forecast = {
                    timestamp: new Date().toISOString(),
                    hours: [],
                };

                // Parse hourly forecast table
                $('table.forecast tr').each((i, row) => {
                    const hour = $(row).find('td:nth-child(1)').text().trim();
                    const price = $(row).find('td:nth-child(2)').text().trim();
                    const demand = $(row).find('td:nth-child(3)').text().trim();

                    if (hour && hour.match(/^\d{2}:\d{2}$/)) {
                        forecast.hours.push({
                            hour,
                            price: parseFloat(price.replace(/[^\d.]/g, '')) || null,
                            demand: parseFloat(demand.replace(/[^\d.]/g, '')) || null,
                        });
                    }
                });

                results.data.forecast = forecast;
            },
        });

        await crawler.run([response.config.url]);
        
    } catch (error) {
        console.error('Error fetching forecast:', error.message);
        results.data.forecast = { error: error.message };
    }
}

/**
 * Send webhook notification
 */
async function sendWebhook(data) {
    if (!webhookUrl) return;

    try {
        await axios.post(webhookUrl, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
        });
        console.log('Webhook sent successfully');
    } catch (error) {
        console.error('Webhook error:', error.message);
    }
}

// Main execution
try {
    console.log('MAVIR Monitor started');
    console.log('Input:', input);

    // Fetch data based on input
    if (dataType === 'all' || dataType === 'price') {
        await fetchCurrentPrice();
    }

    if (dataType === 'all' || dataType === 'generation') {
        await fetchGenerationMix();
    }

    if (dataType === 'all' || dataType === 'forecast') {
        await fetchForecast();
    }

    // Send webhook if configured
    if (enableNotifications && results.data.price?.alert) {
        await sendWebhook(results);
    }

    // Push results to dataset
    await Actor.pushData(results);

    console.log('MAVIR Monitor completed');
    console.log('Results:', JSON.stringify(results, null, 2));

} catch (error) {
    console.error('Fatal error:', error);
    throw error;
}

await Actor.exit();
