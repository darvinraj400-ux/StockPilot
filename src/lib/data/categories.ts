import "server-only";

import { requireUser } from "@/lib/auth";
import { firstParam } from "@/lib/pagination";
import { sanitizeSearchTerm } from "@/lib/search";
import type { Category } from "@/types/database";
import { handleQueryError } from "@/lib/data/utils";

export type CategoryStatusFilter = "all" | "active" | "archived";

export type CategoryListFilters = {
  q: string;
  status: CategoryStatusFilter;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseCategoryListFilters(
  searchParams: SearchParams,
): CategoryListFilters {
  const status = firstParam(searchParams.status);
  return {
    q: sanitizeSearchTerm(firstParam(searchParams.q)),
    status:
      status === "active" || status === "archived" ? status : "all",
  };
}

export type CategoryWithCount = Category & {
  active_product_count: number;
};

export async function getCategoriesList(filters: CategoryListFilters) {
  const { supabase, user } = await requireUser();

  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters.status === "archived") {
    query = query.eq("is_active", false);
  }

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  const [categoriesResult, countsResult] = await Promise.all([
    query,
    supabase.rpc("get_category_product_counts"),
  ]);

  handleQueryError(categoriesResult.error, "categories");
  handleQueryError(countsResult.error, "category product counts");

  const countMap = new Map<string, number>();
  for (const row of countsResult.data ?? []) {
    countMap.set(row.category_id, Number(row.active_product_count));
  }

  const categories = ((categoriesResult.data ?? []) as Category[]).map(
    (category) => ({
      ...category,
      active_product_count: countMap.get(category.id) ?? 0,
    }),
  );

  return { categories, total: categories.length };
}
