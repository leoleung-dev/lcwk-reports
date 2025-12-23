# app/commission/page.js

## Purpose
Redirects `/commission` to the current year view.

## Exports
- `CommissionRedirect()`

## Functions
- `CommissionRedirect()`
  - Purpose: Compute the current year and redirect to `/commission/{year}`.
  - Behavior: Uses Next.js `redirect` for a server-side redirect.
  - Usage: Automatically invoked for the `/commission` route.
