# app/api/sales/export/route.js

## Purpose
Generates Excel exports for sales data (monthly or yearly).

## Exports
- `GET(request)`

## Functions
- `isValidMonth(value)`
  - Purpose: Validate month strings.
  - Behavior: Accepts `YYYY-MM`.
  - Usage: Used when `month` is supplied.

- `isValidYear(value)`
  - Purpose: Validate year strings.
  - Behavior: Accepts `YYYY`.
  - Usage: Used when `year` is supplied.

- `monthToKey(monthValue)`
  - Purpose: Convert `YYYY-MM` to a compact `YYMM` key.
  - Behavior: Slices the year to the last two digits.
  - Usage: Used for monthly queries.

- `monthKeyToLabel(value)`
  - Purpose: Convert a `YYMM` key to `YYYY-MM`.
  - Behavior: Prefixes with `20` and inserts a dash.
  - Usage: Used when exporting yearly data.

- `formatDate(value)`
  - Purpose: Normalize date strings for export.
  - Behavior: Strips time from ISO strings and returns empty string for falsy input.
  - Usage: Used when building worksheet rows.

- `GET(request)`
  - Purpose: Build an `.xlsx` file for a month or year.
  - Behavior walkthrough:
    - Validates `month` or `year` query params.
    - Queries sales data for the selected range.
    - Builds a worksheet with header row and data.
    - Formats date and cost cells, adds a total row, and sets an autofilter.
    - Returns the workbook as a binary response.
  - Query params: `month=YYYY-MM` or `year=YYYY`.
  - Response: Excel file with `Content-Disposition` filename and MIME type.
