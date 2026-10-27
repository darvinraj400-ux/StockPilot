import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MovementTypeBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MovementWithProduct } from "@/lib/data/movements";
import {
  formatDateTime,
  formatNumber,
  formatSignedNumber,
} from "@/lib/format";

export function MovementTable({
  movements,
  showNote = true,
}: {
  movements: MovementWithProduct[];
  showNote?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Recorded</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead className="text-right">Before</TableHead>
          <TableHead className="text-right">After</TableHead>
          {showNote ? (
            <TableHead className="hidden max-w-[220px] lg:table-cell">
              Note
            </TableHead>
          ) : null}
          <TableHead className="w-10">
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDateTime(movement.created_at)}
            </TableCell>
            <TableCell className="max-w-[220px]">
              {movement.product ? (
                <Link
                  href={`/products/${movement.product.id}`}
                  className="block truncate font-medium text-slate-900 hover:text-emerald-700"
                >
                  {movement.product.name}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
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
                movement.quantity_delta > 0 ? "text-emerald-700" : "text-red-600"
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
            {showNote ? (
              <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:table-cell">
                {movement.note || "—"}
              </TableCell>
            ) : null}
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
  );
}
