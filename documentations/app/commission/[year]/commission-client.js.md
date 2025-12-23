# app/commission/[year]/commission-client.js

## Purpose
Primary client component for the commission report. It handles entry creation, editing, deletion, bulk import, handler management, and monthly navigation.

## Exports
- `CommissionClient({ year })`

## Functions
- `formatMoney(value)`
  - Purpose: Format numeric values as `$` currency with two decimals.
  - Behavior: Converts falsy values to `0` and formats via `Intl.NumberFormat`.
  - Usage: Used in stats, tables, and totals.

- `isValidYear(value)`
  - Purpose: Validate the year param.
  - Behavior: Accepts only `YYYY`.
  - Usage: Guards `year` prop and fallback logic.

- `getCurrentMonth()`
  - Purpose: Return the current month as `YYYY-MM`.
  - Behavior: Uses `Date` and zero-padded month.
  - Usage: Used for initial month selection.

- `getInitialMonth(year)`
  - Purpose: Choose the initial month for the selected year.
  - Behavior: Uses the current month if it matches the year, otherwise `YYYY-01`.
  - Usage: Seed `month` state.

- `getSexagenaryYearLabel(yearValue)`
  - Purpose: Produce the Chinese sexagenary year label (歲次...).
  - Behavior: Computes stem/branch from a 60-year cycle anchored at 1984.
  - Usage: Displays the year label above month tabs.

- `parseTsvLine(line)`
  - Purpose: Parse tab-separated lines while honoring quoted fields.
  - Behavior: Splits on tabs unless inside quotes; handles escaped quotes.
  - Usage: Used by bulk import parsing.

- `splitColumns(line)`
  - Purpose: Split pasted rows into columns for bulk import.
  - Behavior: Prefers TSV parsing; falls back to splitting on multiple spaces.
  - Usage: Used by bulk import to support different paste formats.

- `parseCurrency(value)`
  - Purpose: Convert a currency string to a numeric value.
  - Behavior: Removes commas, spaces, `$`, and returns `0` for empty values.
  - Usage: Used to parse monetary columns in bulk import rows.

- `parseRate(value, total, totalCommission)`
  - Purpose: Derive a commission rate from text or totals.
  - Behavior: Parses percent strings, accepts decimals, or computes from total/commission when missing.
  - Usage: Used when bulk rows supply totals instead of explicit rate.

- `parsePercent(value)`
  - Purpose: Convert a percent string into a decimal rate.
  - Behavior: Strips `%` and spaces, divides by 100, returns `NaN` on invalid input.
  - Usage: Used by the form and edit modal.

- `formatPercent(value)`
  - Purpose: Format a decimal commission rate for display.
  - Behavior: Converts a decimal to `xx%` with trimmed decimals.
  - Usage: Used when pre-filling edit modal rates.

- `CommissionClient({ year })`
  - Purpose: Main commission entry experience.
  - Behavior walkthrough:
    - Resolves the selected year and initial month.
    - Loads handler list and monthly entries.
    - Calculates totals and commission values live in the form.
    - Supports handler creation on the fly when names are not found.
    - Enables editing/deleting entries via a modal.
    - Supports bulk import when `NEXT_PUBLIC_COMMISSION_BULK_ENTRY` is enabled.
  - Usage: Rendered by `app/commission/[year]/page.js`.

- `loadHandlers()`
  - Purpose: Fetch the list of active handlers.
  - Behavior: Calls `GET /api/handlers`, updates state, and reports errors.
  - Usage: Invoked on mount.

- `loadEntries(targetMonth)`
  - Purpose: Fetch monthly commission entries.
  - Behavior: Calls `GET /api/commission?month=...` and updates state.
  - Usage: Invoked when the active month changes.

- `ensureHandlerId(name)`
  - Purpose: Resolve a handler name to an ID, creating it if missing.
  - Behavior: Looks up in state; POSTs to `/api/handlers` if not found.
  - Usage: Used by create/edit flows and bulk import.

- `handleSubmit(event)`
  - Purpose: Submit a new commission entry.
  - Behavior: Validates commission rate, resolves handler ID, POSTs `/api/commission`, and refreshes entries.
  - Usage: Bound to the new entry form.

- `updateEntry({ id, month, clientName, handlerName, itemShroud, itemQuilt, itemOther, commissionRate })`
  - Purpose: Update an existing commission entry.
  - Behavior: Resolves handler ID and PATCHes `/api/commission`.
  - Usage: Called by `handleEditSave`.

- `openEdit(entry)`
  - Purpose: Open the edit modal with the selected entry data.
  - Behavior: Populates edit state and resets status.
  - Usage: Triggered by edit buttons.

- `handleEditSave()`
  - Purpose: Persist edits for the selected entry.
  - Behavior: Validates input, PATCHes the entry, reloads entries, and updates status.
  - Usage: Bound to the edit modal “Save changes” button.

- `handleDeleteEntry()`
  - Purpose: Delete the current entry from the edit modal.
  - Behavior: Confirms via `window.confirm`, DELETEs `/api/commission`, and refreshes entries.
  - Usage: Bound to the edit modal “Delete” button.

- `handleBulkImport()`
  - Purpose: Import many commission entries from pasted rows.
  - Behavior: Parses rows, derives rate and totals, creates entries sequentially, and refreshes month data.
  - Usage: Triggered by the “Import rows” button.

- `handleExport()`
  - Purpose: Export the currently selected month to Excel.
  - Behavior: Navigates to `/api/commission/export?month=...`.
  - Usage: Bound to the “Export Excel” button.
