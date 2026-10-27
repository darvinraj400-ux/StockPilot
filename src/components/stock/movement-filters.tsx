"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOVEMENT_TYPE_LABELS } from "@/lib/inventory";
import type { MovementListFilters } from "@/lib/data/movements";

type SearchParams = Record<string, string | string[] | undefined>;

export function MovementFilters({
  filters,
  searchParams,
  basePath = "/stock-movements",
}: {
  filters: MovementListFilters;
  searchParams: SearchParams;
  basePath?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const currentView =
    typeof searchParams.view === "string" ? searchParams.view : null;

  // Keep the uncontrolled fields aligned with URL state after Clear or history navigation.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const expected: Record<string, string> = {
      q: filters.q,
      from: filters.from ?? "",
      to: filters.to ?? "",
    };
    for (const [name, value] of Object.entries(expected)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement && field.value !== value) {
        field.value = value;
      }
    }
  });

  function navigate(changes: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(searchParams)) {
      if (key === "page") continue;
      const single = Array.isArray(raw) ? raw[0] : raw;
      if (single) params.set(key, single);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    navigate({
      q: String(formData.get("q") ?? "").trim(),
      from: String(formData.get("from") ?? ""),
      to: String(formData.get("to") ?? ""),
    });
  }

  const hasFilters = Boolean(
    filters.q ||
      filters.type !== "all" ||
      filters.from ||
      filters.to,
  );

  return (
    <form
      ref={formRef}
      onSubmit={onSearch}
      className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-end"
    >
      <div className="grid w-full gap-3 sm:grid-cols-2 xl:flex xl:items-center">
        <div className="relative w-full xl:max-w-[240px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search product or SKU…"
            aria-label="Search stock movements by product"
            className="pl-9"
          />
        </div>

        <div className="relative">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            aria-label="From date"
            className="pl-9"
          />
        </div>

        <div className="relative">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            aria-label="To date"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
        <Select
          value={filters.type}
          onValueChange={(value) => navigate({ type: value === "all" ? "" : value })}
        >
          <SelectTrigger size="sm" className="w-[150px]" aria-label="Filter by movement type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" size="sm" variant="secondary">
          Apply dates
        </Button>

        {hasFilters ? (
          <Button asChild variant="ghost" size="sm">
            <Link
              href={
                currentView
                  ? `${basePath}?view=${encodeURIComponent(currentView)}`
                  : basePath
              }
            >
              <X />
              Clear
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
