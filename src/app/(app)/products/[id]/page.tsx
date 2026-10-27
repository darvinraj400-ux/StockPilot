import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  LockKeyhole,
  Pencil,
  Tags,
  TriangleAlert,
  Truck,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  ActiveBadge,
  MovementTypeBadge,
  StockStatusBadge,
} from "@/components/shared/status-badges";
import { ProductStatusAction } from "@/components/products/product-status-action";
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductDetail } from "@/lib/data/products";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatQuantity,
  formatSignedNumber,
} from "@/lib/format";
import { getStockStatus } from "@/lib/inventory";
import { isUuid } from "@/lib/search";

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Product not found" };

  const detail = await getProductDetail(id);
  if (!detail) return { title: "Product not found" };

  return {
    title: detail.product.name,
    description: `Stock and movement history for ${detail.product.name} (${detail.product.sku}).`,
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const detail = await getProductDetail(id);
  if (!detail) notFound();

  const { product, category, supplier, movements, movementCount } = detail;
  const status = getStockStatus(product.quantity_on_hand, product.reorder_level);
  const inventoryValue = product.quantity_on_hand * Number(product.cost_price);
  const retailValue = product.quantity_on_hand * Number(product.selling_price);
  const margin =
    Number(product.selling_price) > 0
      ? ((Number(product.selling_price) - Number(product.cost_price)) /
          Number(product.selling_price)) *
        100
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · ${formatQuantity(
          product.quantity_on_hand,
          product.unit,
        )} on hand`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        actions={
          <>
            {product.is_active ? (
              <StockMovementDialog
                products={[product]}
                defaultProductId={product.id}
                triggerLabel="Adjust stock"
                triggerVariant="outline"
              />
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil />
                Edit
              </Link>
            </Button>
            <ProductStatusAction
              productId={product.id}
              productName={product.name}
              isActive={product.is_active}
            />
          </>
        }
      />

      {!product.is_active ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">This product is archived.</p>
            <p className="mt-0.5 text-[13px] leading-5 text-amber-800">
              Archived products cannot receive stock movements. Existing ledger
              entries remain available. Reactivate the product to resume stock
              operations.
            </p>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Stock position</CardTitle>
            <CardDescription>
              Current quantity and valuation at cost and selling prices.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StockStatusBadge status={status} />
            {!product.is_active ? <ActiveBadge active={false} /> : null}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                On hand
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
                {formatNumber(product.quantity_on_hand)}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {product.unit}
                </span>
              </dd>
            </div>
            <div className="bg-card p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Reorder level
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
                {formatNumber(product.reorder_level)}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {product.unit}
                </span>
              </dd>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Alerts at or below this level
              </p>
            </div>
            <div className="bg-card p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Value at cost
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
                {formatCurrency(inventoryValue)}
              </dd>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatCurrency(product.cost_price)} per {product.unit}
              </p>
            </div>
            <div className="bg-card p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Value at retail
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
                {formatCurrency(retailValue)}
              </dd>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatCurrency(product.selling_price)} per {product.unit}
              </p>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Quantity is written by the transactional stock ledger. It cannot be
            edited directly from the product form or API.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Catalog details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Description
              </p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {product.description || "No description provided."}
              </p>
            </div>
            <dl className="space-y-3 border-t pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Tags className="size-3.5" aria-hidden="true" />
                  Category
                </dt>
                <dd className="text-right">
                  {category ? (
                    <Link
                      href={`/products?category=${category.id}`}
                      className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {category.name}
                      {category.is_active ? "" : " (archived)"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Uncategorized</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="size-3.5" aria-hidden="true" />
                  Supplier
                </dt>
                <dd className="text-right">
                  {supplier ? (
                    <Link
                      href={`/products?supplier=${supplier.id}`}
                      className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {supplier.name}
                      {supplier.is_active ? "" : " (archived)"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">No supplier</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Created
                </dt>
                <dd className="text-slate-700">{formatDateTime(product.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Last updated
                </dt>
                <dd className="text-slate-700">{formatDateTime(product.updated_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
              <div className="bg-card p-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Cost price
                </dt>
                <dd className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900">
                  {formatCurrency(product.cost_price)}
                </dd>
              </div>
              <div className="bg-card p-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Selling price
                </dt>
                <dd className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900">
                  {formatCurrency(product.selling_price)}
                </dd>
              </div>
              <div className="bg-card p-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Gross margin
                </dt>
                <dd className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900">
                  {margin === null ? "—" : `${margin.toFixed(1)}%`}
                </dd>
              </div>
              <div className="bg-card p-4">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Margin per unit
                </dt>
                <dd className="mt-1.5 text-lg font-semibold tabular-nums text-slate-900">
                  {formatCurrency(
                    Number(product.selling_price) - Number(product.cost_price),
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
              Prices are stored as fixed-point decimals. Inventory valuation uses
              the cost price.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Stock history</CardTitle>
            <CardDescription>
              {movementCount === 0
                ? "No movements recorded for this product."
                : `Latest ${movements.length} of ${movementCount} ${
                    movementCount === 1 ? "movement" : "movements"
                  }, newest first.`}
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/stock-movements?q=${encodeURIComponent(product.sku)}`}>
              View in ledger
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {movements.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No stock movements yet"
              description={
                product.is_active
                  ? "Record a stock-in movement to add units. Every change will be listed here with its before-and-after quantity."
                  : "Archived products cannot receive movements. Reactivate this product to resume stock operations."
              }
              action={
                product.is_active ? (
                  <StockMovementDialog
                    products={[product]}
                    defaultProductId={product.id}
                    triggerLabel="Record first movement"
                    triggerVariant="outline"
                    triggerSize="sm"
                  />
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recorded</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead className="hidden md:table-cell">Note</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(movement.created_at)}
                    </TableCell>
                    <TableCell>
                      <MovementTypeBadge type={movement.movement_type} />
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        movement.quantity_delta > 0
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {formatSignedNumber(movement.quantity_delta)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">
                      {formatNumber(movement.quantity_before)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-900">
                      {formatNumber(movement.quantity_after)}
                    </TableCell>
                    <TableCell className="hidden max-w-[260px] truncate text-xs text-muted-foreground md:table-cell">
                      {movement.note || "—"}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          href={`/stock-movements/${movement.id}`}
                          aria-label="View movement details"
                        >
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
