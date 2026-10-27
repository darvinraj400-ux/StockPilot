import type { NextRequest } from "next/server";

import { getRouteViewer } from "@/lib/auth";
import { getInventoryReport, getAllMovementsForExport } from "@/lib/data/reports";
import { parseMovementListFilters } from "@/lib/data/movements";
import { csvFilename, toCsv, type CsvValue } from "@/lib/csv";
import { STOCK_STATUS_LABELS } from "@/lib/inventory";

const REPORT_KINDS = ["inventory", "low-stock", "out-of-stock", "movements"];

function attachmentHeaders(filename: string) {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: NextRequest) {
  const viewer = await getRouteViewer();
  if (!viewer) {
    return new Response("You must be signed in to export reports.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const report = searchParams.get("report") ?? "inventory";
  const allowed = REPORT_KINDS;

  if (!allowed.includes(report)) {
    return new Response("Unknown report.", { status: 400 });
  }

  let csv = "";
  let filename = "";

  if (report === "movements") {
    const filters = parseMovementListFilters(
      Object.fromEntries(searchParams.entries()),
    );
    const movements = await getAllMovementsForExport(filters);

    const headers = [
      "Recorded (UTC)",
      "Product",
      "SKU",
      "Movement type",
      "Quantity change",
      "Quantity before",
      "Quantity after",
      "Note",
      "Movement ID",
    ];

    const rows: CsvValue[][] = movements.map((movement) => [
      movement.created_at,
      movement.product?.name ?? "Product removed",
      movement.product?.sku ?? "",
      movement.movement_type,
      movement.quantity_delta,
      movement.quantity_before,
      movement.quantity_after,
      movement.note ?? "",
      movement.id,
    ]);

    csv = toCsv(headers, rows);
    filename = csvFilename("stockpilot-stock-movements");
  } else {
    const inventory = await getInventoryReport();
    const { rows } = inventory;

    if (report === "inventory") {
      const headers = [
        "SKU",
        "Product",
        "Category",
        "Supplier",
        "Unit",
        "Quantity on hand",
        "Reorder level",
        "Stock status",
        "Cost price",
        "Selling price",
        "Inventory value (cost)",
        "Inventory value (retail)",
      ];
      const data: CsvValue[][] = rows.map((row) => [
        row.product.sku,
        row.product.name,
        row.categoryName,
        row.supplierName,
        row.product.unit,
        row.product.quantity_on_hand,
        row.product.reorder_level,
        STOCK_STATUS_LABELS[row.status],
        Number(row.product.cost_price),
        Number(row.product.selling_price),
        row.costValue,
        row.retailValue,
      ]);
      csv = toCsv(headers, data);
      filename = csvFilename("stockpilot-inventory");
    } else if (report === "low-stock") {
      const headers = [
        "SKU",
        "Product",
        "Category",
        "Supplier",
        "Unit",
        "Quantity on hand",
        "Reorder level",
        "Shortfall",
        "Stock status",
        "Inventory value (cost)",
      ];
      const data: CsvValue[][] = inventory.lowStockRows.map((row) => [
        row.product.sku,
        row.product.name,
        row.categoryName,
        row.supplierName,
        row.product.unit,
        row.product.quantity_on_hand,
        row.product.reorder_level,
        Math.max(row.product.reorder_level - row.product.quantity_on_hand, 0),
        STOCK_STATUS_LABELS[row.status],
        row.costValue,
      ]);
      csv = toCsv(headers, data);
      filename = csvFilename("stockpilot-low-stock");
    } else {
      const headers = [
        "SKU",
        "Product",
        "Category",
        "Supplier",
        "Unit",
        "Reorder level",
        "Cost price",
        "Inventory value (cost)",
      ];
      const data: CsvValue[][] = inventory.outOfStockRows.map((row) => [
        row.product.sku,
        row.product.name,
        row.categoryName,
        row.supplierName,
        row.product.unit,
        row.product.reorder_level,
        Number(row.product.cost_price),
        row.costValue,
      ]);
      csv = toCsv(headers, data);
      filename = csvFilename("stockpilot-out-of-stock");
    }
  }

  return new Response(`\uFEFF${csv}`, {
    headers: attachmentHeaders(filename),
  });
}
