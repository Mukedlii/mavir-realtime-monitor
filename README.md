# MAVIR Real-time Electricity Price & Generation Monitor ⚡

[![Apify Actor](https://img.shields.io/badge/Apify-Actor-blue)](https://apify.com/mukedlii/mavir-realtime-monitor)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)

Real-time Hungarian electricity price monitoring and renewable energy generation tracking using official MAVIR (Hungarian TSO) data.

## 🇭🇺 What is MAVIR?

MAVIR (Magyar Villamosenergia-ipari Átviteli Rendszerirányító Zrt.) is Hungary's **Transmission System Operator (TSO)**, responsible for operating the national electricity grid. This actor provides real-time access to:

- ⚡ **Current electricity prices** (HUF/MWh)
- 🌍 **Generation mix** (renewable vs conventional sources)
- 📊 **Day-ahead price forecasts**
- 🔋 **Grid consumption & production data**

## 🚀 Features

- ✅ **Real-time electricity price tracking** (updated every 15 minutes)
- ✅ **Renewable energy percentage** (wind, solar, hydro, biomass)
- ✅ **Price alert notifications** (Discord, Slack, custom webhooks)
- ✅ **Historical data collection** for trend analysis
- ✅ **Day-ahead forecast** for planning & optimization
- ✅ **Pay-per-event pricing** — only pay when you run it

## 📊 Use Cases

### For Energy Traders
- Monitor electricity spot prices in real-time
- Track day-ahead forecasts for trading decisions
- Set price alerts for arbitrage opportunities

### For Renewable Energy Companies
- Track renewable penetration in the Hungarian grid
- Optimize solar/wind production scheduling
- Monitor grid stability and curtailment risks

### For Industrial Consumers
- Optimize energy-intensive processes based on real-time prices
- Schedule production during low-price hours
- Reduce electricity costs by 15-30%

### For Energy Analysts & Researchers
- Collect historical electricity price data
- Analyze renewable energy trends in Hungary
- Study grid dynamics and market behavior

## 🔧 Input Configuration

```json
{
  "dataType": "all",
  "interval": "hourly",
  "priceThreshold": 50000,
  "enableNotifications": true,
  "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK"
}
```

### Input Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `dataType` | enum | `all`, `price`, `generation`, `forecast` | `all` |
| `interval` | enum | `hourly` or `daily` | `hourly` |
| `priceThreshold` | number | Alert threshold in HUF/MWh | `null` |
| `enableNotifications` | boolean | Send webhook alerts | `false` |
| `webhookUrl` | string | Discord/Slack webhook URL | `null` |

## 📤 Output Example

```json
{
  "timestamp": "2026-03-26T08:00:00Z",
  "source": "MAVIR",
  "data": {
    "price": {
      "value": 45320,
      "unit": "HUF/MWh",
      "timestamp": "2026-03-26T08:00:00Z"
    },
    "generation": {
      "total": 4523,
      "renewable_percentage": 32.5,
      "sources": {
        "wind": { "value": 850, "unit": "MW", "percentage": 18.8 },
        "solar": { "value": 320, "unit": "MW", "percentage": 7.1 },
        "nuclear": { "value": 2000, "unit": "MW", "percentage": 44.2 },
        "gas": { "value": 1200, "unit": "MW", "percentage": 26.5 }
      }
    },
    "forecast": {
      "hours": [
        { "hour": "09:00", "price": 47500, "demand": 4600 },
        { "hour": "10:00", "price": 48200, "demand": 4750 }
      ]
    }
  }
}
```

## 🔔 Webhook Notifications

Get instant alerts when prices spike:

### Discord Example
```javascript
{
  "content": "⚠️ **Electricity Price Alert**",
  "embeds": [{
    "title": "MAVIR Price Threshold Exceeded",
    "description": "Current price: 52,300 HUF/MWh\nThreshold: 50,000 HUF/MWh",
    "color": 16711680,
    "timestamp": "2026-03-26T08:00:00Z"
  }]
}
```

## 📈 Scheduled Runs

Set up automatic monitoring:

### Hourly Price Tracking
```json
{
  "schedule": "0 * * * *",
  "input": { "dataType": "price" }
}
```

### Daily Generation Report
```json
{
  "schedule": "0 6 * * *",
  "input": { "dataType": "generation" }
}
```

## 💰 Pricing

**Pay-per-event** — Only charged when the actor runs:

- 💵 **$0.01 per run** (approx. 1 compute unit)
- ⚡ **~10-20 seconds** average runtime
- 📊 **~100 KB** data transferred per run

**Monthly cost examples:**
- Hourly runs: 720 runs/month × $0.01 = **$7.20/month**
- Daily runs: 30 runs/month × $0.01 = **$0.30/month**

## 🛠️ Technical Details

- **Framework**: Apify SDK + Crawlee
- **Runtime**: Node.js 20
- **Data Source**: MAVIR official website (public data)
- **Update Frequency**: Real-time (15-minute intervals)
- **Data Retention**: Configurable (dataset or key-value store)

## 📚 Related Actors

- [EU Energy Price Monitor](https://apify.com/mukedlii/eu-energy-monitor) — 30+ European countries
- [Hungarian Gas Price Tracker](https://apify.com/mukedlii/hungarian-gas-monitor)
- [Carbon Credit Price Scraper](https://apify.com/mukedlii/carbon-credit-monitor)

## 📄 License

Apache 2.0

## 👨‍💻 Author

Created by [Mukedlii](https://apify.com/mukedlii) — Independent energy data specialist

## 🤝 Support

- 📧 Email: support@mukedlii.com
- 🐛 Issues: [GitHub Issues](https://github.com/mukedlii/mavir-monitor/issues)
- 💬 Discord: [Energy Data Community](https://discord.gg/energydata)

---

**Keywords**: MAVIR, Hungarian electricity price, energy monitoring, renewable energy, power grid, electricity market, real-time data, Hungary TSO, energy trading, electricity forecast
