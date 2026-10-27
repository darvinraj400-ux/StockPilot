import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import {
  MovementTypeBadge,
} from "@/components/shared/status-badges";
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getMovementDetail } from "@/lib/data/movements";
import { formatDateTime, formatNumber, formatSignedNumber } from "@/lib/format";
import { MOVEMENT_TYPE_LABELS } from "@/lib/inventory";
import { isUuid } from "@/lib/search";

export async function generateMetadata({
  params,
}: PageProps<"/stock-movements/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Movement not found" };

  const detail = await getMovementDetail(id);
  if (!detail) return { title: "Movement not found" };

  return {
    title: `${MOVEMENT_TYPE_LABELS[detail.movement.movement_type]} movement`,
    description: `Ledger entry for ${detail.product?.name ?? "a product"}.`,
  };
}

export default async function MovementDetailPage({
  params,
}: PageProps<"/stock-movements/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const detail = await getMovementDetail(id);
  if (!detail) notFound();

  const { movement, product } = detail;
  const positive = movement.quantity_delta > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        className="no-print"
        title="Movement detail"
        description="A permanent entry from your stock ledger."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock movements", href: "/stock-movements" },
          { label: "Movement detail" },
        ]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/stock-movements">
                <ArrowLeft />
                Back to ledger
              </Link>
            </Button>
            <PrintButton />
          </>
        }
      />

      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader className="border-b pb-5">
            <div className="flex items-center gap-3">
              <LogoMark className="size-9" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  StockPilot ledger
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Stock movement record
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <MovementTypeBadge type={movement.movement_type} />
              <span className="font-mono text-[10px] text-muted-foreground">
                #{movement.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-7 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Product
                </p>
                {product ? (
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-1 block text-lg font-semibold text-slate-900 hover:text-emerald-700"
                  >
                    {product.name}
                  </Link>
                ) : (
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    Product removed
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {product?.sku ?? "—"}
                  {product ? ` · ${product.unit}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Recorded
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(movement.created_at)}
                </p>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
              <div className="bg-card p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Before
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
                  {formatNumber(movement.quantity_before)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  on hand before
                </p>
              </div>
              <div className="bg-card p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Change
                </p>
                <p
                  className={`mt-2 text-3xl font-semibold tabular-nums ${
                    positive ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {formatSignedNumber(movement.quantity_delta)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {MOVEMENT_TYPE_LABELS[movement.movement_type].toLowerCase()}
                </p>
              </div>
              <div className="bg-card p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  After
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
                  {formatNumber(movement.quantity_after)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  on hand after
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Note
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {movement.note || "No note recorded for this movement."}
              </p>
            </div>

            <dl className="grid gap-4 border-t pt-5 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-muted-foreground">Movement ID</dt>
                <dd className="mt-1 break-all font-mono text-slate-700">
                  {movement.id}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground">Product ID</dt>
                <dd className="mt-1 break-all font-mono text-slate-700">
                  {movement.product_id}
                </dd>
              </div>
            </dl>
          </CardContent>

          <CardFooter className="no-print flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <p className="text-[11px] leading-5 text-muted-foreground">
              Ledger entries are append-only and cannot be edited or deleted.
            </p>
            {product ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/products/${product.id}`}>
                  Open product
                  <ArrowRight />
                </Link>
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        {product?.is_active ? (
          <div className="no-print mt-4 flex justify-center">
            <StockMovementDialog
              products={[product]}
              defaultProductId={product.id}
              triggerLabel="Record another movement"
              triggerVariant="outline"
              triggerSize="sm"
            />
          </div>
        ) : (
          <p className="no-print mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ClipboardList className="size-3.5" aria-hidden="true" />
            This product is archived; no further movements can be recorded.
          </p>
        )}
      </div>
    </div>
  );
}
