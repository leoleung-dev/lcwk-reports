# app/api/handlers/route.js

## Purpose
API for reading and creating commission handlers used in the commission report.

## Exports
- `GET()`
- `POST(request)`

## Functions
- `GET()`
  - Purpose: Return all active handlers.
  - Behavior: Queries `commission_handlers` for `is_active = true` and sorts by name.
  - Usage: Called by the commission form and the handlers admin page.
  - Response: `{ handlers: [{ id, name }] }` or `{ error }` with 500.

- `POST(request)`
  - Purpose: Create or upsert a handler by name.
  - Behavior: Validates `name`, inserts into `commission_handlers`, and returns the record. Uses `ON CONFLICT` to avoid duplicates.
  - Usage: Called when staff add a handler or type a new name in the commission form.
  - Request body: `{ name: string }`
  - Response: `{ handler: { id, name } }` or `{ error }` with 400/500.
