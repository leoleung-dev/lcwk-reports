# Project Overview

## Purpose
LCWK Reports is a Next.js App Router application that tracks annual sales, commission, and cerement totals. It provides monthly entry workflows, annual summaries, and Excel exports for staff to manage reporting data.

## How the system is linked together
- UI pages and client components live under `app/` and render the sales, commission, and cerement workflows, plus the overall cerement summary.
- Client components call API routes under `app/api/**` to read and mutate data (including month-end cerement totals plus the cerement and sales years lists).
- API routes use `lib/db.js` to execute Postgres queries against NeonDB via the `pg` driver.
- Admin pages (`/admin/services` and `/admin/handlers`) maintain lookup tables used by the main reports.
- Summary pages (`/sales/summary/{year}`, `/sales/summary/overall`, `/commission/{year}/summary`, `/cerement/summary/{year}`, `/cerement/summary/overall`) call summary endpoints or year-based data to build charts and tables.
- Export endpoints (`/api/sales/export`, `/api/commission/export`) generate `.xlsx` files using the `xlsx` library.

## Data model at a glance
- `services`: catalog used by sales entries.
- `sales_entries`: dated sales records, reference numbers, cost, and the staff email that created each entry.
- `commission_handlers`: catalog used by commission entries.
- `commission_entries`: monthly commission records with totals, rates, and the creator email for auditing.
- `allowed_emails`: allowlist of Google accounts that can access the app.
- `auth_audit`: audit log of sign-in attempts and access outcomes.

## Runtime flow
1. Staff choose a month/year in a report page.
2. The client component loads data via the matching API route.
3. The API route validates input, queries Postgres, and returns JSON.
4. The client updates state, renders tables, and offers export actions.
5. Commission bulk paste accepts an optional first column for month (e.g., Aug/August/08); when present, each row routes to that month, otherwise the selected month is used. It also treats `自來` as a zero amount when pasted in item columns.
6. Sales bulk paste accepts Chinese date formats like `10月7日` (with optional year) and normalizes them to YYYY-MM-DD.
7. Cerement annual summary uses year-based data from `/api/cerement?year=YYYY`, shows the line chart stacked above grouped bars on the left with the pie chart on the right (toggleable via a global Chart options button above the graphs) with hover tooltips on line, bar, and pie charts; bars are grouped per month for Total and switch to a single-series bar when a store metric is selected; uses a left-aligned pie legend; provides an Overall link beside the year nav; and provides a cog-triggered modal (overlaying the top bar) to pick a single metric (total or store) and compare selected years, updating the chart title with the chosen metric/years.
8. Cerement bulk paste accepts Chinese dates like `1月31日` and maps the five location totals to the matching month in the selected year.
9. Cerement overall summary (`/cerement/summary/overall`) lists each year with data and renders year-specific line, bar, and pie charts with hover tooltips; each year has a metric dropdown beside the year (total or store), with grouped bars for Total and single-series bars for a store; driven by `/api/cerement/years` plus per-year data.
10. Sales annual summary uses a full-width layout, a larger service mix pie chart, and renders the legend as bottom rows of button-style items in a four-column grid with tighter gaps; the bar chart stretches to fill its card height, and the Overall link points to the multi-year view.
11. Sales overall summary (`/sales/summary/overall`) analyzes year-over-year performance with annual totals, a trend line chart, and a yearly breakdown table, driven by `/api/sales/years` and `/api/sales/summary`.

## Environment variables
- `DATABASE_URL`: Neon Postgres connection string.
- `GOOGLE_CLIENT_ID`: Google OAuth client id for NextAuth.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret for NextAuth.
- `NEXTAUTH_SECRET`: secret used to sign NextAuth sessions.
- `AUTHORIZED_EMAILS`: optional comma-separated list of emails allowed to sign in.
- `NEXT_PUBLIC_SALE_BULK_ENTRY`: toggles sales bulk paste UI.
- `NEXT_PUBLIC_COMMISSION_BULK_ENTRY`: toggles commission bulk paste UI.
- `NEXT_PUBLIC_CEREMENT_BULK_ENTRY`: toggles cerement bulk paste UI.

## Deployment
- Built for Vercel with NeonDB as the backing database.
- Uses Node runtime for API routes that generate Excel exports.

## Codex agent guide
- `AGENTS.md` documents Codex-specific conventions, including when to update docs and how to share schema add-ons after changes.
