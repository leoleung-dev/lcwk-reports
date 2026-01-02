# app/sales/[year]/summary/summary-client.js

## Purpose
Client-side annual sales summary view. It renders monthly bar charts, a service-mix pie chart, a month selector, and a detailed entries table. It also supports exporting a month or the entire year.

## Exports
- `SummaryClient({ year })`

## Functions
- `formatMoney(value)`
  - Purpose: Format numeric values as `$` currency with two decimals.
  - Behavior: Coerces falsy values to `0` and formats using `Intl.NumberFormat`.
  - Usage: Used across charts and tables for money display.

- `formatPercent(value)`
  - Purpose: Format a ratio as a percent string.
  - Behavior: Multiplies by 100, keeps one decimal, trims trailing `.0`.
  - Usage: Used in the pie legend to show share of totals.

- `isValidYear(value)`
  - Purpose: Validate a year string.
  - Behavior: Ensures the year matches `YYYY`.
  - Usage: Guards the `year` prop when building routes and defaults.

- `formatDate(value)`
  - Purpose: Normalize date values for table display.
  - Behavior: Strips time from ISO strings, returns empty string for falsy input.
  - Usage: Used when rendering entry rows.

- `SummaryClient({ year })`
  - Purpose: Main client component for the sales summary screen.
  - Behavior walkthrough:
    - Determines the active year and defaults selection to `all` (All Year).
    - Fetches summary totals via `/api/sales/summary?year=YYYY`.
    - Loads entries via `/api/sales?month=YYYY-MM` or `/api/sales?year=YYYY` depending on the selected month.
    - Builds bar chart heights and pie breakdown from loaded data.
    - Allows month selection via tabs and chart clicks; “All Year” clears focus.
  - Usage: Rendered by `app/sales/summary/[year]/page.js` (legacy route redirects).

- `handleExportSelection()`
  - Purpose: Export either the selected month or the entire year.
  - Behavior: Navigates to `/api/sales/export?month=...` or `/api/sales/export?year=...`.
  - Usage: Bound to the “Export month/year” button.

- `handleExportYear()`
  - Purpose: Dedicated year export action.
  - Behavior: Navigates to `/api/sales/export?year=YYYY`.
  - Usage: Bound to the header “Export year” button.

- `loadSummary()`
  - Purpose: Fetch monthly totals for the selected year.
  - Behavior: Calls the summary API, updates `months`, and sets error state on failure.
  - Usage: Invoked in a `useEffect` when `year` changes.

- `loadEntries()`
  - Purpose: Fetch detailed sales entries for the selected month or year.
  - Behavior: Switches between month and year API calls, updates `entries`, and reports errors.
  - Usage: Invoked in a `useEffect` when `selectedMonth` changes.
