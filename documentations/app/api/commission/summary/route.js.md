# app/api/commission/summary/route.js

## Purpose
Returns monthly and per-handler aggregates for commission summary views.

## Exports
- `GET(request)`

## Functions
- `isValidYear(value)`
  - Purpose: Validate a year string.
  - Behavior: Accepts `YYYY`.
  - Usage: Used to validate the query param.

- `GET(request)`
  - Purpose: Aggregate commission totals and counts by month and handler.
  - Behavior: Joins entries with handlers, aggregates totals and commission totals, and returns a flattened row set with a separate `months` array.
  - Usage: Called by the commission summary client.
  - Query params: `year=YYYY`.
  - Response: `{ months: [YYYY-MM], rows: [{ month, handler, count, total, total_commission }] }`.
