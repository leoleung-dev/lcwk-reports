# Admin Panels Overview

## Admin hub (`/admin`)
- Purpose: Landing page for staff tools.
- Behavior: Shows a signed-in email summary, sign-out button, and cards linking to each panel.
- Notes: Cards point to the panels below so admins can jump directly to a catalog or access list.

## Service Catalog (`/admin/services`)
- Purpose: Maintain the list of services used when creating sales entries.
- Behavior: Loads services via `GET /api/services`, offers a text input to add new services, and refreshes the list on demand.
- Notes: Changes immediately show up in the sales entry form service picker.

## Handler List (`/admin/handlers`)
- Purpose: Maintain the list of commission handlers.
- Behavior: Mirrors the service panel flow with `GET/POST /api/handlers`, input validation, and refresh controls.
- Notes: These handlers populate the commission entry picker and exports.

## Access Control (`/admin/access`)
- Purpose: Manage the allowlist of Google accounts and monitor sign-in attempts.
- Behavior: Provides a form to add emails (`POST /api/access`), removal controls, and a panel with the latest login audit entries from `/api/auth-audit`.
- Notes: Entries display who added them and when, and env-managed accounts are marked read-only.
