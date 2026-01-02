# app/commission/[year]/summary/page.js

## Purpose
Redirect entry point for the legacy commission summary route.

## Exports
- `CommissionSummaryPage({ params })`

## Functions
- `CommissionSummaryPage({ params })`
  - Purpose: Redirect legacy `/commission/{year}/summary` traffic to the new route.
  - Behavior: Awaits `params`, validates `year`, and redirects to `/commission/summary/{year}` (or `/commission` if missing).
  - Usage: Used by Next.js for `/commission/{year}/summary`.
