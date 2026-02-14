# app/top-bar.js

## Purpose
Renders the authenticated global navigation bar used across report pages.

## Main behavior
- Hidden on unauthenticated sessions and on `/login`.
- Shows a `Reports Home` shortcut.
- Renders a sticky glass-style top shell with a branded `LCWK Reports` pill.
- Provides dropdown menus for Sales, Commission, Cerement, and HK Branch routes.
  - Each menu includes `Open report`, `View annual (current year)`, and `View overall` links.
- Provides an Admin dropdown for `/admin`, `/admin/services`, `/admin/handlers`, and `/admin/access`.
- Highlights the active section and active links from the current pathname.
- Keeps dropdown behavior mutually exclusive: opening one menu closes other open menus.
- Closes open dropdown menus after route changes.
- Keeps `Sign out` available from all authenticated pages.
