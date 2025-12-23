# app/admin/services/page.js

## Purpose
Admin page for maintaining the services catalog used in the sales report.

## Exports
- `ServicesAdmin()`

## Functions
- `ServicesAdmin()`
  - Purpose: Client component to list and add services.
  - Behavior: Loads services on mount, renders a form, and shows the current list.
  - Usage: Routed at `/admin/services`.

- `loadServices()`
  - Purpose: Fetch the active services list from the API.
  - Behavior: Calls `GET /api/services`, updates `services` state, and sets a status on failure.
  - Usage: Invoked on mount and when the user clicks “Refresh list”.

- `handleSubmit(event)`
  - Purpose: Submit a new service name.
  - Behavior: POSTs to `/api/services`, appends the new service to state, clears the input, and surfaces errors.
  - Usage: Bound to the form `onSubmit` event.
