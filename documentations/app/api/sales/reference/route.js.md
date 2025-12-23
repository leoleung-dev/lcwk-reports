# app/api/sales/reference/route.js

## Purpose
Generates the next reference number for a given sales entry date.

## Exports
- `GET(request)`

## Functions
- `isValidDate(value)`
  - Purpose: Validate a date string.
  - Behavior: Accepts `YYYY-MM-DD` and checks if the date is valid.
  - Usage: Used to validate the `date` query param.

- `monthToKey(monthValue)`
  - Purpose: Convert `YYYY-MM` to a compact `YYMM` key.
  - Behavior: Slices the year to the last two digits.
  - Usage: Used to match the `entry_month` storage format.

- `GET(request)`
  - Purpose: Return the next reference for the specified date.
  - Behavior: Finds the max sequence for the month, increments it, and builds a reference like `001/YYMM`.
  - Usage: Called by the sales entry form when the date changes.
  - Query params: `date=YYYY-MM-DD`
  - Response: `{ reference, entryMonth, nextSeq }` or `{ error }`.
