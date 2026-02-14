# app/api/hkfh-sales/years/route.js

## Purpose
Returns the list of available years for Hong Kong branch sales data.

## Route
- `GET /api/hkfh-sales/years`
  - Purpose: Load distinct years from `hkfh_sales_entries`.
  - Behavior: Requires auth, applies rate limiting, and returns years in descending order.
