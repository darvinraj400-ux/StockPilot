import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationNav } from "@/components/shared/pagination-nav";
import {
  ActiveBadge,
  StockStatusBadge,
} from "@/components/shared/status-badges";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductRowActions } from "@/components/products/product-row-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductList } from "@/lib/data/products";
import { parseProductListFilters } from "@/lib/product-filters";
import {
  formatCurrency,
  formatNumber,
  formatQuantity,
} from "@/lib/format";
import { getStockStatus, inventoryValue } from "@/lib/inventory";

export const metadata: Metadata = {
  title: "Products",
};

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const rawSearchParams = await searchParams;
  const filters = parseProductListFilters(rawSearchParams);
  const { products, total, pagination, categories, suppliers } =
    await getProductList(filters);

  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));

  const hasFilters = Boolean(
    filters.q || filters.category || filters.supplier || filters.status !== "active",
  );
  const showingFrom = total === 0 ? 0 : pagination.from + 1;
  const showingTo = Math.min(pagination.to + 1, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage SKUs, pricing, stock levels, and reorder thresholds. Quantities only change through recorded stock movements."
        actions={
          <Button asChild>
            <Link href="/products/new">
              <Plus />
              New product
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <ProductFilters
          filters={filters}
          categories={categories}
          suppliers={suppliers}
          searchParams={rawSearchParams}
        />

        {products.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={PackageSearch}
              title="No products match these filters"
              description="Try a different search term or clear the filters to see your full catalog."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/products">Clear filters</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="No products yet"
              description="Add your first product to start tracking stock, costs, and reorder levels. Every product begins with a quantity of zero."
              action={
                <Button asChild>
                  <Link href="/products/new">
                    <Plus />
                    Add your first product
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Cost</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Price</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Value</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="max-w-[260px]">
                      <Link
                        href={`/products/${product.id}`}
                        className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {product.name}
                      </Link>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {product.sku}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block max-w-[180px] truncate text-[13px] text-slate-600">
                        {product.category_id
                          ? (categoryMap.get(product.category_id) ?? "Unknown")
                          : "Uncategorized"}
                      </span>
                      <span className="block max-w-[180px] truncate text-[11px] text-muted-foreground">
                        {product.supplier_id
                          ? (supplierMap.get(product.supplier_id) ?? "Unknown supplier")
                          : "No supplier"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <StockStatusBadge
                          status={getStockStatus(
                            product.quantity_on_hand,
                            product.reorder_level,
                          )}
                        />
                      ) : (
                        <ActiveBadge active={false} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium tabular-nums text-slate-900">
                        {formatNumber(product.quantity_on_hand)}
                      </span>
                      <span className="ml-1 text-[11px] text-muted-foreground">
                        {product.unit}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        reorder at {formatNumber(product.reorder_level)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-slate-600 lg:table-cell">
                      {formatCurrency(product.cost_price)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-slate-600 lg:table-cell">
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell className="hidden text-right font-medium tabular-nums text-slate-900 xl:table-cell">
                      {formatCurrency(
                        inventoryValue(product.quantity_on_hand, product.cost_price),
                      )}
                    </TableCell>
                    <TableCell>
                      <ProductRowActions
                        productId={product.id}
                        productName={product.name}
                        isActive={product.is_active}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {showingFrom}–{showingTo}
                </span>{" "}
                of <span className="font-medium text-foreground">{total}</span>{" "}
                {total === 1 ? "product" : "products"}
              </span>
              <span className="hidden sm:inline">
                {formatQuantity(
                  products.reduce((sum, product) => sum + product.quantity_on_hand, 0),
                  "units on this page",
                )}
              </span>
            </div>
            <PaginationNav
              page={pagination.page}
              totalPages={pagination.totalPages}
              basePath="/products"
              searchParams={rawSearchParams}
            />
          </>
        )}
      </Card>
    </div>
  );
}
