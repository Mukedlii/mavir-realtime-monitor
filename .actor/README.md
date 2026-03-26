# ⚡ MAVIR Realtime Electricity Monitor

Real-time Hungarian electricity price monitoring with **Playwright scraping**, **network API interception**, and **email price alerts**.

---

## 🎯 Features

✅ **Dual Data Sources:**
- **MAVIR** (official TSO) - Playwright scraper with network request interception
- **HUPX** (Hungarian Power Exchange) - CSV data scraper as fallback

✅ **Smart Scraping:**
- Playwright headless browser for JavaScript-rendered content
- Network request monitoring to capture hidden API calls
- Automatic fallback to alternative data sources

✅ **Price Alerts:**
- Email notifications when price exceeds threshold
- Supports **Nodemailer (SMTP)** or **SendGrid API**
- Configurable threshold (default: 50,000 HUF/MWh)

✅ **Rich Output:**
- Real-time electricity spot prices (HUF/MWh)
- Generation mix data (renewable vs conventional)
- Captured API responses (debug mode)

---

## 🚀 Quick Start

### Run on Apify Platform

1. Open the Actor: [MAVIR Realtime Monitor](https://console.apify.com/actors/WzcJj4ClT5I7tDJmk)
2. Configure input (see below)
3. Click **Run**
4. Check **Dataset** tab for results

### Run Locally

```bash
# Clone repo
git clone https://github.com/Mukedlii/mavir-realtime-monitor.git
cd mavir-realtime-monitor

# Install dependencies
npm install

# Set environment variables (optional)
export APIFY_TOKEN=your_token_here

# Run actor
npm start
```

---

## ⚙️ Configuration

### Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dataSource` | enum | `both` | Data source: `mavir`, `hupx`, or `both` |
| `priceThreshold` | number | `50000` | Alert threshold in HUF/MWh |
| `enableEmailAlerts` | boolean | `false` | Enable email notifications |
| `emailProvider` | enum | `nodemailer` | Email service: `nodemailer` or `sendgrid` |
| `smtpHost` | string | `smtp.gmail.com` | SMTP server (for Nodemailer) |
| `smtpPort` | number | `587` | SMTP port (587=TLS, 465=SSL) |
| `smtpUser` | string | - | SMTP username/email |
| `smtpPassword` | string | - | SMTP password (secret) |
| `sendgridApiKey` | string | - | SendGrid API key (secret) |
| `alertEmailFrom` | string | `alerts@...` | Sender email address |
| `alertEmailTo` | string | - | Recipient email(s), comma-separated |
| `debugMode` | boolean | `false` | Verbose logging + API snapshots |

### Example Input

```json
{
  "dataSource": "both",
  "priceThreshold": 60000,
  "enableEmailAlerts": true,
  "emailProvider": "sendgrid",
  "sendgridApiKey": "SG.XXXXXXXXXXXXX",
  "alertEmailFrom": "alerts@energymonitor.io",
  "alertEmailTo": "trader@example.com,manager@example.com",
  "debugMode": false
}
```

---

## 📊 Output Example

```json
{
  "timestamp": "2026-03-26T20:30:00.000Z",
  "sources": {
    "mavir": {
      "success": true,
      "price": {
        "value": 62500,
        "unit": "HUF/MWh",
        "source": "https://www.mavir.hu/api/prices",
        "timestamp": "2026-03-26T20:30:00.000Z"
      },
      "generation": {
        "data": { /* generation mix data */ },
        "source": "https://www.mavir.hu/api/generation",
        "timestamp": "2026-03-26T20:30:00.000Z"
      },
      "apiCallsCaptured": 5
    },
    "hupx": {
      "success": true,
      "price": {
        "value": 62300,
        "unit": "HUF/MWh",
        "source": "https://www.hupx.hu/dam-results-2026-03-26.csv",
        "timestamp": "2026-03-26T20:30:00.000Z"
      },
      "totalRecords": 24
    }
  },
  "alerts": [
    {
      "type": "email",
      "sent": true,
      "price": 62500,
      "threshold": 60000,
      "timestamp": "2026-03-26T20:30:05.000Z"
    }
  ]
}
```

---

## 📧 Email Alerts Setup

### Option 1: Nodemailer (SMTP)

**Gmail Example:**
1. Enable 2-factor authentication in Google Account
2. Generate **App Password**: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use App Password (not your regular password)

**Input:**
```json
{
  "emailProvider": "nodemailer",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "your.email@gmail.com",
  "smtpPassword": "your-app-password-here"
}
```

### Option 2: SendGrid

1. Sign up: [https://sendgrid.com/](https://sendgrid.com/)
2. Create API key: **Settings → API Keys**
3. Verify sender email

**Input:**
```json
{
  "emailProvider": "sendgrid",
  "sendgridApiKey": "SG.XXXXXXXXX",
  "alertEmailFrom": "alerts@yourdomain.com"
}
```

---

## 🔍 How It Works

### 1. MAVIR Scraping (Playwright + Network Intercept)

```javascript
// Launches headless Chromium browser
const browser = await chromium.launch({ headless: true });

// Intercepts network requests to capture API calls
page.on('response', async (response) => {
  if (response.headers()['content-type'].includes('json')) {
    const apiData = await response.json();
    // Process captured API response
  }
});

// Navigates to MAVIR page
await page.goto('https://www.mavir.hu/web/mavir/actual-data');
```

**Why?** MAVIR's website is JavaScript-rendered. Traditional HTTP scrapers (like Cheerio) can't see the content. Playwright:
- Executes JavaScript like a real browser
- Captures background API calls the page makes
- Extracts data directly from those API responses

### 2. HUPX Fallback (CSV Scraper)

If MAVIR fails or for cross-validation:
- Scrapes **HUPX** (Hungarian Power Exchange) public data
- Downloads **CSV files** with hourly prices
- Parses CSV to extract latest spot price

### 3. Email Alerts

When price > threshold:
1. Formats email message with price details
2. Sends via **Nodemailer (SMTP)** or **SendGrid API**
3. Logs alert in output dataset

---

## 🐛 Troubleshooting

### "Build failed" on Apify

**Check:**
- All files are in correct locations (`.actor/` folder)
- `package.json` dependencies are valid
- Playwright is included (large package, may take time)

**Fix:**
```bash
# Rebuild locally to test
npm install
npm start
```

### "No price data found"

**Possible causes:**
1. MAVIR changed their website structure → update selectors
2. API endpoints changed → check network intercept in debug mode
3. Rate limiting or blocking → add delays between requests

**Debug:**
```json
{
  "debugMode": true
}
```

Check output for `pageSnapshot` and `apiCallsCaptured` fields.

### "Email sending failed"

**Gmail:**
- Use **App Password**, not regular password
- Enable "Less secure app access" (not recommended) OR use App Password

**SendGrid:**
- Verify sender email in SendGrid dashboard
- Check API key permissions
- Ensure not using free tier rate limits

---

## 📅 Scheduling

### Run every hour:
1. Apify Console → **Schedules** tab
2. Create schedule: `0 * * * *` (cron)
3. Select this Actor
4. Configure input

### Webhook integration:
```javascript
// Example: Trigger on Zapier/Make/n8n
POST https://api.apify.com/v2/acts/WzcJj4ClT5I7tDJmk/runs
Headers: { "Authorization": "Bearer YOUR_APIFY_TOKEN" }
Body: { /* input config */ }
```

---

## 💰 Pricing

### Apify Platform Costs

- **Compute:** ~$0.01 per run (1-2 minutes)
- **Proxy:** Not required (scraping public sites)
- **Storage:** Minimal (few KB per dataset item)

**Monthly estimate:**
- Hourly runs (24/day × 30 = 720 runs/month) = **~$7/month**

### Email Costs

- **Nodemailer (SMTP):** Free (uses your email provider)
- **SendGrid:** Free tier = 100 emails/day

---

## 🔗 Related Projects

- **Energy Monitor SaaS:** [Landing Page](https://energy-saas-landing.vercel.app)
- **Multi-Country Expansion:** Coming soon (PL, CZ, SK, AT, DE)

---

## 📜 License

Apache-2.0

---

## 🤝 Contributing

Found a bug? Want to add a feature?

1. Fork this repo
2. Create feature branch
3. Submit pull request

Or open an issue: [GitHub Issues](https://github.com/Mukedlii/mavir-realtime-monitor/issues)

---

## 📞 Support

Questions? Reach out:
- **Email:** contact@energymonitor.io
- **GitHub:** [@Mukedlii](https://github.com/Mukedlii)

---

**Built with ❤️ for energy traders, businesses, and developers.**

---

## 🎓 Learn More

- [Apify Documentation](https://docs.apify.com/)
- [Playwright Docs](https://playwright.dev/)
- [MAVIR Official Site](https://www.mavir.hu/)
- [HUPX Market Data](https://www.hupx.hu/en/market-data/dam/dam-results)
