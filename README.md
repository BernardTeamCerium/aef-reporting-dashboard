# Allied Elite Financial — Digital Campaign Dashboard

A lightweight dashboard for reporting Allied Elite Financial's digital marketing
numbers. Update metrics by hand or upload an Excel/CSV export, and see everything
visualized on a branded dashboard. No backend, no build step, no accounts — it's
a single static site and your data is stored in your browser.

Styled with the Allied Elite Financial brand system: the mint→blue gradient mark,
navy wordmark with the "An AmeriLife Company" tagline, Satoshi typeface, soft
"panel" cards, pill controls, and light **and** dark themes.

> The logo at `assets/logo.svg` is a faithful gradient recreation of the AE mark.
> To use the exact official artwork, drop the official `.svg` (or `.png`) in at
> `assets/logo.svg` — nothing else needs to change.

## Features

- **Hero + KPI overview** — Total Spend, Revenue, ROAS, Conversions (with CPA),
  and CTR (with clicks).
- **Charts** — Spend vs. revenue over time (with month-over-month badge), spend
  by channel, conversions & CTR by month, and top campaigns by ROAS.
- **Manual entry** — Add, edit, and delete campaign records with a simple form.
- **Excel / CSV import** — Upload one or more files. Columns are matched by name
  (case-insensitive), so order doesn't matter, and common variants are
  recognized (e.g. `Cost` → Spend, `Platform` → Channel, `Amount spent` → Spend).
- **Filters** — Search, plus filter by channel and by month.
- **Export** — Download a CSV of all records with calculated CTR, CPC, CPA, ROAS.
- **Light / dark theme** — Respects your system preference; toggle with ◐.
- **Auto-calculated metrics** — CTR, CPC, CPA, and ROAS are derived for you.

## Run it locally

It's just static files:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly works too.)

## Hosting (GitHub Pages)

This repo ships a workflow at `.github/workflows/deploy-pages.yml` that
publishes the site to GitHub Pages.

**One-time setup** (GitHub doesn't let the workflow enable Pages on its own):

1. Repo **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
2. Merge this branch into `main` (or click **Actions → Deploy to GitHub Pages →
   Run workflow**).

After that, every push to `main` redeploys automatically. The site will be at:

```
https://bernardteamcerium.github.io/aef-reporting-dashboard/
```

## Spreadsheet format

Use the in-app **Download template** button, or match these headers (any order,
case-insensitive):

| Date | Campaign | Channel | Impressions | Clicks | Spend | Conversions | Revenue |
|------|----------|---------|-------------|--------|-------|-------------|---------|

`CTR`, `CPC`, `CPA`, and `ROAS` are calculated automatically.

## Where is my data stored?

In your browser's `localStorage` under the key `aef_marketing_campaigns_v2`.
Data stays on the machine/browser you entered it on. To move or share it, use
**Export CSV**. (If you need multiple people to see the *same* live numbers,
that needs a shared backend or data source — happy to add one.)

## Tech

Plain HTML/CSS/JS. Charts via [Chart.js](https://www.chartjs.org/), spreadsheet
parsing via [SheetJS](https://sheetjs.com/), Satoshi via
[Fontshare](https://www.fontshare.com/). All loaded from a CDN.
