"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchParams = Record<string, string | string[] | undefined>;

export type StatusOption = {
  value: string;
  label: string;
};

export function SearchFilterBar({
  basePath,
  searchParams,
  q,
  status,
  statusOptions,
  placeholder,
  statusAriaLabel,
}: {
  basePath: string;
  searchParams: SearchParams;
  q: string;
  status: string;
  statusOptions: StatusOption[];
  placeholder: string;
  statusAriaLabel: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Keep the uncontrolled field aligned with URL state after Clear or history navigation.
  useEffect(() => {
    const input = formRef.current?.elements.namedItem("q");
    if (input instanceof HTMLInputElement && input.value !== q) {
      input.value = q;
    }
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [param, raw] of Object.entries(searchParams)) {
      const single = Array.isArray(raw) ? raw[0] : raw;
      if (single) params.set(param, single);
    }
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateParam("q", String(formData.get("q") ?? "").trim());
  }

  const hasFilters = Boolean(q || status !== "all");

  return (
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
      <form
        ref={formRef}
        onSubmit={onSearch}
        className="relative w-full sm:max-w-xs"
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-9"
        />
      </form>

      <div className="flex items-center gap-2 sm:ml-auto">
        <Select
          value={status}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger
            size="sm"
            className="w-full sm:w-[150px]"
            aria-label={statusAriaLabel}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={basePath}>
              <X />
              Clear
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
