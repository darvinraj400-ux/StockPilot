import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

function buildHref(basePath: string, searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function PaginationNav({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: SearchParams;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t px-4 py-3"
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(basePath, searchParams ?? {}, page - 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            rel="prev"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
          >
            <ChevronLeft className="size-4" />
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(basePath, searchParams ?? {}, page + 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            rel="next"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
          >
            Next
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
