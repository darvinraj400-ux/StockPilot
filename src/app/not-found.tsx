import Link from "next/link";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <Logo />
      <span className="mt-10 flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs">
        <PackageSearch className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        This page could not be found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        The page may have moved, or the link may be incorrect. Head back to your
        workspace to continue.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
