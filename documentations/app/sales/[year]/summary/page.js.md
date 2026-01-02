# app/sales/[year]/summary/page.js

## Purpose
Server entry point for the sales annual summary page.

## Exports
- `SalesSummaryPage({ params })`

## Functions
- `SalesSummaryPage({ params })`
  - Purpose: Resolve the `year` param and render the summary client.
  - Behavior: Awaits `params` and passes `year` into `SummaryClient`.
  - Usage: Used by Next.js for `/sales/{year}/summary`.
