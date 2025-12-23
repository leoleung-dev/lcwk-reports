# app/api/commission/export/route.js

## Purpose
Generates Excel exports for commission data (monthly or yearly), including formulas and totals.

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

- `GET(request)`
  - Purpose: Build an `.xlsx` file for a month or year.
  - Behavior walkthrough:
    - Validates `month` or `year` query params.
    - Queries commission data for the selected range.
    - Builds a worksheet with header row and data.
    - Adds formulas for 總計 and Total Commission, applies `$`/`%` formats, and appends a total row.
    - Sets an autofilter range for the header.
  - Query params: `month=YYYY-MM` or `year=YYYY`.
  - Response: Excel file with `Content-Disposition` filename and MIME type.
