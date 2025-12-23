# app/admin/handlers/page.js

## Purpose
Admin page for maintaining commission handlers used in the commission report.

## Exports
- `HandlersAdmin()`

## Functions
- `HandlersAdmin()`
  - Purpose: Client component to list and add handlers.
  - Behavior: Loads handlers on mount, renders a form, and shows the current list.
  - Usage: Routed at `/admin/handlers`.

- `loadHandlers()`
  - Purpose: Fetch the active handlers list from the API.
  - Behavior: Calls `GET /api/handlers`, updates `handlers` state, and sets a status on failure.
  - Usage: Invoked on mount and when the user clicks “Refresh list”.

- `handleSubmit(event)`
  - Purpose: Submit a new handler name.
  - Behavior: POSTs to `/api/handlers`, appends the new handler to state, clears the input, and surfaces errors.
  - Usage: Bound to the form `onSubmit` event.
