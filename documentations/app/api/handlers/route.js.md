# app/api/handlers/route.js

## Purpose
API for reading and creating commission handlers used in the commission report.

## Exports
- `GET()`
- `POST(request)`
- `DELETE(request)`

## Functions
- `GET()`
  - Purpose: Return all active handlers.
  - Behavior: Queries `commission_handlers` for `is_active = true` and sorts by name.
  - Usage: Called by the commission form and the handlers admin page.
  - Response: `{ handlers: [{ id, name }] }` or `{ error }` with 500.

- `POST(request)`
  - Purpose: Create or upsert a handler by name.
  - Behavior: Validates `name`, inserts into `commission_handlers`, reactivates inactive records on conflict, and returns the record.
  - Usage: Called when staff add a handler or type a new name in the commission form.
  - Request body: `{ name: string }`
  - Response: `{ handler: { id, name } }` or `{ error }` with 400/500.

- `DELETE(request)`
  - Purpose: Deactivate a handler without removing existing references.
  - Behavior: Accepts `id` in the query string or JSON body, sets `is_active = false`, and returns the handler record.
  - Usage: Called by the handlers admin page when removing a handler.
  - Request body: `{ id: number }`
  - Response: `{ handler: { id, name } }` or `{ error }` with 400/404/500.
