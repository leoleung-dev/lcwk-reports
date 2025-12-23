# LCWK Reports

Annual reporting dashboard for LCWK. The first report lives at `/sales` with
monthly entry, reference generation, and Excel export.

## Overview

LCWK Reports is a Next.js app that hosts two annual report workflows:
- Sales (`/sales/{year}`): monthly entries, reference generation, and exports.
- Commission (`/commission/{year}`): handler-based commission tracking with exports.

Summary pages provide annual charts, tables, and year-level exports. Admin pages
let staff manage the services and handlers catalogs.

## Tech stack

- Next.js App Router (React, Node runtime for API routes)
- Postgres (Neon) via `pg`
- Excel export via `xlsx`
- CSS Modules for styling
- Vercel for deployment

## Documentation

Detailed per-file documentation lives in `documentations/`, with an overview in
`documentations/overview.md`.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local`:
   ```bash
   DATABASE_URL=your_neon_postgres_url
   ```
3. Create the database tables by running the SQL in:
   - `db/schema.sql`
4. Seed the default services list:
   - `db/seed.sql`

## Local development

```bash
npm run dev
```

Open http://localhost:3000

## Deployment notes (Vercel + Neon)

- Add the same `DATABASE_URL` in the Vercel project environment settings.
- Deploy the project to Vercel and set the custom domain `reports.lcwk.com.hk`.

## Routes

- `/sales/{year}` - Annual sales report entry + monthly view with month tabs.
- `/commission/{year}` - Master commission report entry with monthly view.
- `/admin/services` - Add new services for staff to select.
- `/admin/handlers` - Add handlers for staff to select.
- `/api/sales/export` - Excel export endpoint (used by the UI)
