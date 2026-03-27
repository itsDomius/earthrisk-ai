# EarthRisk AI UX Optimizer

Autonomous experiment loop for improving EarthRisk AI's user experience, map quality, and user value. Modeled on the autoresearch loop pattern (karpathy/autoresearch).

## Setup

1. **Create branch**: `git checkout -b autoresearch/<tag>` (tag = today's date, e.g. `mar27`)
2. **Read in-scope files**: Read all components in `frontend/src/components/` and `frontend/src/data/greeceData.js`
3. **Initialize results.tsv**: Create with header row only — baseline will be recorded after first run

## Metric

**UX Score (1–10)** rated by GPT-4o-mini with this prompt:

```
You are a senior UX expert evaluating a climate risk intelligence web app for insurance underwriters.
Score the following UI/UX improvement from 1–10, where:
10 = exceptional clarity, professional polish, adds clear user value
8–9 = solid improvement, noticeably better UX, clear added value
6–7 = minor improvement, marginal value
1–5 = no improvement, confusing, or actively harmful

Improvement description: {description}
Before state: {before}
After state: {after}

Reply with ONLY: Score: X/10 — {one sentence reason}
```

Use model: `gpt-4o-mini`, `max_tokens=100`, hard limit $0.30 total OpenAI spend.

## Experiment Loop

**LOOP 4 TIMES** (fixed, not infinite):

1. Note current git state (branch + commit)
2. Read current component state
3. Implement ONE focused improvement in the code
4. Build (`cd frontend && npm run build`) — if build fails, fix or discard
5. Score with GPT-4o-mini (max_tokens=100)
6. If score ≥ 8: **KEEP** — commit, record `keep` in results.tsv, advance
7. If score < 8: **DISCARD** — `git checkout` the files, record `discard`
8. Log to results.tsv (tab-separated, NOT comma-separated)

## results.tsv format

```
commit	score	status	description
a1b2c3d	9/10	keep	Satellite map style toggle + heatmap mode
b2c3d4e	8/10	keep	Share button + "What does this mean?" accordion
```

## Variable — Improvements to test (in order)

### Iteration 1 — Map mode toggle (Standard / Risk Heat / Satellite)
Target: `GreeceMap.jsx`
Add a three-way toggle for map basemap + visualization mode:
- Standard: Carto Dark + current scatter dots
- Risk Heat: scatter dots enlarged to heatmap-style blobs
- Satellite: ESRI World Imagery raster tiles + scatter dots

### Iteration 2 — Score panel UX (expandable explain + share)
Target: `ScorePanel.jsx`
- "What does this mean?" expandable section with plain-language risk explanation
- Share button that copies area name + score + tier + 1-line summary to clipboard

### Iteration 3 — Portfolio intelligence
Target: `PortfolioUploader.jsx` + `GreeceMap.jsx`
- Show total value at risk (€ sum of assets where proximity_risk=1)
- Recharts PieChart for risk distribution
- Lines drawn on map from each high-risk asset to nearest critical patch

### Iteration 4 — IBM challenge alignment + Polish
Target: `LandingPage.jsx` + `ScorePanel.jsx` + `AppPage.jsx`
- Landing headline: "Detect how areas change over time. Convert environmental data into explainable insurance risk insights."
- Alert banner in AppPage when selected zone score > 80
- IBM "AI Analysis" badge styling on AI summary box in ScorePanel
- Data Sources footer badge row: Sentinel-2 · ERA5 · XGBoost · Explainable AI

## Constraints

- Only edit `frontend/src/` files
- All map tiles must be free / no-token-required
- Do NOT break existing click/hover/tooltip/feedback/PDF functionality
- Do NOT modify backend
- Build must pass after every kept experiment
