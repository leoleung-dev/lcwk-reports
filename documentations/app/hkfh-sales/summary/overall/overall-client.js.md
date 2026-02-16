# app/hkfh-sales/summary/overall/overall-client.js

## Purpose
Client-side cross-year summary for Hong Kong branch sales.

## Main behavior
- Loads years from `/api/hkfh-sales/years`.
- Loads per-year data from `/api/hkfh-sales?year=YYYY`.
- Reads and writes selected comparison years via `?year=YYYY,YYYY` in the URL for shareable preselected links.
- Aggregates:
  - Year totals
  - Monthly totals per year
  - Agent totals per year and across all years
- Renders:
  - Page title `香港分店 營業額 跨年總結`.
  - Renamed sections/charts for yearly totals, cross-year monthly comparison, all-years `經手人` totals, and yearly summary table.
  - Year total bar and trend charts (with chart titles; ordered oldest year on the left to newest on the right).
  - Monthly versus trendline for selected years (with chart title).
  - All-years pie by `經手人` (with chart title).
  - Year summary table with top `經手人`.
- Trendline points/paths provide hover tooltips with series/month/value and a rounded left Y-axis amount scale with abbreviated labels (e.g., `1k`, `2m`).
