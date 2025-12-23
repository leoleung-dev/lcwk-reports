# app/api/sales/route.js

## Purpose
API for CRUD operations on sales entries.

## Exports
- `GET(request)`
- `POST(request)`
- `PATCH(request)`
- `DELETE(request)`

## Functions
- `isValidMonth(value)`
  - Purpose: Validate month strings.
  - Behavior: Accepts `YYYY-MM`.
  - Usage: Used by `GET` when filtering by month.

- `isValidYear(value)`
  - Purpose: Validate year strings.
  - Behavior: Accepts `YYYY`.
  - Usage: Used by `GET` when filtering by year.

- `isValidDate(value)`
  - Purpose: Validate date strings.
  - Behavior: Accepts `YYYY-MM-DD` and checks for a valid date.
  - Usage: Used by `POST`/`PATCH`.

- `monthToKey(monthValue)`
  - Purpose: Convert `YYYY-MM` to a compact `YYMM` key.
  - Behavior: Slices the year to the last two digits.
  - Usage: Used to match the `entry_month` storage format.

- `GET(request)`
  - Purpose: Fetch sales entries by month or year.
  - Behavior: Requires `month` or `year` query param, validates it, and returns sorted rows.
  - Usage: Called by sales list views and summaries.
  - Query params: `month=YYYY-MM` or `year=YYYY`
  - Response: `{ entries: [{ id, entry_date, reference, client_name, cost_hkd, service }] }`.

- `POST(request)`
  - Purpose: Create a new sales entry and auto-generate a reference number.
  - Behavior: Validates input, determines the next sequence for the month, inserts the record, and returns it.
  - Usage: Called by the sales entry form and bulk import.
  - Request body: `{ entryDate, clientName, serviceId, costHkd }`
  - Response: `{ entry }` on success, `{ error }` on failure.

- `PATCH(request)`
  - Purpose: Update an existing sales entry.
  - Behavior: Validates input, updates the row, and returns the updated record.
  - Usage: Called by the edit modal.
  - Request body: `{ id, entryDate, clientName, serviceId, costHkd }`
  - Response: `{ entry }` or `{ error }` with 400/404/500.

- `DELETE(request)`
  - Purpose: Delete a sales entry by id.
  - Behavior: Accepts `id` via query or JSON body, deletes the row, and returns success.
  - Usage: Called by the edit modal delete action.
  - Response: `{ success: true }` or `{ error }`.
