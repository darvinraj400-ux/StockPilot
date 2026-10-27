import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  ChartColumn,
  Check,
  LockKeyhole,
  ShieldCheck,
  Tags,
} from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: {
    absolute: "StockPilot — Inventory management for small businesses",
  },
  description:
    "Track products, suppliers, and every stock movement in one dependable inventory workspace. Transactional stock adjustments, reorder alerts, and CSV reporting.",
};

const workflowSteps = [
  {
    title: "Authenticate the request",
    detail: "Session verified on the server and in the database.",
  },
  {
    title: "Lock the product row",
    detail: "Concurrent adjustments cannot overwrite each other.",
  },
  {
    title: "Validate the result",
    detail: "Stock can never be driven below zero.",
  },
  {
    title: "Commit the ledger",
    detail: "Quantity change and movement entry written together.",
  },
];

const featureCards = [
  {
    icon: Boxes,
    title: "A catalog that stays clean",
    body: "Unique SKUs, money stored as exact numerics, and soft archiving that preserves history instead of deleting it.",
  },
  {
    icon: ArrowLeftRight,
    title: "Every movement is auditable",
    body: "Stock-in, stock-out, and adjustments record signed deltas with the quantity before and after the change.",
  },
  {
    icon: ChartColumn,
    title: "Numbers you can act on",
    body: "Inventory value at cost, low-stock and out-of-stock views, and date-ranged movement reports, all from live data.",
  },
  {
    icon: ShieldCheck,
    title: "Security at the database",
    body: "Policies enforce ownership. Column grants block direct quantity edits, so the ledger cannot be bypassed from the client.",
  },
  {
    icon: Tags,
    title: "Organized around your business",
    body: "Categories and suppliers are optional where they should be, and enforced as your own records when they are used.",
  },
  {
    icon: LockKeyhole,
    title: "Built for real operations",
    body: "Server-validated forms, confirmation dialogs, empty states, and responsive screens for the stockroom or the desk.",
  },
];

const setupSteps = [
  {
    title: "Add products",
    body: "Create products with pricing, units, and optional category and supplier links. Every new product starts at zero — quantity only changes through the ledger.",
  },
  {
    title: "Set reorder levels",
    body: "Choose the threshold that should trigger attention. StockPilot flags anything at or below it and keeps out-of-stock items distinct.",
  },
  {
    title: "Record stock movements",
    body: "Receive, issue, or adjust stock with a reason. Review the ledger, watch the dashboard update, and export reports when you need them.",
  },
];

export default async function LandingPage() {
  const user = isSupabaseConfigured() ? (await getSession()).user : null;

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Link
            href="/"
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Sections"
            className="hidden items-center gap-6 text-sm text-slate-600 md:flex"
          >
            <a href="#features" className="transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-slate-900">
              Workflow
            </a>
            <a href="#security" className="transition-colors hover:text-slate-900">
              Security
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">
                    Get started
                    <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden="true"
            className="surface-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-56 size-[640px] rounded-full bg-emerald-200/30 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Inventory control for small teams
              </p>
              <h1 className="balance mt-6 max-w-xl text-[42px] font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-[52px]">
                Every unit accounted for.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-[17px]">
                StockPilot brings products, suppliers, and stock movements into
                one focused workspace. Adjustments run as database transactions,
                so the quantity on hand and the ledger always agree.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/signup"}>
                    {user ? "Open dashboard" : "Start your workspace"}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={user ? "/products" : "/login"}>
                    {user ? "View products" : "Sign in to StockPilot"}
                  </Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] text-slate-500">
                {[
                  "Server-side validation on every form",
                  "Auditable, append-only ledger",
                  "CSV exports with real data",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0">
              <div className="rounded-xl border bg-card p-5 shadow-lg">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                      <LockKeyhole className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Stock adjustment
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        One transaction, four guarantees
                      </p>
                    </div>
                  </div>
                  <span className="rounded border bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    postgres
                  </span>
                </div>

                <ol className="mt-4 space-y-3">
                  {workflowSteps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900">
                          {step.title}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {step.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2.5">
                  <span className="font-mono text-[11px] text-slate-600">
                    record_stock_movement()
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <Check className="size-3.5" aria-hidden="true" />
                    atomic
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["stock_in", "stock_out", "adjustment"].map((type) => (
                    <span
                      key={type}
                      className="rounded-md border bg-card px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 hidden w-52 rounded-lg border bg-card p-3.5 shadow-md sm:block">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md border border-amber-100 bg-amber-50 text-amber-700">
                    <Boxes className="size-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-900">
                      Reorder alerts
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      At or below your threshold
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative border-t bg-white/60">
            <div className="mx-auto grid max-w-6xl gap-px px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
              {["Products", "Categories & suppliers", "Movement ledger", "Reports"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 py-4 text-[13px] text-slate-600"
                  >
                    <span className="font-mono text-[10px] text-slate-400">
                      0{index + 1}
                    </span>
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Capabilities
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[34px]">
              Built for the way inventory actually moves
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-600">
              A focused set of workflows — not a sprawling ERP. Everything you
              need to keep stock accurate and prove how it got that way.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-lg border bg-slate-50 text-slate-600">
                  <feature.icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Workflow
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[34px]">
                  From an empty workspace to an accurate ledger
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-600">
                  StockPilot is arranged around the three things that matter:
                  what you stock, when to reorder, and every change you make.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2.5 text-xs text-slate-600">
                  <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
                  Quantity can only change through a recorded movement.
                </div>
              </div>

              <ol className="space-y-3">
                {setupSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-xl border bg-card p-5 shadow-xs"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-6 text-slate-600">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="overflow-hidden rounded-2xl bg-sidebar text-slate-200">
            <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:p-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  Security
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[32px]">
                  The rules live in the database
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
                  Hiding a button is not authorization. StockPilot enforces
                  ownership, quantity integrity, and ledger immutability at the
                  database layer — then mirrors those rules in the interface.
                </p>
                <ul className="mt-7 space-y-3">
                  {[
                    "Row-level security on every user-owned table",
                    "Column privileges block direct quantity updates",
                    "SECURITY DEFINER function with a pinned search path",
                    "Movements are select-only for client roles",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-1">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                  <span className="font-mono text-[11px] text-slate-400">
                    protect_product_quantity
                  </span>
                  <span className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-slate-700" />
                    <span className="size-2 rounded-full bg-slate-700" />
                    <span className="size-2 rounded-full bg-emerald-500/70" />
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-6 text-slate-300">
                  <code>{`if new.quantity_on_hand is distinct from
   old.quantity_on_hand
   and current_setting(
     'stockpilot.stock_adjustment', true
   ) <> 'on' then
  raise exception
    'Quantity updates must use
     record_stock_movement';
end if;`}</code>
                </pre>
                <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 text-[11px] text-slate-400">
                  <LockKeyhole className="size-3.5 text-emerald-400" aria-hidden="true" />
                  Direct quantity edits are rejected
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-6 py-12 sm:px-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-emerald-200/40 blur-2xl"
            />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <LogoMark className="size-9" />
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
                  Bring your inventory into focus
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Create a workspace, add your first products, and record a
                  movement. The dashboard is built entirely from your data — no
                  sample metrics, no guesswork.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild size="lg">
                  <Link href={user ? "/dashboard" : "/signup"}>
                    {user ? "Open dashboard" : "Create an account"}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
              Inventory management for small businesses: products, suppliers,
              stock movements, and reporting in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Create account
            </Link>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#security" className="hover:text-foreground">
              Security
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} StockPilot. Built with Next.js,
            Supabase, and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
