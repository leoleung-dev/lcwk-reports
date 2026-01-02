# app/sales/[year]/summary/page.js

## Purpose
Legacy entry point that redirects to the new sales summary route.

## Exports
- `SalesSummaryPage({ params })`

## Functions
- `SalesSummaryPage({ params })`
  - Purpose: Resolve the `year` param and redirect to the new summary page.
  - Behavior: Awaits `params` and redirects to `/sales/summary/{year}`, falling back to `/sales` if missing.
  - Usage: Used by Next.js for the legacy `/sales/{year}/summary` route.
