# app/page.js

## Purpose
Landing page for the reports portal. It links staff to all major report sections.

## Exports
- `Home()`

## Functions
- `Home()`
  - Purpose: Renders the homepage with grouped report cards.
  - Behavior: Displays a hero section and three report groups:
    - `梁津煥記(禮儀顧問)` section: `/sales`, `/commission`
    - `梁津煥記` section: `/cerement`
    - `香港分店` section: `/hkfh-sales`
    - Each card includes a primary `Open report` button plus secondary buttons:
      - `View annual report` -> `/.../summary/{currentYear}`
      - `View overall report` -> `/.../summary/overall`
  - Usage: Served as the root route `/`.
