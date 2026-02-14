# app/hkfh-sales/[year]/hkfh-sales-client.js

## Purpose
Client-side yearly matrix editor for Hong Kong branch sales by staff.

## Main behavior
- Loads yearly rows from `/api/hkfh-sales?year=YYYY`.
- Renders a spreadsheet-like table with:
  - `經手人` name column
  - 12 month amount columns rendered as currency inputs (`$` prefix on the left; formatted with thousands separators and 2 decimals when not focused; auto-selects full cell value on focus/tab)
  - row subtotal
  - yearly totals footer
- Supports adding/removing rows and autosaves edits with a short debounce; manual Save remains available.
- Includes a direct link to `/hkfh-sales/summary/{year}` for annual summary charts/tables.
- Ignores fully empty rows during save and validates:
  - staff name is present for non-empty rows
  - staff name whitespace is removed (`經手人` cannot contain spaces/tabs/newlines)
  - names are unique
  - amounts are zero or positive

## API usage
- `GET /api/hkfh-sales?year=YYYY` for initial load.
- `POST /api/hkfh-sales` with `{ year, entries }` to persist the full year.
