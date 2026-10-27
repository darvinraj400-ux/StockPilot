import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { SetupScreen } from "@/components/shared/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const assurances = [
  "Every stock change writes an auditable ledger entry",
  "Reorder alerts driven by your own thresholds",
  "Reports and CSV exports generated from live data",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 15% 0%, oklch(0.508 0.118 165.61 / 0.28), transparent 65%), radial-gradient(ellipse 60% 45% at 95% 100%, oklch(0.398 0.07 227.39 / 0.35), transparent 70%)",
          }}
        />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          >
            <Logo variant="light" />
            <span className="sr-only">StockPilot home</span>
          </Link>

          <div className="mt-20 max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Inventory accountability
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.15] tracking-tight text-white">
              Know exactly what is on hand — and why.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              StockPilot keeps products, suppliers, and stock movements in one
              workspace, with database-enforced rules so the numbers stay
              trustworthy.
            </p>
          </div>

          <ul className="mt-10 space-y-3.5">
            {assurances.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-16 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs leading-5 text-slate-300">
            Stock adjustments run through a single PostgreSQL transaction that
            locks the product row, validates the resulting quantity, and writes
            the movement atomically.
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            Row-level security · Append-only ledger
          </p>
        </div>
      </aside>

      <main className="flex min-h-svh flex-col">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:hidden">
          <Link href="/" aria-label="StockPilot home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <div className="flex items-center justify-between px-5 py-5 text-[11px] text-muted-foreground sm:px-8">
          <span>© {new Date().getFullYear()} StockPilot</span>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <LogoMark className="size-3.5" />
            stockpilot
          </Link>
        </div>
      </main>
    </div>
  );
}
