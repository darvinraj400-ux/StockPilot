import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, StockMovement } from "@/types/database";
import { requireUser } from "@/lib/auth";
import {
  endOfDayExclusiveIso,
  parseDateInput,
  startOfDayIso,
} from "@/lib/dates";
import { getPagination, firstParam, parsePage } from "@/lib/pagination";
import { MOVEMENT_TYPES, type MovementType } from "@/lib/inventory";
import { sanitizeSearchTerm, isUuid } from "@/lib/search";
import { handleQueryError } from "@/lib/data/utils";

export type MovementListFilters = {
  q: string;
  type: MovementType | "all";
  from: string | null;
  to: string | null;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseMovementListFilters(
  searchParams: SearchParams,
): MovementListFilters {
  const type = firstParam(searchParams.type);
  return {
    q: sanitizeSearchTerm(firstParam(searchParams.q)),
    type:
      type && MOVEMENT_TYPES.includes(type as MovementType)
        ? (type as MovementType)
        : "all",
    from: parseDateInput(searchParams.from),
    to: parseDateInput(searchParams.to),
    page: parsePage(searchParams.page),
  };
}

export type MovementWithProduct = StockMovement & {
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  } | null;
};

export type ProductLookup = {
  id: string;
  name: string;
  sku: string;
  unit: string;
};

export async function findProductIdsForSearch(
  q: string,
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  if (!q) return null;
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .limit(200);

  handleQueryError(error, "products");
  return (data ?? []).map((row) => row.id);
}

export async function getMovementsList(filters: MovementListFilters) {
  const { supabase, user } = await requireUser();
  const matchingProductIds = await findProductIdsForSearch(
    filters.q,
    supabase,
    user.id,
  );

  if (matchingProductIds && matchingProductIds.length === 0) {
    return {
      movements: [] as MovementWithProduct[],
      pagination: getPagination(0, filters.page, 15),
      total: 0,
    };
  }

  let countQuery = supabase
    .from("stock_movements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  let dataQuery = supabase
    .from("stock_movements")
    .select("*")
    .eq("user_id", user.id);

  if (filters.type !== "all") {
    countQuery = countQuery.eq("movement_type", filters.type);
    dataQuery = dataQuery.eq("movement_type", filters.type);
  }
  if (filters.from) {
    countQuery = countQuery.gte("created_at", startOfDayIso(filters.from));
    dataQuery = dataQuery.gte("created_at", startOfDayIso(filters.from));
  }
  if (filters.to) {
    countQuery = countQuery.lt("created_at", endOfDayExclusiveIso(filters.to));
    dataQuery = dataQuery.lt("created_at", endOfDayExclusiveIso(filters.to));
  }
  if (matchingProductIds) {
    countQuery = countQuery.in("product_id", matchingProductIds);
    dataQuery = dataQuery.in("product_id", matchingProductIds);
  }

  const countResult = await countQuery;
  handleQueryError(countResult.error, "stock movements");

  const pagination = getPagination(countResult.count ?? 0, filters.page, 15);

  const { data, error } = await dataQuery
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(pagination.from, pagination.to);

  handleQueryError(error, "stock movements");

  const movements = (data ?? []) as StockMovement[];
  const productMap = await getProductLookupMap(
    movements.map((movement) => movement.product_id),
    supabase,
    user.id,
  );

  return {
    movements: movements.map((movement) => ({
      ...movement,
      product: productMap.get(movement.product_id) ?? null,
    })),
    pagination,
    total: countResult.count ?? 0,
  };
}

export async function getProductLookupMap(
  productIds: string[],
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const map = new Map<string, ProductLookup>();
  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length === 0) return map;

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, unit")
    .eq("user_id", userId)
    .in("id", uniqueIds);

  handleQueryError(error, "products");

  for (const product of data ?? []) {
    map.set(product.id, product as ProductLookup);
  }
  return map;
}

async function loadMovementDetail(id: string) {
  if (!isUuid(id)) return null;

  const { supabase, user } = await requireUser();

  const { data: movement, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  handleQueryError(error, "this stock movement");
  if (!movement) return null;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, sku, unit, is_active, quantity_on_hand")
    .eq("id", movement.product_id)
    .eq("user_id", user.id)
    .maybeSingle();

  handleQueryError(productError, "the product");

  return {
    movement: movement as StockMovement,
    product: product as {
      id: string;
      name: string;
      sku: string;
      unit: string;
      is_active: boolean;
      quantity_on_hand: number;
    } | null,
  };
}

export const getMovementDetail = cache(loadMovementDetail);
