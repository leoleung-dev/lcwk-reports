# Project Overview

## Purpose
LCWK Reports is a Next.js App Router application that tracks annual sales, commission, cerement totals, and Hong Kong branch staff sales. It provides monthly entry workflows, annual summaries, and Excel exports for staff to manage reporting data.

## Documentation entry points
- `README.md` is the primary onboarding doc with portfolio-focused overview, architecture diagram, quick start, environment variables, and deployment steps.
- `README.md` keeps a centered quick-links row (`Live Site`, `Features`, `Tech Stack`, `Architecture`, `Quick Start`) for fast recruiter navigation, with `Live Site` pointing to `https://www.lcwk.com.hk`.
- `documentations/overview.md` (this file) is the detailed technical system map for routes, runtime flow, and data model context.
- `documentations/app/**` contains page/client/API level behavior notes.

## How the system is linked together
- UI pages and client components live under `app/` and render the sales, commission, and cerement workflows, plus the overall cerement summary.
- Client components call API routes under `app/api/**` to read and mutate data (including month-end cerement totals, HK branch yearly tables, plus the cerement, commission, and sales years lists).
- API routes use `lib/db.js` to execute Postgres queries against NeonDB via the `pg` driver.
- Admin pages (`/admin/services` and `/admin/handlers`) maintain lookup tables used by the main reports.
- Summary pages (`/sales/summary/{year}`, `/sales/summary/overall`, `/commission/summary/{year}`, `/commission/summary/overall`, `/cerement/summary/{year}`, `/cerement/summary/overall`) call summary endpoints or year-based data to build charts and tables.
- HK branch summary pages (`/hkfh-sales/summary/{year}`, `/hkfh-sales/summary/overall`) provide yearly and cross-year charts/tables for staff and totals.
- Home page report cards provide a primary `Open report` action and secondary quick-launch buttons for annual summary (`/.../summary/{currentYear}`) and overall summary (`/.../summary/overall`) routes.
- A global authenticated sticky top navigation bar (branded pill + dropdown menus) provides cross-section links (open report, annual summary, overall summary) for Sales, Commission, Cerement, and `香港分店營業額 · HKFH Sales`, plus Admin links and Sign out; dropdowns are mutually exclusive so only one menu stays open at a time.
- Export endpoints (`/api/sales/export`, `/api/commission/export`) generate `.xlsx` files using the `xlsx` library.

## Data model at a glance
- `services`: catalog used by sales entries.
- `sales_entries`: dated sales records, reference numbers, cost, and the staff email that created each entry.
- `commission_handlers`: catalog used by commission entries.
- `commission_entries`: monthly commission records with totals, rates, and the creator email for auditing.
- `hkfh_sales_entries`: yearly Hong Kong branch sales matrix by staff with 12 monthly amount columns and row display order.
- `allowed_emails`: allowlist of Google accounts that can access the app.
- `auth_audit`: audit log of sign-in attempts and access outcomes.

## Runtime flow
1. Staff choose a month/year in a report page.
2. The client component loads data via the matching API route.
3. The API route validates input, queries Postgres, and returns JSON.
4. The client updates state, renders tables, and offers export actions.
5. Commission bulk paste accepts an optional first column for month (e.g., Aug/August/08); when present, each row routes to that month, otherwise the selected month is used. It also treats `自來` as a zero amount when pasted in item columns.
6. Sales bulk paste accepts Chinese date formats like `10月7日` (with optional year) and normalizes them to YYYY-MM-DD.
7. Cerement annual summary (`/cerement/summary/{year}`) uses the title `梁津煥記 壽衣紀錄 {year}年 年度總結`, loads year-based data from `/api/cerement?year=YYYY`, renders shared line/bar/pie charts (from `app/components/charts`) with line + grouped bars on the left and two pies on the right (monthly metric mix plus annual store mix, toggleable together via a global Chart options button above the graphs); bars are grouped per month for Total and switch to a single-series bar when a store metric is selected; pie legends sit alongside each chart; when Total is selected, the chart section headers use `梁津煥記{year}年壽衣紀錄總計`, `梁津煥記{year}年每月壽衣紀錄`, `梁津煥記{year}年分店壽衣紀錄`, and `梁津煥記{year}年分店壽衣紀錄概覽`; provides an Overall link beside the year nav; and provides a cog-triggered modal (overlaying the top bar) to pick a single metric (total or store) and compare selected years, updating the chart title with the chosen metric/years.
8. Cerement bulk paste accepts Chinese dates like `1月31日` and maps the five location totals to the matching month in the selected year.
9. Cerement overall summary (`/cerement/summary/overall`) uses the title `梁津煥記 壽衣紀錄 跨年總結`, renames the Versus section to `壽衣紀錄 跨年對比`, and for Total metric shows the compare chart title as `梁津煥記 壽衣紀錄 {year} vs {year}` with color-coded year labels; it keeps a shared chart metric selector (Total vs branch amounts), and yearly overview cards titled `壽衣紀錄每年概覽` that show line + bar on the left and two pies on the right (monthly share plus annual store mix titled `{year}年 壽衣分店紀錄`); for Total metric, yearly chart headers use `{year}年 壽衣紀錄 趨勢` and `{year}年 每月 壽衣紀錄`; bars group branches for Total and switch to a single series for branch metrics; driven by `/api/cerement/years` plus per-year data.
10. Sales annual summary uses a full-width layout, a larger service mix pie chart, and renders the legend as bottom rows of button-style items in a four-column grid with tighter gaps; the bar chart stretches to fill its card height, and the Overall link points to the multi-year view; headings follow `梁津煥記(禮儀顧問) 營業額 {year}年 ...` naming (e.g., `每月銷售額`, `服務銷售額`, `銷售明細`), with month-specific service/detail titles switching to `梁津煥記(禮儀顧問) 營業額 {year}年{month}月 ...`.
11. Commission overall summary (`/commission/summary/overall`) uses `梁津煥記(禮儀顧問) 佣金登記 跨年總結` as the page title, renames the Versus section to `梁津煥記(禮儀顧問) 佣金登記 跨年對比`, keeps the colored year title chips while prefixing the compare title with `梁津煥記(禮儀顧問) 佣金登記 銷售額/佣金`, places 梁家強 as the leftmost grouped bar with a taller highlighted background, lets you multi-select years via checkboxes for the comparison (bars ordered by year ascending), shows compact value labels (including `$0` for zero) centered above each bar with hover chips above them, moves the legend below the chart with a note about 梁家強 sharing a separate scale, and lays out yearly overview charts with line + bar on the left and a larger cerement-style pie layout (bigger clamp-based pie) on the right with a full-height legend; yearly chart headers use `{year}年 每月銷售額/佣金` and `{year}年 經手者銷售額/佣金`; the per-year agent bars also separate 梁家強 with the same spotlight styling, include all agents (no aggregation), and force a single-row shrink-fit bar grid; driven by `/api/commission/years` and `/api/commission/summary`.
13. Commission annual summary uses a month bar chart to pick the active month, so the agent mix pie only reflects the selected month without a separate month selector in the pie header; Sales mode headings follow `梁津煥記(禮儀顧問) {year}年 ...` naming (e.g., `每月銷售額`, `經手者銷售額`, `銷售額概覽`, `每月案件數概覽`), and the month-focused agent mix title switches to `梁津煥記(禮儀顧問) {year}年{month}月 經手者銷售額`.
12. Sales overall summary (`/sales/summary/overall`) uses `梁津煥記(禮儀顧問) 營業額 跨年總結` as the page title, renames the Versus section to `梁津煥記(禮儀顧問) 營業額 跨年對比`, keeps a colored-year compare title prefixed with `梁津煥記(禮儀顧問) 營業額 銷售額`, and shows yearly overview cards titled `梁津煥記(禮儀顧問) 營業額 每年概覽` with chart headers `{year}年 銷售額 趨勢` and `{year}年 每月 銷售額`; driven by `/api/sales/years` and `/api/sales/summary`.
14. HK branch sales uses `/hkfh-sales/{year}` to edit a staff-by-month matrix and saves the full year via `/api/hkfh-sales`, including row order, monthly totals, and grand totals; monthly amount inputs render with a left `$` prefix and 2-decimal thousands formatting, and edits autosave after a short debounce.
15. HK branch yearly summary (`/hkfh-sales/summary/{year}`) uses `香港分店 營業額 {year}年 年度總結` as the page title and renders `香港分店營業額概覽` plus renamed charts (`經手者營業額`, `每月營業額 趨勢`, `每月營業額`, `經手者每月營業額趨勢`, `經手者每月營業額`) using `/api/hkfh-sales`.
16. HK branch overall summary (`/hkfh-sales/summary/overall`) uses `香港分店 營業額 跨年總結` as the page title, loads years from `/api/hkfh-sales/years`, pulls per-year data from `/api/hkfh-sales`, then renders renamed sections/charts for yearly totals, cross-year monthly comparison, all-years agent totals, and a yearly summary table.
16.1. All overall summary routes (`/sales/summary/overall`, `/commission/summary/overall`, `/cerement/summary/overall`, `/hkfh-sales/summary/overall`) accept `?year=YYYY,YYYY` so year selections can be shared by URL and restored on load.
17. HK branch trendline charts use hoverable point/path tooltips plus a rounded left Y-axis amount scale with abbreviated labels (e.g., `1k`, `2m`) and reserved left gutter (to prevent label clipping), and each chart card includes a visible title label; tooltip chips follow the same dark-pill hover style as other chart hovers.
18. Shared `LineChart` shows a left Y-axis scale by default, and default axis labels use compact abbreviations (lowercase `k/m/b`) unless overridden; x-axis labels are padded to align with plotted points, hover paths are fully transparent, left-axis gutter is dynamically sized to reduce wasted space, and Y-axis scaling always includes headroom above the peak value.
19. The sexagenary year badge (`歲次{天干}{地支}年 {year}`) on `/sales/{year}`, `/commission/{year}`, and `/cerement/{year}` uses a CJK-safe serif font stack (`Noto Serif TC` / `PingFang TC` / `Microsoft JhengHei` / `Heiti TC`) to prevent glyph substitution issues.

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
