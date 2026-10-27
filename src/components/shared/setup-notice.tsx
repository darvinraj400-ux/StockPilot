import Link from "next/link";
import { Database, ExternalLink, Terminal } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const envVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

export function SetupNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-xl border bg-card p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
            <Database className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Connect Supabase to get started
            </h2>
            <p className="text-sm text-muted-foreground">
              StockPilot needs a database and auth project.
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-4 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              1
            </span>
            <p>
              Create a Supabase project, then copy{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px]">
                .env.example
              </code>{" "}
              to{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px]">
                .env.local
              </code>{" "}
              and fill in:
            </p>
          </li>
        </ol>

        <div className="mt-4 rounded-lg border bg-slate-950 p-4 font-mono text-xs text-slate-200">
          <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Terminal className="size-3.5" />
            .env.local
          </div>
          {envVars.map((name) => (
            <p key={name} className="leading-6">
              {name}=<span className="text-emerald-400">your-value</span>
            </p>
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Apply the SQL migrations in{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px]">
            supabase/migrations
          </code>{" "}
          with the Supabase CLI or SQL editor, then restart the dev server.
        </p>

        {!compact ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
              >
                Open Supabase
                <ExternalLink className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Full setup instructions are in the project README.
      </p>
    </div>
  );
}

export function SetupScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="mb-8">
        <LogoMark className="mx-auto size-11" />
      </div>
      <SetupNotice />
    </div>
  );
}
