import "server-only";

import { requireUser } from "@/lib/auth";
import {
  buildInventoryReportRows,
  getLowStockRows,
  getOutOfStockRows,
  groupInventoryByCategory,
  summarizeInventory,
} from "@/lib/reports";
import {
  fetchAllCategoriesAndSuppliers,
  fetchAllProducts,
} from "@/lib/data/products";
import {
  findProductIdsForSearch,
  getProductLookupMap,
} from "@/lib/data/movements";
import type { MovementListFilters, MovementWithProduct } from "@/lib/data/movements";
import {
  endOfDayExclusiveIso,
  startOfDayIso,
} from "@/lib/dates";
import { handleQueryError } from "@/lib/data/utils";
import type { StockMovement } from "@/types/database";

export async function getInventoryReport() {
  const { supabase, user } = await requireUser();

  const [products, references] = await Promise.all([
    fetchAllProducts(supabase, user.id),
    fetchAllCategoriesAndSuppliers(supabase, user.id),
  ]);

  const rows = buildInventoryReportRows(
    products,
    references.categories,
    references.suppliers,
  );

  return {
    rows,
    summary: summarizeInventory(rows),
    categorySummary: groupInventoryByCategory(rows),
    lowStockRows: getLowStockRows(rows),
    outOfStockRows: getOutOfStockRows(rows),
  };
}

export async function getAllMovementsForExport(
  filters: MovementListFilters,
): Promise<MovementWithProduct[]> {
  const { supabase, user } = await requireUser();
  const matchingProductIds = await findProductIdsForSearch(
    filters.q,
    supabase,
    user.id,
  );

  if (matchingProductIds && matchingProductIds.length === 0) return [];

  const pageSize = 1000;
  const all: StockMovement[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("user_id", user.id);

    if (filters.type !== "all") {
      query = query.eq("movement_type", filters.type);
    }
    if (filters.from) {
      query = query.gte("created_at", startOfDayIso(filters.from));
    }
    if (filters.to) {
      query = query.lt("created_at", endOfDayExclusiveIso(filters.to));
    }
    if (matchingProductIds) {
      query = query.in("product_id", matchingProductIds);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + pageSize - 1);

    handleQueryError(error, "stock movements");

    const rows = (data ?? []) as StockMovement[];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  const productMap = await getProductLookupMap(
    all.map((movement) => movement.product_id),
    supabase,
    user.id,
  );

  return all.map((movement) => ({
    ...movement,
    product: productMap.get(movement.product_id) ?? null,
  }));
}
