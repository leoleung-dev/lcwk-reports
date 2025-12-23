# app/sales/page.js

## Purpose
Redirects `/sales` to the current year view.

## Exports
- `SalesRedirect()`

## Functions
- `SalesRedirect()`
  - Purpose: Compute the current year and redirect to `/sales/{year}`.
  - Behavior: Uses Next.js `redirect` for a server-side redirect.
  - Usage: Automatically invoked for the `/sales` route.
