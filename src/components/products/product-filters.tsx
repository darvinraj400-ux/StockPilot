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
import type { Category, Supplier } from "@/types/database";
import {
  PRODUCT_STATUS_FILTERS,
  type ProductListFilters,
} from "@/lib/product-filters";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

const statusLabels: Record<ProductListFilters["status"], string> = {
  active: "Active products",
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  archived: "Archived",
};

export function ProductFilters({
  filters,
  categories,
  suppliers,
  searchParams,
}: {
  filters: ProductListFilters;
  categories: Category[];
  suppliers: Supplier[];
  searchParams: SearchParams;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Keep the uncontrolled field aligned with URL state after Clear or history navigation.
  useEffect(() => {
    const input = formRef.current?.elements.namedItem("q");
    if (input instanceof HTMLInputElement && input.value !== filters.q) {
      input.value = filters.q;
    }
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [param, raw] of Object.entries(searchParams)) {
      if (param === "page") continue;
      const single = Array.isArray(raw) ? raw[0] : raw;
      if (single) params.set(param, single);
    }
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("q") ?? "").trim();
    updateParam("q", value);
  }

  const hasFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.supplier ||
      filters.status !== "active",
  );

  return (
    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
      <form
        ref={formRef}
        onSubmit={onSearch}
        className="relative w-full lg:max-w-xs"
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search name or SKU…"
          aria-label="Search products"
          className="pl-9"
        />
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center">
        <Select
          value={filters.status}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger size="sm" className="w-full lg:w-[150px]" aria-label="Filter by stock status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_STATUS_FILTERS.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category || "all"}
          onValueChange={(value) => updateParam("category", value)}
        >
          <SelectTrigger size="sm" className="w-full lg:w-[170px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
                {category.is_active ? "" : " (archived)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.supplier || "all"}
          onValueChange={(value) => updateParam("supplier", value)}
        >
          <SelectTrigger size="sm" className="w-full lg:w-[160px]" aria-label="Filter by supplier">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
                {supplier.is_active ? "" : " (archived)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn("col-span-2 justify-start sm:col-span-1")}
          >
            <Link href="/products">
              <X />
              Clear
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
