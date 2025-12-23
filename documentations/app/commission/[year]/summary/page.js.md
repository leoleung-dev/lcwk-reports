# app/commission/[year]/summary/page.js

## Purpose
Server entry point for the commission annual summary page.

## Exports
- `CommissionSummaryPage({ params })`

## Functions
- `CommissionSummaryPage({ params })`
  - Purpose: Resolve the `year` param and render the summary client.
  - Behavior: Awaits `params` and passes `year` into `SummaryClient`.
  - Usage: Used by Next.js for `/commission/{year}/summary`.
