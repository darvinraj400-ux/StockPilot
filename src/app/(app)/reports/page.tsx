import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Download,
  PackageCheck,
  PackageSearch,
  PackageX,
  TriangleAlert,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { StatCard } from "@/components/shared/stat-card";
import { StockStatusBadge } from "@/components/shared/status-badges";
import { MovementFilters } from "@/components/stock/movement-filters";
import { MovementTable } from "@/components/stock/movement-table";
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
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
import {
  getMovementsList,
  parseMovementListFilters,
  type MovementListFilters,
} from "@/lib/data/movements";
import { getInventoryReport } from "@/lib/data/reports";
import { getAdjustableProducts } from "@/lib/data/products";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reports",
};

const REPORT_VIEWS = [
  { id: "inventory", label: "Inventory valuation", href: "/reports" },
  { id: "low-stock", label: "Low stock", href: "/reports?view=low-stock" },
  { id: "out-of-stock", label: "Out of stock", href: "/reports?view=out-of-stock" },
  { id: "movements", label: "Movement history", href: "/reports?view=movements" },
] as const;

type ReportView = (typeof REPORT_VIEWS)[number]["id"];

function parseView(value: string | string[] | undefined): ReportView {
  const single = Array.isArray(value) ? value[0] : value;
  const match = REPORT_VIEWS.find((view) => view.id === single);
  return match?.id ?? "inventory";
}

function buildExportHref(view: ReportView, filters: MovementListFilters) {
  if (view === "movements") {
    const params = new URLSearchParams({ report: "movements" });
    if (filters.q) params.set("q", filters.q);
    if (filters.type !== "all") params.set("type", filters.type);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return `/reports/export?${params.toString()}`;
  }

  const report =
    view === "low-stock"
      ? "low-stock"
      : view === "out-of-stock"
        ? "out-of-stock"
        : "inventory";
  return `/reports/export?report=${report}`;
}

function ReportTabs({ current }: { current: ReportView }) {
  return (
    <nav
      aria-label="Report views"
      className="flex flex-wrap items-center gap-1 rounded-lg border bg-slate-50 p-1"
    >
      {REPORT_VIEWS.map((view) => {
        const active = view.id === current;
        return (
          <Link
            key={view.id}
            href={view.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                : "text-muted-foreground hover:bg-white/60 hover:text-slate-900",
            )}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ExportButton({ href }: { href: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>
        <Download />
        Export CSV
      </Link>
    </Button>
  );
}

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const rawSearchParams = await searchParams;
  const view = parseView(rawSearchParams.view);
  const filters = parseMovementListFilters(rawSearchParams);
  const exportHref = buildExportHref(view, filters);

  if (view === "movements") {
    const [{ movements, pagination, total }, adjustableProducts] = await Promise.all([
      getMovementsList(filters),
      getAdjustableProducts(),
    ]);
    const hasFilters = Boolean(
      filters.q || filters.type !== "all" || filters.from || filters.to,
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Inventory valuation, stock exceptions, and movement history — exported from the same records that power the app."
          actions={
            <>
              <ExportButton href={exportHref} />
              <StockMovementDialog
                products={adjustableProducts}
                triggerLabel="Record movement"
              />
            </>
          }
        />

        <ReportTabs current={view} />

        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Movement history</CardTitle>
              <CardDescription>
                Every receipt, issue, and adjustment in the selected period.
              </CardDescription>
            </div>
          </CardHeader>

          <MovementFilters
            filters={filters}
            searchParams={rawSearchParams}
            basePath="/reports"
          />

          {movements.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={ClipboardList}
                title="No movements match"
                description="Try a different product, movement type, or date range. Exports use the same filters."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/reports?view=movements">Clear filters</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No stock movements to report"
                description="Record a stock receipt, issue, or adjustment and it will appear here."
                action={
                  <StockMovementDialog
                    products={adjustableProducts}
                    triggerLabel="Record first movement"
                    triggerVariant="outline"
                    triggerSize="sm"
                  />
                }
              />
            )
          ) : (
            <>
              <MovementTable movements={movements} />
              <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
                {total} {total === 1 ? "movement" : "movements"} match the current
                filters. Export includes all matching rows.
              </div>
              <PaginationNav
                page={pagination.page}
                totalPages={pagination.totalPages}
                basePath="/reports"
                searchParams={rawSearchParams}
              />
            </>
          )}
        </Card>
      </div>
    );
  }

  const report = await getInventoryReport();
  const { rows, summary, categorySummary, lowStockRows, outOfStockRows } = report;
  const hasProducts = rows.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Inventory valuation, stock exceptions, and movement history — exported from the same records that power the app."
        actions={<ExportButton href={exportHref} />}
      />

      <ReportTabs current={view} />

      {!hasProducts ? (
        <Card>
          <EmptyState
            icon={PackageSearch}
            title="No active inventory to report"
            description="Add products and record stock movements to build your inventory reports."
            action={
              <Button asChild>
                <Link href="/products/new">Add a product</Link>
              </Button>
            }
          />
        </Card>
      ) : view === "inventory" ? (
        <>
          <section
            aria-label="Inventory summary"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              label="Active products"
              value={formatNumber(summary.activeProductCount)}
              hint="Archived products are excluded"
              icon={Boxes}
              tone="emerald"
            />
            <StatCard
              label="Units on hand"
              value={formatNumber(summary.totalUnits)}
              hint="Sum across active products"
              icon={PackageCheck}
              tone="slate"
            />
            <StatCard
              label="Inventory value"
              value={formatCurrency(summary.costValue)}
              hint="At cost price"
              icon={CircleDollarSign}
              tone="slate"
            />
            <StatCard
              label="Retail value"
              value={formatCurrency(summary.retailValue)}
              hint="At selling price"
              icon={CircleDollarSign}
              tone="emerald"
            />
          </section>

          <Card className="overflow-hidden">
            <CardHeader className="border-b pb-4">
              <div>
                <CardTitle>Valuation by category</CardTitle>
                <CardDescription>
                  Where inventory value sits across the catalog.
                </CardDescription>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Cost value</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Retail value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySummary.map((category) => (
                  <TableRow key={category.categoryName}>
                    <TableCell className="font-medium text-slate-900">
                      {category.categoryName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(category.productCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(category.units)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(category.costValue)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {formatCurrency(category.retailValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b pb-4">
              <div>
                <CardTitle>Inventory detail</CardTitle>
                <CardDescription>
                  All active products with quantity and value at both cost and
                  retail.
                </CardDescription>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost value</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    Retail value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.product.id}>
                    <TableCell className="max-w-[260px]">
                      <Link
                        href={`/products/${row.product.id}`}
                        className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {row.product.name}
                      </Link>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {row.product.sku}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {row.categoryName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-900">
                      {formatNumber(row.product.quantity_on_hand)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatNumber(row.product.reorder_level)}
                    </TableCell>
                    <TableCell>
                      <StockStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.costValue)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {formatCurrency(row.retailValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : view === "low-stock" ? (
        <LowStockReport
          rows={lowStockRows}
          outOfStockCount={outOfStockRows.length}
        />
      ) : (
        <OutOfStockReport rows={outOfStockRows} />
      )}
    </div>
  );
}

function LowStockReport({
  rows,
  outOfStockCount,
}: {
  rows: Awaited<ReturnType<typeof getInventoryReport>>["lowStockRows"];
  outOfStockCount: number;
}) {
  const unitsToReorder = rows.reduce(
    (total, row) =>
      total + Math.max(row.product.reorder_level - row.product.quantity_on_hand, 0),
    0,
  );
  const valueOnHand = rows.reduce((total, row) => total + row.costValue, 0);

  return (
    <>
      <section
        aria-label="Low stock summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Low-stock products"
          value={formatNumber(rows.length)}
          hint="At or below reorder level"
          icon={TriangleAlert}
          tone="amber"
        />
        <StatCard
          label="Out of stock"
          value={formatNumber(outOfStockCount)}
          hint="Included in the low-stock list"
          icon={PackageX}
          tone="red"
        />
        <StatCard
          label="Units to reorder"
          value={formatNumber(unitsToReorder)}
          hint="To reach each reorder level"
          icon={PackageSearch}
          tone="slate"
        />
        <StatCard
          label="Value on hand"
          value={formatCurrency(valueOnHand)}
          hint="At cost price"
          icon={CircleDollarSign}
          tone="slate"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div>
            <CardTitle>Low-stock report</CardTitle>
            <CardDescription>
              Products at or below their reorder level, lowest quantity first.
            </CardDescription>
          </div>
        </CardHeader>

        {rows.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Nothing below reorder level"
            description="Every active product is stocked above its reorder level."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/products">Browse products</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead className="text-right">Shortfall</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Cost value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.product.id}>
                  <TableCell className="max-w-[260px]">
                    <Link
                      href={`/products/${row.product.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {row.product.name}
                    </Link>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {row.product.sku}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.categoryName}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-slate-900">
                    {formatNumber(row.product.quantity_on_hand)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(row.product.reorder_level)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-amber-700">
                    {formatNumber(
                      Math.max(
                        row.product.reorder_level - row.product.quantity_on_hand,
                        0,
                      ),
                    )}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatCurrency(row.costValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

function OutOfStockReport({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getInventoryReport>>["outOfStockRows"];
}) {
  const unitsToReorder = rows.reduce(
    (total, row) => total + row.product.reorder_level,
    0,
  );
  const restockCost = rows.reduce(
    (total, row) => total + row.product.reorder_level * Number(row.product.cost_price),
    0,
  );

  return (
    <>
      <section
        aria-label="Out-of-stock summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="Out of stock"
          value={formatNumber(rows.length)}
          hint="Active products at zero on hand"
          icon={PackageX}
          tone="red"
        />
        <StatCard
          label="Units to reach reorder"
          value={formatNumber(unitsToReorder)}
          hint="Sum of reorder levels"
          icon={PackageSearch}
          tone="slate"
        />
        <StatCard
          label="Estimated restock cost"
          value={formatCurrency(restockCost)}
          hint="At current cost price"
          icon={CircleDollarSign}
          tone="slate"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div>
            <CardTitle>Out-of-stock report</CardTitle>
            <CardDescription>
              Active products with no units on hand, by product name.
            </CardDescription>
          </div>
        </CardHeader>

        {rows.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="No products are out of stock"
            description="Every active product has units on hand."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/products">Browse products</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                <TableHead className="text-right">Reorder level</TableHead>
                <TableHead className="text-right">Cost price</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Restock cost
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.product.id}>
                  <TableCell className="max-w-[260px]">
                    <Link
                      href={`/products/${row.product.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {row.product.name}
                    </Link>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {row.product.sku}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.categoryName}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {row.supplierName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-900">
                    {formatNumber(row.product.reorder_level)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.product.cost_price)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatCurrency(
                      row.product.reorder_level * Number(row.product.cost_price),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
