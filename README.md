# European Electricity Price Monitor

⚡ Real-time electricity prices for 15 European countries via Energy-Charts API.

🌐 **Landing page**: [energy-saas-landing.vercel.app](https://energy-saas-landing.vercel.app)

## Features

- **15 countries in parallel**: DE, FR, AT, HU, CZ, SK, RO, PL, IT, ES, NL, BE, CH, SI, HR
- **96 data points/day** per country (EUR/MWh)
- **Max, min, avg** price calculation per country
- **Email alerts** if any country exceeds threshold
- **No API key required**
- **Completes in ~15 seconds**

## Input

- `countries`: array, default all 15
- `priceThreshold`: integer, default 200 EUR/MWh
- `emailTo`, `gmailUser`, `gmailPass`

## Output Example

```json
{
  "timestamp": "2026-03-27T09:00:00Z",
  "date": "2026-03-27",
  "totalCountries": 15,
  "successfulFetches": 15,
  "failedFetches": 0,
  "alertsSent": 2,
  "priceThreshold": 200,
  "countries": [
    {
      "country": "DE",
      "date": "2026-03-27",
      "maxPrice": 245.30,
      "minPrice": 87.50,
      "avgPrice": 156.20,
      "currency": "EUR/MWh",
      "dataPoints": 96,
      "source": "Energy-Charts"
    },
    {
      "country": "FR",
      "maxPrice": 189.40,
      "minPrice": 65.30,
      "avgPrice": 132.10,
      "currency": "EUR/MWh",
      "dataPoints": 96,
      "source": "Energy-Charts"
    }
  ]
}
```

## Use Cases

### Energy Traders
- Monitor price trends across multiple European markets
- Identify arbitrage opportunities between countries
- Get instant alerts on price spikes

### Cryptocurrency Miners
- Mine where electricity is cheapest
- Optimize data center operations across Europe
- Avoid high-cost periods

### Smart Home & IoT
- Schedule appliances during low-price hours
- Build energy-aware automation systems
- Reduce electricity costs intelligently

### Industrial & Business
- Optimize production schedules based on electricity prices
- Forecast energy expenses across European facilities
- Track market volatility and trends

## How It Works

1. Fetches current electricity prices from Energy-Charts API for all selected countries in parallel
2. Calculates max, min, and average prices from 96 hourly data points per country
3. Identifies countries exceeding the price threshold
4. Sends a consolidated email alert with all countries above threshold
5. Stores complete results to Apify dataset

## Data Source

**Primary: ENTSO-E Transparency Platform** (official EU source)
- API: `web-api.tp.entsoe.eu`
- Official electricity market data for all EU countries
- Day-ahead prices (A44 document type)
- Hourly updates with 15-minute intervals

**Fallback: Energy-Charts API** (if ENTSO-E fails)
- API: `api.energy-charts.info`
- Public, no registration required
- Same 15 European markets

## Schedule Recommendations

- **Hourly**: Real-time monitoring and immediate alerts
- **Every 6 hours**: Regular price tracking
- **Daily at 00:00 UTC**: Daily reports and analytics

## Error Handling

- 10-second timeout per country prevents hanging
- Graceful degradation: failed countries don't stop others
- All failures reported in output
- Actor always completes successfully

## Repository

- **GitHub**: [github.com/Mukedlii/mavir-realtime-monitor](https://github.com/Mukedlii/mavir-realtime-monitor)
- **Landing Page**: [energy-saas-landing.vercel.app](https://energy-saas-landing.vercel.app)

## License

Apache-2.0

---

**Keywords**: European electricity prices, energy monitoring, electricity price alerts, smart home automation, cryptocurrency mining optimization, energy trading, IoT energy management, real-time electricity data, EUR/MWh prices
