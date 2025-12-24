# Project Overview

## Purpose
LCWK Reports is a Next.js App Router application that tracks annual sales and commission entries. It provides monthly entry workflows, annual summaries, and Excel exports for staff to manage reporting data.

## How the system is linked together
- UI pages and client components live under `app/` and render the sales and commission workflows.
- Client components call API routes under `app/api/**` to read and mutate data.
- API routes use `lib/db.js` to execute Postgres queries against NeonDB via the `pg` driver.
- Admin pages (`/admin/services` and `/admin/handlers`) maintain lookup tables used by the main reports.
- Summary pages (`/sales/{year}/summary`, `/commission/{year}/summary`) call summary endpoints to build charts and tables.
- Export endpoints (`/api/sales/export`, `/api/commission/export`) generate `.xlsx` files using the `xlsx` library.

## Data model at a glance
- `services`: catalog used by sales entries.
- `sales_entries`: dated sales records, reference numbers, and cost.
- `commission_handlers`: catalog used by commission entries.
- `commission_entries`: monthly commission records with totals and rates.
- `allowed_emails`: allowlist of Google accounts that can access the app.

## Runtime flow
1. Staff choose a month/year in a report page.
2. The client component loads data via the matching API route.
3. The API route validates input, queries Postgres, and returns JSON.
4. The client updates state, renders tables, and offers export actions.

## Environment variables
- `DATABASE_URL`: Neon Postgres connection string.
- `GOOGLE_CLIENT_ID`: Google OAuth client id for NextAuth.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret for NextAuth.
- `NEXTAUTH_SECRET`: secret used to sign NextAuth sessions.
- `AUTHORIZED_EMAILS`: optional comma-separated list of emails allowed to sign in.
- `NEXT_PUBLIC_SALE_BULK_ENTRY`: toggles sales bulk paste UI.
- `NEXT_PUBLIC_COMMISSION_BULK_ENTRY`: toggles commission bulk paste UI.

## Deployment
- Built for Vercel with NeonDB as the backing database.
- Uses Node runtime for API routes that generate Excel exports.
