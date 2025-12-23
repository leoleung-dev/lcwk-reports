# app/api/commission/route.js

## Purpose
API for CRUD operations on commission entries.

## Exports
- `GET(request)`
- `POST(request)`
- `PATCH(request)`
- `DELETE(request)`

## Functions
- `isValidMonth(value)`
  - Purpose: Validate month strings.
  - Behavior: Accepts `YYYY-MM`.
  - Usage: Used by `GET` and write validation.

- `monthToKey(monthValue)`
  - Purpose: Convert `YYYY-MM` to a compact `YYMM` key.
  - Behavior: Slices the year to the last two digits.
  - Usage: Used to match the `entry_month` storage format.

- `GET(request)`
  - Purpose: Fetch commission entries by month.
  - Behavior: Validates the `month` query param, joins handlers, and returns sorted rows.
  - Usage: Called by the commission list view.
  - Query params: `month=YYYY-MM`.
  - Response: `{ entries: [{ id, entry_month, client_name, item_shroud, item_quilt, item_other, total, commission_rate, total_commission, handler }] }`.

- `POST(request)`
  - Purpose: Create a new commission entry.
  - Behavior: Validates fields, calculates totals, inserts the row, and returns it joined with handler name.
  - Usage: Called by the commission form and bulk import.
  - Request body: `{ month, clientName, handlerId, itemShroud, itemQuilt, itemOther, commissionRate }`.

- `PATCH(request)`
  - Purpose: Update an existing commission entry.
  - Behavior: Validates fields, recalculates totals, updates the row, and returns the updated record.
  - Usage: Called by the edit modal.
  - Request body: `{ id, month, clientName, handlerId, itemShroud, itemQuilt, itemOther, commissionRate }`.

- `DELETE(request)`
  - Purpose: Delete a commission entry by id.
  - Behavior: Accepts `id` via query or JSON body, deletes the row, and returns success.
  - Usage: Called by the edit modal delete action.
