import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  PackageCheck,
  PackageX,
  Plus,
  Tags,
  TriangleAlert,
} from "lucide-react";

import { MovementChart } from "@/components/dashboard/movement-chart";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import {
  MovementTypeBadge,
  StockStatusBadge,
} from "@/components/shared/status-badges";
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog";
import { Badge } from "@/components/ui/badge";
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
import { getDashboardData } from "@/lib/data/dashboard";
import { getAdjustableProducts } from "@/lib/data/products";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatSignedNumber,
} from "@/lib/format";
import { getStockStatus } from "@/lib/inventory";

export const metadata: Metadata = {
  title: "Dashboard",
};

const onboardingSteps = [
  {
    title: "Add a product",
    body: "Start with a name, SKU, unit, and pricing. The quantity begins at zero.",
  },
  {
    title: "Set a reorder level",
    body: "StockPilot flags products when on hand drops to or below this threshold.",
  },
  {
    title: "Record a movement",
    body: "Receive or issue stock. The ledger records the quantity before and after.",
  },
];

export default async function DashboardPage() {
  const [data, adjustableProducts] = await Promise.all([
    getDashboardData(),
    getAdjustableProducts(),
  ]);

  const { summary, alerts, series, recentMovements } = data;
  const hasProducts = summary.total_active_products > 0;
  const hasMovementActivity = series.some(
    (point) => point.stock_in > 0 || point.stock_out > 0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Inventory position and recent activity, calculated from your own records."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/products/new">
                <Plus />
                New product
              </Link>
            </Button>
            <StockMovementDialog
              products={adjustableProducts}
              triggerLabel="Record movement"
            />
          </>
        }
      />

      <section
        aria-label="Inventory summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Active products"
          value={formatNumber(summary.total_active_products)}
          hint="Excludes archived products"
          icon={Boxes}
          tone="emerald"
        />
        <StatCard
          label="Inventory value"
          value={formatCurrency(summary.inventory_value)}
          hint="At cost price"
          icon={CircleDollarSign}
          tone="slate"
        />
        <StatCard
          label="Low stock"
          value={formatNumber(summary.low_stock_count)}
          hint="At or below reorder level"
          icon={TriangleAlert}
          tone="amber"
        />
        <StatCard
          label="Out of stock"
          value={formatNumber(summary.out_of_stock_count)}
          hint={
            summary.out_of_stock_count > 0
              ? "Needs immediate attention"
              : "Nothing is out of stock"
          }
          icon={PackageX}
          tone="red"
        />
      </section>

      {!hasProducts ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
              <div>
                <span className="flex size-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Boxes className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  Your workspace is ready
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Add your first product to begin tracking stock. Categories and
                  suppliers are optional — you can organize the catalog as it
                  grows.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/products/new">
                      <Plus />
                      Add your first product
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/categories">
                      <Tags />
                      Create a category
                    </Link>
                  </Button>
                </div>
              </div>

              <ol className="space-y-3">
                {onboardingSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-3 rounded-lg border bg-slate-50/60 p-3.5"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-slate-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Movement activity</CardTitle>
                  <CardDescription>
                    Stock in and stock out over the last 14 days.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-emerald-600" />
                    Stock in
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-slate-300" />
                    Stock out
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {hasMovementActivity ? (
                  <MovementChart data={series} />
                ) : (
                  <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                    <p className="text-sm font-medium text-slate-900">
                      No movement activity yet
                    </p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                      Record stock in or stock out and the chart will fill in
                      from your ledger.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Needs attention</CardTitle>
                  <CardDescription>
                    Products at or below their reorder level.
                  </CardDescription>
                </div>
                {summary.low_stock_count > 0 ? (
                  <Badge variant="warning">
                    {formatNumber(summary.low_stock_count)}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="pt-1">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <span className="flex size-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                      <PackageCheck className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      All stocked up
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      No products are at or below their reorder level.
                    </p>
                  </div>
                ) : (
                  <ul className="-mx-5 divide-y">
                    {alerts.map((alert) => (
                      <li key={alert.id}>
                        <Link
                          href={`/products/${alert.id}`}
                          className="flex items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-slate-900">
                              {alert.name}
                            </span>
                            <span className="block font-mono text-[11px] text-muted-foreground">
                              {alert.sku}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-right text-[11px] leading-4 text-muted-foreground">
                              <span className="block font-semibold tabular-nums text-slate-900">
                                {formatNumber(alert.quantity_on_hand)}
                              </span>
                              of {formatNumber(alert.reorder_level)}
                            </span>
                            <StockStatusBadge
                              status={getStockStatus(
                                alert.quantity_on_hand,
                                alert.reorder_level,
                              )}
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              {alerts.length > 0 ? (
                <div className="mt-auto border-t px-5 py-3">
                  <Link
                    href="/products?status=low_stock"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    View all low-stock products
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent stock movements</CardTitle>
                <CardDescription>
                  The latest entries in your audit ledger.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/stock-movements">
                  View ledger
                  <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {recentMovements.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No stock movements yet"
                  description="Receipts, issues, and adjustments will appear here with their before-and-after quantities."
                  action={
                    <StockMovementDialog
                      products={adjustableProducts}
                      triggerLabel="Record first movement"
                      triggerVariant="outline"
                      triggerSize="sm"
                    />
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">Resulting</TableHead>
                      <TableHead className="hidden md:table-cell">Recorded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="max-w-[240px]">
                          {movement.product ? (
                            <Link
                              href={`/products/${movement.product.id}`}
                              className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                            >
                              {movement.product.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              Product removed
                            </span>
                          )}
                          <span className="block font-mono text-[11px] text-muted-foreground">
                            {movement.product?.sku ?? "—"}
                          </span>
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
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {formatNumber(movement.quantity_after)}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {formatDateTime(movement.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
