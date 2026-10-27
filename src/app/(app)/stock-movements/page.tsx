import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { MovementTable } from "@/components/stock/movement-table";
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog";
import { MovementFilters } from "@/components/stock/movement-filters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdjustableProducts } from "@/lib/data/products";
import {
  getMovementsList,
  parseMovementListFilters,
} from "@/lib/data/movements";

export const metadata: Metadata = {
  title: "Stock movements",
};

export default async function StockMovementsPage({
  searchParams,
}: PageProps<"/stock-movements">) {
  const rawSearchParams = await searchParams;
  const filters = parseMovementListFilters(rawSearchParams);
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
        title="Stock movements"
        description="An append-only record of every quantity change. Each entry stores the quantity before and after the movement."
        actions={
          <StockMovementDialog
            products={adjustableProducts}
            triggerLabel="Record movement"
          />
        }
      />

      <Card className="overflow-hidden">
        <MovementFilters filters={filters} searchParams={rawSearchParams} />

        {movements.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={ClipboardList}
              title="No movements match"
              description="Try a different product, movement type, or date range."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/stock-movements">Clear filters</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No stock movements yet"
              description="Receipts, issues, and adjustments will appear here. Record your first movement to open the ledger."
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
              {total} {total === 1 ? "movement" : "movements"}
              {filters.from || filters.to ? " in the selected date range" : ""}
            </div>
            <PaginationNav
              page={pagination.page}
              totalPages={pagination.totalPages}
              basePath="/stock-movements"
              searchParams={rawSearchParams}
            />
          </>
        )}
      </Card>
    </div>
  );
}
