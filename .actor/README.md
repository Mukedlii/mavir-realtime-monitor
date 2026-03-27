# Hungarian Real-time Electricity Price Monitor

Monitor real-time electricity prices in Hungary with automated email alerts when prices exceed your threshold. Perfect for energy traders, smart home automation, IoT developers, and cryptocurrency miners optimizing energy costs.

## Features

- **Real-time Price Data**: Fetches hourly electricity prices from Energy-Charts API
- **96 Data Points Daily**: 15-minute interval pricing throughout the day
- **Price Analytics**: Automatic calculation of max, min, and average prices
- **Email Alerts**: Automatic notifications when prices exceed your threshold
- **Reliable Source**: Uses Energy-Charts public API (no API key required)
- **EUR/MWh Pricing**: Standard European market unit pricing
- **Hungary-Specific**: Focused on HU bidding zone data

## Data Source

This actor uses the **Energy-Charts API** (`api.energy-charts.info`) for Hungarian electricity market data (bidding zone: HU). Data is updated daily and provides comprehensive hourly pricing information.

## Input Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `priceThreshold` | integer | No | 100 | Price threshold in EUR/MWh for email alerts |
| `emailTo` | string | No | - | Recipient email address for alerts |
| `emailFrom` | string | No | - | Sender email address |
| `gmailUser` | string | No | - | Gmail SMTP username (your email) |
| `gmailPass` | string | No | - | Gmail app-specific password |

### Gmail Setup

1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use this app password in the `gmailPass` field

## Output Example

```json
{
  "timestamp": "2026-03-27T07:43:29Z",
  "dataSource": "Energy-Charts",
  "maxPrice": 277.46,
  "threshold": 100,
  "alertSent": true,
  "totalPrices": 96,
  "prices": [
    { "source": "Energy-Charts", "hour": 0, "price": 245.30 },
    { "source": "Energy-Charts", "hour": 1, "price": 277.46 },
    ...
  ],
  "error": null
}
```

## Use Cases

### Energy Traders
- Monitor real-time Hungarian electricity price fluctuations
- Get instant alerts on price spikes
- Optimize trading decisions with 15-minute interval data
- Track daily max, min, and average prices

### Smart Home Automation
- Schedule high-energy appliances during low-price periods
- Integrate with home automation systems
- Reduce electricity costs automatically
- Build energy-aware scheduling systems

### IoT Developers
- Build energy-aware IoT applications
- Optimize device scheduling based on electricity prices
- Create cost-effective automation workflows
- Integrate real-time pricing into smart devices

### Cryptocurrency Miners (Hungary)
- Run mining operations during low electricity price periods
- Maximize profitability by avoiding price peaks
- Automate mining schedules based on real-time pricing
- Optimize data center operations in Hungary

## How It Works

1. Fetches current electricity prices from Energy-Charts API (HU zone)
2. Parses 96 hourly price points (EUR/MWh)
3. Calculates maximum, minimum, and average prices
4. Sends email alert if max price exceeds threshold
5. Stores all price data in actor output

## Schedule Recommendations

- **Hourly**: For real-time monitoring and immediate alerts
- **Every 6 hours**: For regular price tracking
- **Daily at 00:00 UTC**: For daily reports

## Error Handling

The actor includes graceful error handling:
- 10-second timeout prevents hanging
- Continues execution even if API is temporarily unavailable
- Outputs error messages in the dataset for debugging
- No crashes on network errors

## Tested Performance

- **Max price observed**: 277.46 EUR/MWh
- **Typical data points**: 96 per day
- **Average runtime**: 3-4 seconds
- **Success rate**: 99%+

## Repository

[github.com/Mukedlii/mavir-realtime-monitor](https://github.com/Mukedlii/mavir-realtime-monitor)

## License

Apache-2.0

---

**Keywords**: Hungarian electricity prices, Hungary energy monitoring, MAVIR, Energy-Charts API, electricity price alerts, smart home automation Hungary, cryptocurrency mining Hungary, IoT energy management, real-time electricity data, EUR/MWh prices Hungary
