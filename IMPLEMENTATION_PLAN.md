# StockPilot implementation plan

A single-workspace inventory manager for small teams, built as a portfolio-quality
Next.js application. The plan below records the build order and what has been
verified. It is a living engineering document, not a claim of deployment.

## Constraints

- Next.js App Router, strict TypeScript, Tailwind CSS v4, shadcn-style components.
- Supabase Postgres, Auth, and `@supabase/ssr`; no second backend or ORM.
- Server-side authorization on every protected page and server action.
- Row-level security on every tenant table; no service-role key in the app.
- Stock changes only through one transactional database function.
- No fabricated data, credentials, test results, or deployment status.

## Phase 1 — Scaffold and design system

Status: complete.

- Bootstrapped Next.js 16 with Turbopack, TypeScript strict mode, ESLint.
- Tailwind v4 tokens in `src/app/globals.css`; light canvas, dark navy sidebar,
  emerald accents, tabular numerics.
- Hand-built accessible UI primitives (button, input, label, select, dialog,
  alert dialog, dropdown, table, badge, avatar, skeleton, sonner toaster).
- App shell: fixed sidebar, mobile sheet navigation, sticky header, global
  search, user menu, loading skeleton, error boundary, not-found pages.

## Phase 2 — Database and security

Status: complete (SQL written; hosted application not performed).

- `20261027100000_initial_schema.sql`: categories, suppliers, products, stock
  movements; UUID keys; composite `(id, user_id)` tenant foreign keys; checks;
  case-insensitive unique category names and SKUs; numeric(12,2) money;
  nonnegative quantities; generated `needs_reorder`; `updated_at` trigger;
  quantity-protection trigger.
- `20261027100100_row_level_security.sql`: RLS enabled on all four tables,
  explicit owner policies, no client delete grants, products' stock column
  excluded from update grants, stock movements read-only to clients.
- `20261027100200_stock_functions.sql`: transactional
  `record_stock_movement()` with auth check, ownership check, `FOR UPDATE` row
  lock, direction and nonnegative validation, product update plus immutable
  movement insert in one transaction. Dashboard/report read functions remain
  `security invoker` so RLS applies.
- `20261027100300_stock_adjustment_reason.sql`: database check requiring a
  reason of at least three characters for every adjustment.
- All four migrations were applied in order to a fresh disposable local
  Supabase stack and exercised by the integration suite.

## Phase 3 — Authentication and session handling

Status: complete.

- Server/browser Supabase clients from `@supabase/ssr`.
- `proxy.ts` refreshes sessions and redirects unauthenticated requests away from
  protected prefixes; auth pages redirect signed-in users to the dashboard.
- Login, signup with password confirmation, email confirmation callback and
  token-hash confirmation routes, sign-out server action.
- Missing-environment setup screen instead of a crash.

## Phase 4 — Catalog workflows

Status: complete.

- Products list with URL-synced search, status/category/supplier filters,
  pagination, stock badges, inventory value, empty states.
- Create/edit forms with React Hook Form + Zod, server-side re-validation,
  relation pickers, pricing, reorder level, and no stock field. New products
  start at zero in the database.
- Product detail with stock position, pricing, catalog data, movement history,
  archive/reactivate confirmation.
- Categories and suppliers CRUD dialogs, archive/reactivate, case-insensitive
  unique category names enforced by the database, referenced-record handling by
  restriction and soft archive.

## Phase 5 — Stock ledger

Status: complete.

- Shared stock movement dialog: product search, receive/issue/adjustment,
  reason requirement for adjustments, live before/change/resulting preview,
  negative-stock warning, server field-error mapping.
- Append-only ledger with search, type and date filters, pagination, and a
  printable movement detail.
- Dashboard: real aggregate metrics, 14-day movement chart from the database
  series function, low-stock list, recent movements, onboarding empty state.

## Phase 6 — Reports and settings

Status: complete.

- Reports views: inventory valuation and category breakdown, low-stock report,
  out-of-stock report, filtered movement history.
- CSV exports for all four datasets; authenticated route, tenant-safe queries,
  formula-injection protection, UTF-8 BOM, no-store headers.
- Settings: profile update, read-only account facts, security summary, sign out.

## Phase 7 — Tests, documentation, quality gates

Status: complete.

- Vitest unit suites cover stock direction/zero/negative validation, low-stock
  classification, valuation, report grouping, CSV escaping/export, form
  validation, date boundaries, pagination, and redirect sanitization. 57 tests
  passing in 5 files.
- `src/integration/supabase.integration.test.ts` runs against a real local
  Supabase API with a publishable key only. 9 tests passing: tenant isolation,
  direct quantity/ledger write rejection, atomic stock movements, rollback,
  concurrency, archived products, dashboard metrics, and auth credentials.
- Docs: `README.md`, `.env.example`, this plan, and a manual Supabase
  verification checklist in the README.
- Quality gates: lint, typecheck, 57 unit tests, 9 integration tests, and the
  production build all pass (last run 2026-10-27).
- Browser acceptance in headless Chrome covered auth, catalog, stock ledger,
  reports/CSV, archive/reactivate, two-account isolation, and email
  confirmation with Mailpit. Results are recorded in the README.

## Phase 8 — Release readiness

Status: local verification complete; hosted deployment blocked.

- Repository, environment templates, auth/session handling, RLS, grants, and
  the stock function were audited; no service-role key or privileged secret is
  used in application code.
- A fresh local stack was created, the four migrations were applied, and all
  integration and browser workflows passed.
- No Git remote, Vercel project, or hosted Supabase project is configured in
  this environment, so no hosted migration or deployment was performed.
  Production steps remain exactly as documented in the README.

## Out of scope

Multi-warehouse, barcodes, purchase orders, invoicing, subscriptions, granular
roles/permissions, transactional email, and AI features.
