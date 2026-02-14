# app/api/hkfh-sales/route.js

## Purpose
API for loading and saving the Hong Kong branch yearly sales matrix.

## Route
- `GET /api/hkfh-sales?year=YYYY`
  - Purpose: Return all staff rows for the selected year.
  - Behavior: Validates year, requires auth, loads rows from `hkfh_sales_entries`, and returns monthly amounts plus audit metadata.

- `POST /api/hkfh-sales`
  - Purpose: Upsert the full yearly matrix for the selected year.
  - Behavior: Validates `year` + `entries`, normalizes `staffName` by stripping whitespace, upserts rows by `(entry_year, staff_name)`, updates row order, and removes rows omitted from the submitted set.

## Notes
- Uses rate limiting and allowlist-based auth (`requireAuth`).
- Stores month values in `amount_01` ... `amount_12` columns.
