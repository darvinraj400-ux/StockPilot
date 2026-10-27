# StockPilot

StockPilot is an inventory management workspace for small businesses. It tracks a
product catalog, categories, suppliers, and an append-only stock ledger, then
turns those records into reorder alerts, valuation reports, and CSV exports.

Built as a portfolio-quality full-stack application: Next.js App Router,
TypeScript, Tailwind CSS, Supabase Postgres/Auth, and row-level security.

> **Status:** implemented and verified locally on 2026-10-27: lint, typecheck,
> 57 unit tests, 9 real-database integration tests, a production build, and
> browser acceptance workflows against a local Supabase stack. No hosted
> deployment or hosted migration has been performed.

## Features

- **Dashboard** — active products, inventory value at cost, low-stock and
  out-of-stock counts, 14-day movement chart, attention list, and recent ledger
  entries. Every value comes from the database; a new account sees honest empty
  states instead of placeholder metrics.
- **Products** — create, edit, search, filter by status/category/supplier, and
  archive/reactivate. Product detail pages show stock position, margin, and
  chronological movement history. New products always start at zero units.
- **Categories and suppliers** — create, edit, search, and archive. Category
  names are unique per account, case-insensitively. Referenced categories and
  suppliers cannot be hard-deleted because the app only offers soft archive.
- **Stock movements** — receive, issue, or adjust stock in one dialog with a live
  before/change/resulting preview. The ledger records the quantity before and
  after every change and is append-only from the client's perspective.
- **Reports** — inventory valuation with category breakdown, low-stock, and
  out-of-stock reports; movement history with search, type, and date filters;
  safe CSV export of each dataset.
- **Settings** — profile name update, account facts, security summary, and sign
  out.
- **Accessibility and UX** — labelled controls, keyboard navigable dialogs and
  menus, visible focus styles, loading skeletons, toasts, confirmation dialogs,
  responsive sidebar/mobile navigation, and print-friendly movement receipts.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router (server components, server actions, route handlers) |
| Language | TypeScript, strict mode |
| UI | Tailwind CSS v4, Radix primitives, shadcn-style local components, Lucide icons |
| Forms | React Hook Form, Zod 4 (client and server validation) |
| Database | Supabase Postgres with RLS |
| Auth | Supabase Auth via `@supabase/ssr` |
| Charts | Recharts |
| Tests | Vitest |

## Screens

| Route | Purpose |
| --- | --- |
| `/` | Public product overview |
| `/login`, `/signup` | Authentication |
| `/dashboard` | Live inventory summary and activity |
| `/products` | Searchable, filterable catalog with pagination |
| `/products/new`, `/products/[id]/edit` | Product create/edit (no stock field) |
| `/products/[id]` | Detail, stock position, movement history, archive |
| `/categories`, `/suppliers` | Catalog organization and archiving |
| `/stock-movements` | Searchable ledger with type/date filters |
| `/stock-movements/[id]` | Printable movement receipt |
| `/reports` | Valuation, low-stock, out-of-stock, and movement reports |
| `/reports/export` | Authenticated CSV export route |
| `/settings` | Profile, account details, session |

## Architecture

```text
src/
  app/
    (auth)/                Login and signup screens
    (app)/                 Protected application shell and pages
    auth/callback|confirm/ Supabase email/OTP exchange handlers
    reports/export/        Authenticated CSV route handler
  components/
    auth/ brand/ dashboard/ forms/ layout/ products/
    settings/ shared/ stock/ suppliers/ categories/ ui/
  lib/
    actions/               Server actions (auth, products, categories, …)
    data/                  Server-only Supabase queries
    supabase/              Browser, server, proxy clients and config guard
    validations/           Zod schemas shared by client and server
    inventory.ts           Stock status, valuation, movement rules
    reports.ts             Pure report aggregation
    csv.ts                 CSV escaping and filenames
    dates.ts, format.ts, pagination.ts, search.ts
  types/database.ts        Database row and RPC types
supabase/migrations/       Versioned schema, RLS, and stock RPC
```

Principles:

- Server components fetch through server-only data modules; interactive forms
  and filters are small client components.
- Client-side validation is duplicated on the server with the same Zod schemas.
- The client never supplies `user_id`; it comes from the verified session.
- Direct table writes never touch `quantity_on_hand`. Stock changes go through
  one database function that writes the product update and ledger row
  atomically.

## Data model

Four tenant-owned tables, all keyed by `auth.users(id)`:

- **categories** — `(id, user_id)`, name, description, soft `is_active`.
  Unique on `(user_id, lower(btrim(name)))`.
- **suppliers** — `(id, user_id)`, name, contact fields, notes, soft `is_active`.
- **products** — `(id, user_id)`, optional category/supplier, SKU, name,
  description, unit, `numeric(12,2)` cost/selling prices, nonnegative
  `quantity_on_hand`, nonnegative `reorder_level`, soft `is_active`, and a
  generated stored `needs_reorder = quantity_on_hand <= reorder_level`.
- **stock_movements** — `(id, user_id, product_id)`, type (`stock_in`,
  `stock_out`, `adjustment`), signed `quantity_delta`, `quantity_before`,
  `quantity_after`, optional note, `created_at`.

Integrity highlights:

- Composite foreign keys `(category_id, user_id)` and `(supplier_id, user_id)`
  make cross-tenant references impossible.
- Movement checks enforce non-zero deltas, correct direction for receipts/issues,
  nonnegative before/after values, and exact arithmetic
  (`quantity_after = quantity_before + quantity_delta`).
- `record_stock_movement()` locks the product row with `FOR UPDATE`, rejects
  archived products and negative results, updates the product, and inserts the
  movement in one transaction.
- A trigger rejects direct quantity changes unless the function sets a
  transaction-local flag. Products' insert trigger also forces a zero starting
  quantity.
- Low stock means `quantity_on_hand <= reorder_level`; zero stock is both low and
  out of stock, with out-of-stock surfaced separately.

## Environment variables

Copy `.env.example` to `.env.local` (never commit real values):

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project base URL; do not append `/rest/v1/` or `/auth/v1/` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | Browser-safe publishable/anon key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback* | Legacy anon key used if publishable key is unset |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin for metadata; fallback for auth email redirects when no request origin is available |

\* Provide exactly one of the two Supabase keys.

If sign-up or sign-in fails with a configuration message, check that
`NEXT_PUBLIC_SUPABASE_URL` is the project base URL from **Project Settings →
API**, not the Data API URL ending in `/rest/v1/`. The app strips a known API
path automatically and warns in development. Development server logs also show
the sanitized Auth error code and status, never passwords, keys, tokens, or
email addresses.

No service-role key is used anywhere in the application. Without the required
Supabase values, public pages render and the app shows a setup screen instead of
crashing.

## Local setup

Prerequisites: Node.js 20.9+ (developed on Node 24), npm, and a Supabase project
(hosted or local CLI with Docker).

```bash
npm install
cp .env.example .env.local
# fill in the Supabase project URL and publishable key
npm run dev
```

Open `http://localhost:3000`.

### Apply database migrations

Migrations live in `supabase/migrations/` and must be applied in filename order:

1. `20261027100000_initial_schema.sql`
2. `20261027100100_row_level_security.sql`
3. `20261027100200_stock_functions.sql`
4. `20261027100300_stock_adjustment_reason.sql`

Using the Supabase CLI against a project:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or paste each file into the Supabase SQL editor in order. For a local stack
(`supabase/config.toml` is already in this repository):

```bash
npx supabase start
npx supabase db reset
```

### Authentication setup

In the Supabase dashboard, set **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (production: your real origin)
- Redirect URLs: `http://localhost:3000/auth/callback` and
  `http://localhost:3000/auth/confirm`

Signup uses Supabase email confirmation. For local testing you can either click
the confirmation link or temporarily disable email confirmations in the Supabase
Auth settings. The app supports both the PKCE `code` callback and custom
`token_hash` email templates.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types with `next typegen`, then `tsc --noEmit` |
| `npm run test` | Vitest unit suite |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:integration` | Supabase integration suite (requires a disposable stack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run check` | Lint, typecheck, tests, and build |

## Testing

Automated tests cover pure business logic:

- stock-in, stock-out, adjustment direction and signed deltas
- zero, fractional, and negative quantity rejection
- refusing to remove more than the quantity on hand
- low-stock classification at, below, and above reorder level
- inventory valuation and rounding
- report row construction, category grouping, and low/out filtering
- CSV quoting, CRLF formatting, formula-injection escaping, filenames
- product, stock movement, category, and supplier form schemas
- UTC date boundary handling and pagination clamping
- redirect target sanitization (protocol-relative, backslash, control characters)

Verified on 2026-10-27 against a local Supabase stack (Docker) and headless
Chrome:

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run test` — 57 tests pass in 5 files
- `npm run test:integration` — 9 tests pass in 1 file
- `npm run build` — pass

Browser acceptance runs covered:

- signup, zeroed dashboard empty state, signout, protected-route redirect,
  invalid credentials, and persisted email after a failed login;
- category, supplier, and product creation; case-insensitive duplicate SKU
  rejection; negative and non-numeric price/reorder validation;
- stock-in, stock-out, and adjustment with `before`/`after` ledger rows;
  over-issue rejection with unchanged quantity; minimum adjustment reason;
- dashboard totals and low-stock status at the reorder threshold; all four
  reports and CSV exports; unauthenticated export redirected to login with no
  tenant data in the response;
- archived product hides stock actions, rejects new movements, and preserves
  quantity and history on reactivation;
- two-account isolation: empty catalog/ledger/reports, a 404 view for the other
  account's product URL, and a header-only inventory CSV;
- email confirmation with Mailpit (pending signup, blocked unconfirmed login,
  confirmation link landing in the dashboard, then normal login).

### Database integration tests

`src/integration/supabase.integration.test.ts` exercises the real Supabase API:
user isolation, RLS reads and updates, direct `quantity_on_hand` and ledger
write rejection, the stock RPC, rollback on a failed adjustment, archived
products, concurrency, and owner-scoped dashboard metrics. It does not use a
service-role key. Nine tests pass locally in roughly 3 seconds.

Run it only against a disposable stack. The suite refuses a non-local URL unless
`SUPABASE_TEST_ALLOW_REMOTE=1` is explicitly set.

```bash
npx supabase start
npx supabase status   # copy the API URL and publishable key
SUPABASE_TEST_URL=http://127.0.0.1:54321 \
SUPABASE_TEST_KEY=<publishable-key> \
npm run test:integration
```

In PowerShell:

```powershell
$env:SUPABASE_TEST_URL="http://127.0.0.1:54321"
$env:SUPABASE_TEST_KEY="<publishable-key>"
npm run test:integration
```

`supabase/config.toml` disables email confirmations for local development so the
automated suite gets an immediate session. The suite creates users and inventory
in the local database and does not attempt cleanup, because tenant deletes are
intentionally revoked by the schema.

To exercise the confirmation flow locally, set `enable_confirmations = true`
under `[auth.email]` in `supabase/config.toml`, restart the stack
(`npx supabase stop && npx supabase start`), and open Mailpit at
`http://127.0.0.1:54324`. The flow was verified this way on 2026-10-27. Revert to
`false` before running the automated integration suite.

### Manual database verification checklist

Run these against a disposable Supabase project after applying migrations:

- [ ] Sign up, confirm the email, sign in, refresh a protected page, sign out.
- [ ] Create a product. Confirm `quantity_on_hand = 0` in the table.
- [ ] Update the product through the API with `quantity_on_hand` included.
      Expect a `42501` error from the quantity-protection trigger / column grant.
- [ ] Record stock-in. Confirm the product quantity and a movement row with
      matching before/after values were committed together.
- [ ] Attempt stock-out beyond the quantity on hand. Expect rejection and no
      movement row.
- [ ] Attempt a zero delta, an inverted direction, and a movement on an archived
      product. All must be rejected.
- [ ] Insert, update, or delete a `stock_movements` row directly as an
      authenticated user. Expect permission denied; movements are read-only.
- [ ] Create a second user and confirm they cannot read or update the first
      user's categories, suppliers, products, or movements.
- [ ] Try categories/products with names or SKUs differing only by case. Expect
      unique-index rejection within one account, while another account can reuse
      the same values.
- [ ] Confirm deleting a referenced category/supplier fails, and that archiving
      preserves product history.
- [ ] Export each report and confirm CSV values, UTF-8 BOM, and that a note
      beginning with `=` is prefixed with an apostrophe.

## Deployment handoff checklist

Nothing has been deployed from this repository. These are the manual owner
actions for a first release. Keep the Supabase service-role key and database
password out of Vercel and out of every `NEXT_PUBLIC_*` variable.

### 1. Supabase project and migrations

1. Create a project in the Supabase dashboard and note its project ref.
2. Link this repository and review/apply the migrations in order:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --dry-run
   npx supabase db push
   npx supabase migration list
   ```

   `migration list` must show all four matching local and remote entries:
   `20261027100000_initial_schema`, `20261027100100_row_level_security`,
   `20261027100200_stock_functions`, and
   `20261027100300_stock_adjustment_reason`.

### 2. Authentication URL configuration

In **Authentication → URL Configuration** for that project:

- Site URL: `https://<your-domain>` for production.
- Redirect URLs (exact, including protocol):
  - `https://<your-domain>/auth/callback`
  - `https://<your-domain>/auth/confirm`
  - `http://localhost:3000/auth/callback` and
    `http://localhost:3000/auth/confirm` for local testing.
  - Add a preview wildcard or each preview origin only if confirmation links
    from Vercel preview deployments are required.
- Enable email confirmations and configure SMTP for production delivery.

Signup uses the incoming request origin when available and otherwise falls back
to `NEXT_PUBLIC_SITE_URL`. An origin that is not on the redirect allow-list falls
back to the configured Site URL.

### 3. Vercel project

1. Push this repository to GitHub/GitLab; no remote is configured here.
2. Import it in Vercel. Framework preset: Next.js. Root directory: repository
   root. Install command: `npm install`. Build command: `npm run build`.
3. Add these variables to **Production** and **Preview**:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key |
   | `NEXT_PUBLIC_SITE_URL` | Final `https://` production origin |

   For legacy projects, provide `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (exactly one key variable).

4. Deploy.

### 4. Post-deploy smoke test

- Sign up, open the confirmation email, sign in, refresh a protected page, and
  sign out.
- Create a product; record a stock-in and a stock-out; confirm the before/after
  values in the ledger.
- Attempt an over-issue; confirm rejection and an unchanged quantity.
- Open all four report views and export CSV files; confirm totals match the
  records you created.
- Confirm the dashboard counts match the products and movements.

Local release verification (2026-10-27): all quality gates pass, the four
migrations are applied and exercised on a fresh local stack, and the production
build was smoke-tested against the local Supabase API with `no-store` caching on
authenticated pages and exports. Hosted migration and Vercel deployment were
**not** performed because no remote project or deployment credentials are
available in this environment.

## Security notes

- RLS is enabled on every table with explicit per-owner select/insert/update
  policies. No client role has delete permission.
- `quantity_on_hand` is excluded from the authenticated update grant and guarded
  by a trigger; the only sanctioned mutation path is the transactional
  `record_stock_movement()` function.
- The RPC is `SECURITY DEFINER` with an empty `search_path`, checks `auth.uid()`,
  verifies product ownership, locks the row, and re-validates every rule.
- Dashboard/report aggregate functions are `SECURITY INVOKER`, so RLS remains in
  force.
- Server actions re-validate input and never accept `user_id` from the browser.
- Auth is enforced by the proxy for redirects and again by `requireUser()` on the
  server; protected content is never client-only guarded.
- CSV exports require an authenticated session and escape spreadsheet formula
  prefixes.
- No service-role or secret key is referenced in client code.

## Known limitations

- Single user workspace: no teams, roles, or per-user permissions.
- No multi-warehouse or bin locations, barcodes, purchase orders, invoicing,
  subscriptions, or email notifications.
- No in-app password reset or email change UI; those are handled in Supabase.
- Reports load all active products for valuation, and the stock dialog loads up
  to 500 active products. Movement search resolves product name/SKU matches
  through at most 200 products per query. These paths are designed for small
  catalogs rather than millions of rows.
- When a missing record is rendered inside the streamed app shell, Next.js can
  return HTTP 200 with the in-app 404 view instead of a 404 status. No tenant
  data is exposed; direct document requests to protected routes without a
  session are redirected to login.
- Soft archive only; there is no hard-delete flow.
- No hosted deployment has been performed; production Supabase and Vercel setup
  remain manual steps.
