# app/commission/[year]/summary/summary-client.js

## Purpose
Client-side annual commission summary with charts, tables, and a toggle between sales totals and commission totals.

## Exports
- `SummaryClient({ year })`

## Functions
- `isValidYear(value)`
  - Purpose: Validate a year string.
  - Behavior: Ensures the year matches `YYYY`.
  - Usage: Guards the `year` prop and route links.

- `formatMoney(value)`
  - Purpose: Format numeric values as `$` currency.
  - Behavior: Returns `-` for null/undefined and formats with two decimals.
  - Usage: Used across charts and tables.

- `formatPercent(value)`
  - Purpose: Format a ratio as a percent string.
  - Behavior: Multiplies by 100 and trims trailing `.0`.
  - Usage: Used in the pie legend to show share of totals.

- `SummaryClient({ year })`
  - Purpose: Main commission summary UI.
  - Behavior walkthrough:
    - Loads summary data from `/api/commission/summary?year=YYYY`.
    - Builds totals by month and handler, case counts, and overall totals.
    - Allows switching between Sales (總計) and Commission (Total Commission) metrics.
    - Uses month tabs and bar-chart clicks to focus a specific month or “All Year”.
    - Renders charts on top and table summaries below.
  - Usage: Rendered by `app/commission/[year]/summary/page.js`.

- `handleExportYear()`
  - Purpose: Export the entire year of commission entries.
  - Behavior: Navigates to `/api/commission/export?year=YYYY`.
  - Usage: Bound to the header “Export year” button.

- `loadSummary()`
  - Purpose: Fetch the commission summary dataset.
  - Behavior: Updates month list and row data, sets error state on failure.
  - Usage: Invoked in a `useEffect` when `year` changes.
