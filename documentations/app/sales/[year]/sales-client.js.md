# app/sales/[year]/sales-client.js

## Purpose
Primary client component for the sales report. It handles entry creation, editing, deletion, sorting, bulk import, service management, and monthly navigation.

## Exports
- `SalesClient({ year })`

## Module-level state
- `cachedServices`: Caches the services list across renders to reduce network calls.
- `entriesCache`: Caches monthly entries by `YYYY-MM` to speed switching between months.

## Functions
- `formatMoney(value)`
  - Purpose: Format numbers as `$` currency with two decimals.
  - Behavior: Converts falsy values to `0` and uses `Intl.NumberFormat`.
  - Usage: Used in tables, stats, and pills.

- `getToday()`
  - Purpose: Return today as a `YYYY-MM-DD` string.
  - Behavior: Pads month/day to two digits.
  - Usage: Used to seed the default entry date.

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
  - Behavior: If the current month matches the year, uses it; otherwise defaults to `YYYY-01`.
  - Usage: Seed `month` state.

- `getInitialEntryDate(year, month)`
  - Purpose: Choose the initial entry date for the form.
  - Behavior: Uses today if it matches the year/month, else uses the first of the selected month.
  - Usage: Seed `entryDate` state.

- `formatDate(value)`
  - Purpose: Normalize date strings for UI.
  - Behavior: Strips time from ISO strings; returns empty string for falsy values.
  - Usage: Used in edit modal and table display.

- `getSexagenaryYearLabel(yearValue)`
  - Purpose: Produce the Chinese sexagenary year label (歲次...).
  - Behavior: Computes stem/branch from a 60-year cycle anchored at 1984.
  - Usage: Displays the year label above month tabs.

- `SalesClient({ year })`
  - Purpose: Main sales entry experience with monthly navigation.
  - Behavior walkthrough:
    - Resolves the selected year and initial month/date.
    - Loads services list (with caching) and month entries (with per-month cache).
    - Generates reference numbers via `/api/sales/reference` when the date changes.
    - Handles sorting for date, reference, client, and cost columns.
    - Supports edit/delete via modal and updates caches on save.
    - Supports bulk paste import when `NEXT_PUBLIC_SALE_BULK_ENTRY` is enabled.
  - Usage: Rendered by `app/sales/[year]/page.js`.

- `updateSort(key, direction)`
  - Purpose: Set the active sort key and direction.
  - Behavior: Replaces the `sortConfig` state.
  - Usage: Called by sorting click handlers.

- `handleSortClick(key)`
  - Purpose: Toggle sort direction or change the active sort key.
  - Behavior: Flips direction when re-clicking the same column; defaults to ascending otherwise.
  - Usage: Bound to table header sort buttons.

- `getSortIcon(key, type)`
  - Purpose: Resolve the appropriate React icon for the current sort state.
  - Behavior: Returns neutral icon when inactive, alpha/numeric icons based on sort type.
  - Usage: Used in table header buttons.

- `loadServices()`
  - Purpose: Fetch active services for the picker.
  - Behavior: Uses cached services when available; otherwise calls `GET /api/services`.
  - Usage: Invoked on mount.

- `loadEntries(targetMonth, options)`
  - Purpose: Load sales entries for a month.
  - Behavior: Reads from `entriesCache` unless forced, then calls `GET /api/sales?month=...`.
  - Usage: Invoked when `month` changes or after mutations.

- `loadReferenceForDate(dateValue)`
  - Purpose: Fetch a generated reference number for a date.
  - Behavior: Calls `GET /api/sales/reference?date=...` and updates the reference chip.
  - Usage: Invoked when the entry date changes.

- `normalizeDate(value)`
  - Purpose: Parse pasted dates from `MM/DD/YY` or `MM/DD/YYYY`.
  - Behavior: Returns a normalized `YYYY-MM-DD` string or empty string if invalid.
  - Usage: Used by the bulk import parser.

- `parseTsvLine(line)`
  - Purpose: Split a pasted row into columns while respecting quoted text.
  - Behavior: Handles tab delimiters and escaped quotes.
  - Usage: Used by bulk import parsing.

- `ensureServiceId(name)`
  - Purpose: Resolve a service name to a service ID.
  - Behavior: Uses existing services list, or POSTs to `/api/services` to create it; handles 409 conflicts by refreshing the catalog.
  - Usage: Used by create/edit flows and bulk import.

- `createEntry({ entryDate, clientName, serviceName, costHkd })`
  - Purpose: Create a new sales entry in the database.
  - Behavior: Resolves service ID and POSTs to `/api/sales`; throws on failure.
  - Usage: Called by `handleSubmit` and bulk import.

- `updateEntry({ id, entryDate, clientName, serviceName, costHkd })`
  - Purpose: Update an existing sales entry.
  - Behavior: Resolves service ID and PATCHes `/api/sales`; throws on failure.
  - Usage: Called by `handleEditSave`.

- `handleSubmit(event)`
  - Purpose: Handle the new-entry form submit.
  - Behavior: Creates the entry, refreshes caches, resets form fields, and updates the month if needed.
  - Usage: Bound to the new entry form.

- `openEdit(entry)`
  - Purpose: Open the edit modal with the selected entry data.
  - Behavior: Populates edit state and resets edit status.
  - Usage: Triggered by edit buttons.

- `handleEditSave()`
  - Purpose: Persist edits for the selected entry.
  - Behavior: PATCHes the entry, updates caches, optionally switches months, and updates status.
  - Usage: Bound to the edit modal “Save changes” button.

- `handleDeleteEntry()`
  - Purpose: Delete the current entry from the edit modal.
  - Behavior: Confirms via `window.confirm`, DELETEs `/api/sales`, clears cache and reloads entries.
  - Usage: Bound to the edit modal “Delete” button.

- `handleBulkImport()`
  - Purpose: Parse and import multiple rows from the bulk paste text area.
  - Behavior: Parses TSV rows, validates data, creates entries sequentially, and refreshes affected months.
  - Usage: Triggered by the “Import rows” button when bulk entry is enabled.

- `handleExport()`
  - Purpose: Export the currently selected month to Excel.
  - Behavior: Navigates to `/api/sales/export?month=...` to download a file.
  - Usage: Bound to the “Export Excel” button.
