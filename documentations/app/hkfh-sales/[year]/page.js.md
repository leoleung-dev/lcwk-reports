# app/hkfh-sales/[year]/page.js

## Purpose
Server entry point for the yearly Hong Kong branch sales page.

## Exports
- `HkfhSalesPage({ params })`

## Functions
- `HkfhSalesPage({ params })`
  - Purpose: Resolve dynamic route params and render the client component.
  - Behavior: Awaits async `params` and passes `year` into `HkfhSalesClient`.
  - Usage: Used by Next.js for `/hkfh-sales/{year}`.
