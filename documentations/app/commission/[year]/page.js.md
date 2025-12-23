# app/commission/[year]/page.js

## Purpose
Server entry point for the yearly commission page. It passes the route parameter into the client component.

## Exports
- `CommissionPage({ params })`

## Functions
- `CommissionPage({ params })`
  - Purpose: Resolve dynamic route params and render the commission client.
  - Behavior: Awaits `params` and passes `year` to `CommissionClient`.
  - Usage: Used by Next.js for `/commission/{year}`.
