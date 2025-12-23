# app/sales/[year]/page.js

## Purpose
Server entry point for the yearly sales page. It passes the route parameter into the client component.

## Exports
- `SalesPage({ params })`

## Functions
- `SalesPage({ params })`
  - Purpose: Resolve dynamic route params and render the sales client.
  - Behavior: Awaits `params` (Next.js async params) and passes `year` to `SalesClient`.
  - Usage: Used by Next.js for `/sales/{year}`.
