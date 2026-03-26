# Deployment Guide — MAVIR Real-time Monitor

## 🚀 Deploy to Apify Console

### Method 1: Apify CLI (Recommended)

```bash
# Install Apify CLI
npm install -g apify-cli

# Login to Apify
apify login

# Create new actor
cd mavir-realtime-monitor
apify init

# Deploy to Apify
apify push
```

### Method 2: Web Interface

1. Go to [Apify Console](https://console.apify.com/)
2. Click **"Create"** → **"Actor"**
3. Choose **"Node.js + Crawlee"** template
4. Copy all files into the editor:
   - `src/main.js`
   - `package.json`
   - `INPUT_SCHEMA.json`
   - `README.md`
   - `.actor/actor.json`
   - `Dockerfile`
5. Click **"Build"**
6. After build completes, click **"Publish"**

### Method 3: GitHub Integration

1. Push code to GitHub repo
2. In Apify Console, click **"Create"** → **"Import from GitHub"**
3. Connect your GitHub account
4. Select `mavir-realtime-monitor` repo
5. Apify will auto-deploy on every push

## 📝 Configuration Checklist

Before publishing:

- [ ] Set **pricing** to **Pay per event** ($0.01)
- [ ] Add **categories**: ENERGY, MONITORING, DATA_COLLECTION
- [ ] Upload **icon** (512x512 PNG with energy/electricity theme)
- [ ] Add **screenshots** (at least 2)
- [ ] Fill **SEO metadata**:
  - Title: "MAVIR Electricity Price Monitor | Real-time Hungarian Energy Data"
  - Description: (copy from README)
  - Keywords: MAVIR, electricity, energy, Hungary
- [ ] Set **visibility** to **Public**
- [ ] Enable **Pay per event** pricing
- [ ] Test run with sample input
- [ ] Verify dataset output structure

## 🎯 SEO Optimization

**Title** (max 60 chars):
```
MAVIR Electricity Price Monitor | Real-time Energy Data
```

**Description** (max 160 chars):
```
Track Hungarian electricity prices in real-time using official MAVIR data. Monitor renewable energy, get alerts, access forecasts. Pay-per-use.
```

**Keywords** (comma-separated):
```
MAVIR, Hungarian electricity price, energy monitoring, renewable energy tracker, power grid data, electricity market, real-time energy prices, Hungary TSO, energy trading, electricity forecast, spot price monitoring
```

## 💰 Pricing Setup

1. Go to **Actor Settings** → **Pricing**
2. Select **"Pay per event"**
3. Set price: **$0.01 per run**
4. Set compute unit estimate: **1 CU** (≈10-20 seconds runtime)
5. Add pricing tiers (optional):
   - Free tier: 10 runs/month
   - Pro tier: Unlimited runs at $0.009/run

## 📊 Analytics & Monitoring

Enable actor statistics:

- [ ] Track run count
- [ ] Monitor success rate
- [ ] Measure average runtime
- [ ] Track revenue (if monetized)
- [ ] Review user feedback

## 🔔 Post-Publish Tasks

1. **Share on social media**:
   - LinkedIn: "Just launched a real-time Hungarian electricity price monitor on Apify"
   - Twitter: "Track MAVIR electricity prices in real-time with my new Apify actor"
   
2. **Submit to directories**:
   - Apify Store featured actors
   - Energy data communities
   - Hungarian developer groups

3. **Create use case blog posts**:
   - "How to optimize industrial energy costs with MAVIR data"
   - "Tracking renewable energy penetration in Hungary"
   - "Electricity price forecasting for traders"

4. **Build related actors**:
   - Hungarian Gas Price Monitor
   - EU Energy Price Aggregator
   - Carbon Credit Price Tracker

## 🐛 Testing Locally

```bash
# Install dependencies
npm install

# Set Apify token (optional, for local testing)
export APIFY_TOKEN=your_token_here

# Run locally
npm start
```

## 🔗 Useful Links

- [Apify Documentation](https://docs.apify.com)
- [Actor Publishing Guide](https://docs.apify.com/platform/actors/publishing)
- [Apify Pricing Models](https://docs.apify.com/platform/actors/running/usage-and-resources)
- [MAVIR Official Website](https://www.mavir.hu)

---

**Next Steps**: After deploying MAVIR Monitor, build the **EU Gas Storage Monitor** (2nd highest priority) 🚀
