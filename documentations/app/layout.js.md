# app/layout.js

## Purpose
Defines the root layout for the Next.js App Router and provides site-wide metadata (title, description, favicons, manifest).

## Exports
- `metadata`
- `RootLayout({ children })`

## Functions
- `RootLayout({ children })`
  - Purpose: Wraps every page with the base HTML structure.
  - Behavior: Renders `<html lang="en">`, wraps app content with `Providers`, mounts `TopBar`, and then renders routed page content.
  - Usage: Automatically applied by Next.js to all routes.
