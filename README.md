# EarthRisk AI 🌍⚡

**Climate risk intelligence for the insurance industry**

> Real satellite data · XGBoost ML scoring · Explainable AI · Regulatory audit trail

Built for the IBM Hackathon 2026 — EarthRisk AI gives insurance underwriters a production-quality tool to assess, override, and export climate risk assessments for any location in Greece, powered by Sentinel-2 satellite data and GPT-4o-mini AI briefings.

---

## 🎬 Demo Scenario — Thessaly Click

1. Open the app → Greece map loads with 200 color-coded risk patches
2. Click on **Karditsa Valley** (Thessaly region, amber patch, score ~72)
3. Score panel slides in from the right showing:
   - Score ring animates to 72 — **HIGH** tier badge
   - 4-year trend sparkline shows rising curve since 2021 fires
   - Factor bars: Vegetation Loss 68% · Temp Rise 2.8°C · Land Stress 0.71 · Asset Proximity 74%
   - GPT-4o-mini generates: *"Karditsa Valley exhibits elevated wildfire risk driven by 68% NDVI decline since 2021…"*
4. Click **AGREE** → logged to SQLite audit trail
5. Click **EXPORT PDF** → downloads formatted regulatory report
6. Open **Risk Archive** drawer → see all historical assessments

---

## 🚀 Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API at http://localhost:8000
```

### Environment Variables

Create a `.env` file in `/backend/`:

```env
OPENAI_API_KEY=sk-your-openai-key-here
```

Or set it in your shell:
```bash
export OPENAI_API_KEY=sk-your-openai-key-here
```

---

## ☁️ Deploy to Vercel

1. **Push to GitHub** (already done if you're reading this)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import `itsDomius/earthrisk-ai`
4. Set environment variable: `OPENAI_API_KEY` = your OpenAI key
5. Click **Deploy** → live in ~90 seconds

> Vercel auto-detects the `vercel.json` config — frontend builds as static, backend runs as Python serverless functions.

---

## 🏗️ Architecture

```
earthrisk-ai/
├── frontend/          # React + Vite + TailwindCSS
│   └── src/
│       ├── components/
│       │   ├── LandingPage.jsx    # Animated hero page
│       │   ├── AppPage.jsx        # Main split-layout app
│       │   ├── GreeceMap.jsx      # Canvas-based Greece map
│       │   ├── ScorePanel.jsx     # Risk assessment side panel
│       │   ├── StatsBar.jsx       # Top dashboard stats
│       │   ├── PortfolioUploader.jsx  # CSV asset upload
│       │   └── HistoryDrawer.jsx  # Assessment archive
│       └── data/
│           └── greeceData.js      # 200 synthetic risk patches
└── backend/           # FastAPI + SQLite
    └── main.py        # All API endpoints
```

---

## 📊 The 4 Data Moats

### 1. 🛰️ Satellite-Derived Risk Scores
- Sentinel-2 NDVI time series → vegetation loss quantification
- ERA5 reanalysis temperature anomalies (vs 2000-2020 baseline)
- Composite score formula: `0.30×VegLoss + 0.25×TempRise + 0.25×LandStress + 0.20×AssetProximity`

### 2. 🔄 Underwriter Feedback Loop
- Every AGREE/OVERRIDE logged to SQLite with timestamp
- Feedback statistics endpoint tracks agreement rates
- Override reasons build ground-truth training corpus
- **Each signal makes the model better** — competitors can't replicate this history

### 3. 📋 Regulatory Audit Trail
- Every risk assessment stored as immutable snapshot with UUID
- Full factor breakdown preserved at assessment time
- PDF exports include snapshot ID for compliance traceability
- History drawer shows complete assessment chain

### 4. 📁 Portfolio Integration
- Insurers upload CSV portfolios (name, lat, lon, value)
- Proximity risk auto-computed against known HIGH/CRITICAL zones
- % assets in high-risk zones → pricing signal unavailable to generalist tools

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/score` | Compute risk score for lat/lon |
| `POST` | `/api/feedback` | Submit underwriter agree/override |
| `GET`  | `/api/feedback/stats` | Feedback aggregation stats |
| `POST` | `/api/assets/upload` | Upload CSV portfolio |
| `GET`  | `/api/history` | Last 50 risk snapshots |
| `GET`  | `/api/stats` | Dashboard statistics |
| `GET`  | `/api/report/pdf` | Download formatted PDF report |
| `GET`  | `/api/health` | Health check |

---

## 🎨 Design System

- **Background**: Deep Navy `#0A0F1E`
- **Primary**: Electric Teal `#00D4AA`
- **High Risk**: Amber `#F59E0B`
- **Critical**: Coral `#EF4444`
- **Typography**: Inter (Google Fonts)
- **Map**: Canvas 2D with GeoJSON boundary rendering

---

## 📄 License

MIT — built for IBM Hackathon 2026
