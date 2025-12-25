# app/api/services/route.js

## Purpose
API for reading and creating service catalog entries used by sales.

## Exports
- `GET()`
- `POST(request)`
- `DELETE(request)`

## Functions
- `GET()`
  - Purpose: Return all active services.
  - Behavior: Queries `services` for `is_active = true` and sorts by name.
  - Usage: Called by sales forms and the services admin page.
  - Response: `{ services: [{ id, name }] }` or `{ error }` with 500.

- `POST(request)`
  - Purpose: Create or upsert a service by name.
  - Behavior: Validates the `name` field, inserts into `services`, reactivates inactive records on conflict, and returns the record.
  - Usage: Called when staff add a new service or type a new service in the sales form.
  - Request body: `{ name: string }`
  - Response: `{ service: { id, name } }` or `{ error }` with 400/500.

- `DELETE(request)`
  - Purpose: Deactivate a service without removing existing references.
  - Behavior: Accepts `id` in the query string or JSON body, sets `is_active = false`, and returns the service record.
  - Usage: Called by the services admin page when removing a service.
  - Request body: `{ id: number }`
  - Response: `{ service: { id, name } }` or `{ error }` with 400/404/500.
