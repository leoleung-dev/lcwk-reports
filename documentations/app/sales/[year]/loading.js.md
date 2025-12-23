# app/sales/[year]/loading.js

## Purpose
Suspense loading UI for the sales page when Next.js is streaming or switching routes.

## Exports
- `Loading()`

## Functions
- `Loading()`
  - Purpose: Render a spinner and loading label for the sales report.
  - Behavior: Uses shared sales styles to keep the loading UI consistent.
  - Usage: Automatically picked up by Next.js for `/sales/{year}` loading states.
