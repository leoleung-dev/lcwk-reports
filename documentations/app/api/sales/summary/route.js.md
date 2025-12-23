# app/api/sales/summary/route.js

## Purpose
Returns monthly totals and counts for the sales summary charts.

## Exports
- `GET(request)`

## Functions
- `isValidYear(value)`
  - Purpose: Validate a year string.
  - Behavior: Accepts `YYYY`.
  - Usage: Used to validate the query param.

- `GET(request)`
  - Purpose: Aggregate sales totals by month.
  - Behavior: Queries `sales_entries` for the year, groups by month, and returns a 12-month array with totals and counts (0 for missing months).
  - Usage: Called by the sales summary client.
  - Query params: `year=YYYY`.
  - Response: `{ months: [{ month, count, total }] }` or `{ error }`.
