import "server-only";

import { requireUser } from "@/lib/auth";
import { firstParam } from "@/lib/pagination";
import { sanitizeSearchTerm } from "@/lib/search";
import type { Supplier } from "@/types/database";
import { handleQueryError } from "@/lib/data/utils";

export type SupplierStatusFilter = "all" | "active" | "archived";

export type SupplierListFilters = {
  q: string;
  status: SupplierStatusFilter;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseSupplierListFilters(
  searchParams: SearchParams,
): SupplierListFilters {
  const status = firstParam(searchParams.status);
  return {
    q: sanitizeSearchTerm(firstParam(searchParams.q)),
    status:
      status === "active" || status === "archived" ? status : "all",
  };
}

export type SupplierWithCount = Supplier & {
  active_product_count: number;
};

export async function getSuppliersList(filters: SupplierListFilters) {
  const { supabase, user } = await requireUser();

  let query = supabase
    .from("suppliers")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters.status === "archived") {
    query = query.eq("is_active", false);
  }

  if (filters.q) {
    query = query.or(
      `name.ilike.%${filters.q}%,contact_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`,
    );
  }

  const [suppliersResult, countsResult] = await Promise.all([
    query,
    supabase.rpc("get_supplier_product_counts"),
  ]);

  handleQueryError(suppliersResult.error, "suppliers");
  handleQueryError(countsResult.error, "supplier product counts");

  const countMap = new Map<string, number>();
  for (const row of countsResult.data ?? []) {
    countMap.set(row.supplier_id, Number(row.active_product_count));
  }

  const suppliers = ((suppliersResult.data ?? []) as Supplier[]).map(
    (supplier) => ({
      ...supplier,
      active_product_count: countMap.get(supplier.id) ?? 0,
    }),
  );

  return { suppliers, total: suppliers.length };
}
