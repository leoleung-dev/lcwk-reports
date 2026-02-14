# app/hkfh-sales/summary/[year]/summary-client.js

## Purpose
Client-side yearly summary for Hong Kong branch sales.

## Main behavior
- Loads yearly entries from `/api/hkfh-sales?year=YYYY`.
- Renders:
  - Summary table by `經手人` with Jan-Dec and row totals.
  - Footer totals row with monthly totals and annual total.
  - Total pie by `經手人`.
  - Total trend line and total monthly bar charts (with explicit chart titles).
  - Selected-agent trend line and selected-agent monthly bar charts (with explicit chart titles).
  - Trendline hover tooltips on data points/paths plus a rounded left Y-axis amount scale (abbreviated labels like `1k`, `2m`).
- Supports switching year and navigating to overall summary.
