# lib/db.js

## Purpose
Provides a thin database access layer for Postgres using the `pg` Pool. It centralizes connection setup and exposes simple query helpers for API routes.

## Exports
- `query(text, params)`
- `getClient()`

## Functions
- `getPool()`
  - Purpose: Lazily creates and caches a single `pg` Pool instance across hot reloads.
  - Behavior: Reads `DATABASE_URL`, configures SSL, and stores the pool on `globalThis` to avoid duplicate pools.
  - Usage: Internal helper used by `query` and `getClient`.

- `query(text, params)`
  - Purpose: Execute a SQL query and return rows.
  - Behavior: Calls `getPool().query(...)`, returns `rows` directly.
  - Usage: API routes use it for simple read/write queries.

- `getClient()`
  - Purpose: Get a dedicated client connection for transactions.
  - Behavior: Calls `getPool().connect()` and returns the client.
  - Usage: Used when a route needs `BEGIN/COMMIT/ROLLBACK` (e.g., sales entry creation).
