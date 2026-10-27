import { firstParam, parsePage } from "@/lib/pagination";
import { isUuid, sanitizeSearchTerm } from "@/lib/search";

export const PRODUCT_STATUS_FILTERS = [
  "active",
  "in_stock",
  "low_stock",
  "out_of_stock",
  "archived",
] as const;

export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number];

export type ProductListFilters = {
  q: string;
  category: string;
  supplier: string;
  status: ProductStatusFilter;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseProductListFilters(
  searchParams: SearchParams,
): ProductListFilters {
  const status = firstParam(searchParams.status);
  const category = firstParam(searchParams.category);
  const supplier = firstParam(searchParams.supplier);

  return {
    q: sanitizeSearchTerm(firstParam(searchParams.q)),
    category: isUuid(category) ? category : "",
    supplier: isUuid(supplier) ? supplier : "",
    status:
      status && PRODUCT_STATUS_FILTERS.includes(status as ProductStatusFilter)
        ? (status as ProductStatusFilter)
        : "active",
    page: parsePage(searchParams.page),
  };
}
