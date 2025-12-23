# app/layout.js

## Purpose
Defines the root layout for the Next.js App Router and provides site-wide metadata (title, description, favicons, manifest).

## Exports
- `metadata`
- `RootLayout({ children })`

## Functions
- `RootLayout({ children })`
  - Purpose: Wraps every page with the base HTML structure.
  - Behavior: Renders `<html lang="en">` and places all routed content inside `<body>`.
  - Usage: Automatically applied by Next.js to all routes.
