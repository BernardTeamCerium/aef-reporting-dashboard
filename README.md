# AEF — Digital Marketing Dashboard

A lightweight dashboard for reporting your digital campaign numbers. Update
metrics manually or upload an Excel/CSV file, and see everything visualized
on a dashboard. No backend, no build step, no accounts — it's a single static
site and your data is stored in your browser.

## Features

- **Dashboard view** — KPI cards (Spend, Revenue, Impressions, Conversions) plus
  charts: spend vs. revenue trend, spend by channel, conversions by channel, and
  top campaigns by ROAS.
- **Manual entry** — Add, edit, and delete campaign records with a simple form.
- **Excel / CSV import** — Drag & drop a spreadsheet. Columns are matched by
  name (case-insensitive), so column order doesn't matter. Common header
  spellings (e.g. `Cost` → Spend, `Platform` → Channel) are recognized.
- **Filters** — By channel and by month.
- **Export & backup** — Download a CSV of all records (with calculated CTR, CPC,
  CPA, ROAS) or a JSON backup you can restore later.
- **Auto-calculated metrics** — CTR, CPC, CPA, and ROAS are derived for you.

## Run it

It's just static files. Either:

- **Open directly:** double-click `index.html`, **or**
- **Serve locally** (recommended so file drag/drop and fonts work smoothly):

  ```bash
  python3 -m http.server 8000
  # then open http://localhost:8000
  ```

## Deploy free on GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Pick your branch and `/ (root)`, then save. Your dashboard will be live at
   `https://<user>.github.io/<repo>/`.

## Spreadsheet format

Use the in-app **Download template** button, or match these headers (any order,
case-insensitive):

| Date | Campaign | Channel | Impressions | Clicks | Spend | Conversions | Revenue |
|------|----------|---------|-------------|--------|-------|-------------|---------|

`CTR`, `CPC`, `CPA`, and `ROAS` are calculated automatically and don't need to
be in your file.

## Where is my data stored?

In your browser's `localStorage` under the key `aef_marketing_campaigns_v1`.
That means data stays on the machine/browser you entered it on. To move it to
another machine or share it, use **Export JSON (backup)** and **Restore JSON
backup** on the Import / Export tab.

## Tech

Plain HTML/CSS/JS. Charts via [Chart.js](https://www.chartjs.org/), spreadsheet
parsing via [SheetJS](https://sheetjs.com/), both loaded from a CDN.
