import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/auth";
import { getPagination } from "@/lib/pagination";
import type { ProductListFilters } from "@/lib/product-filters";
import { handleQueryError } from "@/lib/data/utils";
import { isUuid } from "@/lib/search";
import type {
  Category,
  Database,
  Product,
  StockMovement,
  Supplier,
} from "@/types/database";

export async function getProductList(filters: ProductListFilters) {
  const { supabase, user } = await requireUser();
  const term = filters.q;

  let countQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  let dataQuery = supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id);

  switch (filters.status) {
    case "in_stock":
      countQuery = countQuery.eq("is_active", true).eq("needs_reorder", false);
      dataQuery = dataQuery.eq("is_active", true).eq("needs_reorder", false);
      break;
    case "low_stock":
      countQuery = countQuery.eq("is_active", true).eq("needs_reorder", true);
      dataQuery = dataQuery.eq("is_active", true).eq("needs_reorder", true);
      break;
    case "out_of_stock":
      countQuery = countQuery.eq("is_active", true).eq("quantity_on_hand", 0);
      dataQuery = dataQuery.eq("is_active", true).eq("quantity_on_hand", 0);
      break;
    case "archived":
      countQuery = countQuery.eq("is_active", false);
      dataQuery = dataQuery.eq("is_active", false);
      break;
    case "active":
    default:
      countQuery = countQuery.eq("is_active", true);
      dataQuery = dataQuery.eq("is_active", true);
      break;
  }

  if (filters.category) {
    countQuery = countQuery.eq("category_id", filters.category);
    dataQuery = dataQuery.eq("category_id", filters.category);
  }

  if (filters.supplier) {
    countQuery = countQuery.eq("supplier_id", filters.supplier);
    dataQuery = dataQuery.eq("supplier_id", filters.supplier);
  }

  if (term) {
    const search = `name.ilike.%${term}%,sku.ilike.%${term}%`;
    countQuery = countQuery.or(search);
    dataQuery = dataQuery.or(search);
  }

  const [countResult, categoriesResult, suppliersResult] = await Promise.all([
    countQuery,
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  handleQueryError(countResult.error, "products");
  handleQueryError(categoriesResult.error, "categories");
  handleQueryError(suppliersResult.error, "suppliers");

  const pagination = getPagination(countResult.count ?? 0, filters.page);

  const { data, error } = await dataQuery
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(pagination.from, pagination.to);

  handleQueryError(error, "products");

  return {
    products: (data ?? []) as Product[],
    total: countResult.count ?? 0,
    pagination,
    categories: (categoriesResult.data ?? []) as Category[],
    suppliers: (suppliersResult.data ?? []) as Supplier[],
  };
}

export type ProductDetail = {
  product: Product;
  category: Pick<Category, "id" | "name" | "is_active"> | null;
  supplier: Pick<Supplier, "id" | "name" | "is_active"> | null;
  movements: StockMovement[];
  movementCount: number;
};

async function loadProductDetail(
  id: string,
): Promise<ProductDetail | null> {
  if (!isUuid(id)) return null;

  const { supabase, user } = await requireUser();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  handleQueryError(error, "this product");
  if (!product) return null;

  const [categoryResult, supplierResult, movementsResult] = await Promise.all([
    product.category_id
      ? supabase
          .from("categories")
          .select("id, name, is_active")
          .eq("id", product.category_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    product.supplier_id
      ? supabase
          .from("suppliers")
          .select("id, name, is_active")
          .eq("id", product.supplier_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("stock_movements")
      .select("*", { count: "exact" })
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(50),
  ]);

  handleQueryError(categoryResult.error, "the product category");
  handleQueryError(supplierResult.error, "the product supplier");
  handleQueryError(movementsResult.error, "the stock history");

  return {
    product: product as Product,
    category: categoryResult.data as ProductDetail["category"],
    supplier: supplierResult.data as ProductDetail["supplier"],
    movements: (movementsResult.data ?? []) as StockMovement[],
    movementCount: movementsResult.count ?? 0,
  };
}

export const getProductDetail = cache(loadProductDetail);

export async function getProductFormOptions() {
  const { supabase, user } = await requireUser();

  const [categoriesResult, suppliersResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  handleQueryError(categoriesResult.error, "categories");
  handleQueryError(suppliersResult.error, "suppliers");

  return {
    categories: (categoriesResult.data ?? []) as Category[],
    suppliers: (suppliersResult.data ?? []) as Supplier[],
  };
}

export type AdjustableProduct = Pick<
  Product,
  "id" | "name" | "sku" | "unit" | "quantity_on_hand" | "is_active"
>;

export async function getAdjustableProducts(): Promise<AdjustableProduct[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, unit, quantity_on_hand, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .limit(500);

  handleQueryError(error, "products");

  return (data ?? []) as AdjustableProduct[];
}

export async function fetchAllProducts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Product[]> {
  const pageSize = 1000;
  const all: Product[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    handleQueryError(error, "products");

    const rows = (data ?? []) as Product[];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

export async function fetchAllCategoriesAndSuppliers(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const [categoriesResult, suppliersResult] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("suppliers").select("*").eq("user_id", userId),
  ]);

  handleQueryError(categoriesResult.error, "categories");
  handleQueryError(suppliersResult.error, "suppliers");

  return {
    categories: (categoriesResult.data ?? []) as Category[],
    suppliers: (suppliersResult.data ?? []) as Supplier[],
  };
}
