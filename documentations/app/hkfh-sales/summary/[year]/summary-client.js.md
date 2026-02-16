# app/hkfh-sales/summary/[year]/summary-client.js

## Purpose
Client-side yearly summary for Hong Kong branch sales.

## Main behavior
- Loads yearly entries from `/api/hkfh-sales?year=YYYY`.
- Renders:
  - Page title `香港分店 營業額 {year}年 年度總結`.
  - Summary table by `經手人` with Jan-Dec and row totals.
  - Footer totals row with monthly totals and annual total.
  - Total pie by `經手人` with heading `香港分店 營業額 {year}年 經手者營業額`.
  - Total trend line and total monthly bar charts with headings `{year}年 每月營業額 趨勢` / `{year}年 每月營業額`.
  - Selected-agent trend line and selected-agent monthly bar charts with headings `{year}年 經手者每月營業額趨勢` / `{year}年 經手者每月營業額`.
  - Trendline hover tooltips on data points/paths plus a rounded left Y-axis amount scale (abbreviated labels like `1k`, `2m`).
- Supports switching year and navigating to overall summary.
