import Link from "next/link";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function AppNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-xs sm:p-8">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
          <PackageSearch className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          404
        </p>
        <h1 className="mt-1.5 text-lg font-semibold text-slate-900">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The record may have been archived or removed, or the address is
          incorrect.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">View products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
