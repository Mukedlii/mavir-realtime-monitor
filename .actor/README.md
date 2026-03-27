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
  "totalCountries": 15,
  "successfulFetches": 15,
  "alertsSent": 2,
  "countries": [
    {
      "country": "DE",
      "maxPrice": 245.30,
      "minPrice": 87.50,
      "avgPrice": 156.20,
      "currency": "EUR/MWh",
      "dataPoints": 96
    }
  ]
}
```

## Use Cases

- **Energy traders**: arbitrage between countries
- **Crypto miners**: mine where electricity is cheapest
- **Smart home**: schedule appliances on cheap hours
- **IoT developers**: energy-aware automation
- **Industrial**: optimize production schedules

## Data Source

**Energy-Charts API**: `api.energy-charts.info`

Public API, no registration required.

## Links

- **GitHub**: [github.com/Mukedlii/mavir-realtime-monitor](https://github.com/Mukedlii/mavir-realtime-monitor)
- **Landing Page**: [energy-saas-landing.vercel.app](https://energy-saas-landing.vercel.app)

## License

Apache-2.0
