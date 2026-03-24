<div align="center">
  <h1>LCWK Reports</h1>
  <p>
    Annual reporting platform for LCWK with authenticated workflows for sales, commission,
    cerement totals, and Hong Kong branch performance tracking.
  </p>
</div>

<p align="center">
  <a href="https://www.lcwk.com.hk">Live Site</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.1.1-000000?logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2.3-149ECA?logo=react&logoColor=white" />
  <img alt="NextAuth" src="https://img.shields.io/badge/next--auth-4.24.13-111827" />
  <img alt="pg" src="https://img.shields.io/badge/pg-8.16.3-336791?logo=postgresql&logoColor=white" />
  <img alt="xlsx" src="https://img.shields.io/badge/xlsx-0.18.5-217346" />
</p>

## Overview
LCWK Reports is a Next.js App Router application for internal annual reporting. It combines data entry screens, summary analytics, admin catalog management, and downloadable Excel exports across four reporting domains:

- `營業額 · Sales`
- `佣金登記 · Commission`
- `壽衣紀錄 · Cerement`
- `香港分店營業額 · HK Branch Sales`

## Why this project is strong for portfolio review
| Portfolio Signal | Evidence in This Repository |
| --- | --- |
| End-to-end product ownership | Full-stack feature set from login/auth to operational dashboards and exports. |
| Multi-domain data modeling | Separate tables and APIs for sales, commission, cerement, HK branch matrix, access control, and auth audit. |
| Production-style security controls | Google OAuth (NextAuth), allowlist enforcement, auth audit logging, and API rate limiting. |
| Decision-ready analytics UI | Annual and cross-year summary pages with reusable chart components and data tables. |
| Operations/admin readiness | Dedicated admin panels for services, handlers, allowlist management, and access activity review. |

## Features
### Member workflows
- Manage monthly Sales entries with generated reference numbers, edit/delete support, and monthly/year exports.
- Manage monthly Commission entries with handler assignment, rate-based totals, edit/delete support, and exports.
- Record Cerement month-end totals per location with optional bulk paste import.
- Edit HK branch staff-by-month yearly matrices with debounced autosave and annual summary drilldowns.
- Review annual and overall cross-year summaries for all report areas.

### Admin workflows
- Maintain Sales service catalog (`/admin/services`).
- Maintain Commission handler catalog (`/admin/handlers`).
- Maintain access allowlist and inspect sign-in audit activity (`/admin/access`).

### Platform capabilities
- Route Handlers under `app/api/*` for report CRUD, summaries, years, exports, and admin operations.
- Unified auth guard (`requireAuth`) and global protected-route middleware (`proxy.js`).
- SQL-backed data access via shared Postgres pool (`lib/db.js`).

## Tech Stack
| Layer | Technology | Details |
| --- | --- | --- |
| Framework | Next.js `16.1.1` | App Router + Route Handlers |
| UI | React `19.2.3` | Client components + hooks |
| Auth | next-auth `4.24.13` | Google OAuth + JWT sessions + custom login page |
| Database | PostgreSQL (Neon) + `pg` `8.16.3` | SQL schema in `db/schema.sql` |
| Export | `xlsx` `0.18.5` | Excel generation for sales and commission exports |
| Styling | CSS Modules | Route-scoped component styles |
| Icons | react-icons `5.5.0` | Sort and UI iconography |
| Deployment target | Vercel | Node runtime for API routes |

## Architecture
```mermaid
flowchart LR
  user[Staff / Admin User] --> ui[Next.js App Router UI\napp/* pages + client components]

  ui --> proxy[Route protection\nproxy.js + withAuth]
  proxy --> accessCheck[/api/access/check]

  ui --> api[Route Handlers\napp/api/*]
  api --> db[(Postgres / Neon)]
  accessCheck --> db

  api --> auth[requireAuth + NextAuth server session]
  ui --> session[SessionProvider + next-auth client]
  auth --> google[Google OAuth]
  session --> google

  api --> exports[XLSX export generation\n/api/sales/export\n/api/commission/export]
```

## Security and reliability highlights
- Protected app surface via `withAuth` middleware, excluding only login/static assets.
- Email allowlist enforcement through DB-backed `allowed_emails` plus optional env fallback (`AUTHORIZED_EMAILS`).
- Sign-in audit trail (`auth_audit`) exposed in admin activity view.
- IP-based in-memory rate limiting applied across auth, read, and write endpoints.
- Input validation and typed error responses in all report/admin APIs.
- Transaction-based writes in critical flows (for example, sales reference sequencing and HK branch yearly saves).

## Quick Start
```bash
npm install
```

Create `.env.local`:
```bash
DATABASE_URL=your_postgres_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret

# Optional
AUTHORIZED_EMAILS=you@company.com,teammate@company.com
NEXT_PUBLIC_SALE_BULK_ENTRY=false
NEXT_PUBLIC_COMMISSION_BULK_ENTRY=false
NEXT_PUBLIC_CEREMENT_BULK_ENTRY=false
```

Initialize the database:
```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql
```

Run locally:
```bash
npm run dev
```

Build/start production mode locally:
```bash
npm run build
npm run start
```

## Environment Variables
| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string used by `lib/db.js`. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID for next-auth. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret for next-auth. |
| `NEXTAUTH_SECRET` | Yes | Session/JWT secret used by next-auth. |
| `AUTHORIZED_EMAILS` | Optional | Comma-separated fallback allowlist emails. |
| `NEXT_PUBLIC_SALE_BULK_ENTRY` | Optional | Enables sales bulk paste import UI when set to `true`. |
| `NEXT_PUBLIC_COMMISSION_BULK_ENTRY` | Optional | Enables commission bulk paste import UI when set to `true`. |
| `NEXT_PUBLIC_CEREMENT_BULK_ENTRY` | Optional | Enables cerement bulk paste import UI when set to `true`. |

## Available Scripts
| Script | Command | Description |
| --- | --- | --- |
| `dev` | `next dev` | Start local development server. |
| `build` | `next build` | Create production build. |
| `start` | `next start` | Run production server from built output. |

## Project Structure
```text
.
├── app/
│   ├── api/
│   ├── admin/
│   ├── sales/
│   ├── commission/
│   ├── cerement/
│   ├── hkfh-sales/
│   ├── login/
│   ├── components/charts/
│   ├── layout.js
│   ├── page.js
│   └── top-bar.js
├── lib/
│   ├── auth.js
│   ├── db.js
│   ├── rate-limit.js
│   ├── access-list.js
│   └── auth-audit.js
├── db/
│   ├── schema.sql
│   └── seed.sql
├── documentations/
├── public/
├── next.config.mjs
├── proxy.js
└── package.json
```

## Documentation Links
- [Project Overview](documentations/overview.md)
- [Admin Panels Overview](documentations/app/admin/overview.md)
- [App Layout Notes](documentations/app/layout.js.md)
- [Database Utility Notes](documentations/lib/db.js.md)
- [Codex Agent Guide](AGENTS.md)

## Deployment
1. Provision a PostgreSQL database (the project is structured for Neon).
2. Run `db/schema.sql` and `db/seed.sql` against that database.
3. Configure environment variables in your Vercel project to match local `.env.local`.
4. Deploy the Next.js app to Vercel.
5. Optionally map the custom domain `reports.lcwk.com.hk` (as referenced in current deployment notes).
