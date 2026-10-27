import {
  getStockStatus,
  inventoryValue,
  isLowStock,
  type StockStatus,
} from "@/lib/inventory";
import type { Category, Product, Supplier } from "@/types/database";

export type InventoryReportRow = {
  product: Product;
  categoryName: string;
  supplierName: string;
  status: StockStatus;
  costValue: number;
  retailValue: number;
};

export type InventorySummary = {
  activeProductCount: number;
  totalUnits: number;
  costValue: number;
  retailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type CategoryInventorySummary = {
  categoryName: string;
  productCount: number;
  units: number;
  costValue: number;
  retailValue: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildInventoryReportRows(
  products: Product[],
  categories: Category[],
  suppliers: Supplier[],
): InventoryReportRow[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));

  return products
    .filter((product) => product.is_active)
    .map((product) => ({
      product,
      categoryName: product.category_id
        ? (categoryMap.get(product.category_id) ?? "Unknown category")
        : "Uncategorized",
      supplierName: product.supplier_id
        ? (supplierMap.get(product.supplier_id) ?? "Unknown supplier")
        : "No supplier",
      status: getStockStatus(product.quantity_on_hand, product.reorder_level),
      costValue: inventoryValue(product.quantity_on_hand, product.cost_price),
      retailValue: inventoryValue(product.quantity_on_hand, product.selling_price),
    }))
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
}

export function summarizeInventory(rows: InventoryReportRow[]): InventorySummary {
  return rows.reduce<InventorySummary>(
    (summary, row) => ({
      activeProductCount: summary.activeProductCount + 1,
      totalUnits: summary.totalUnits + row.product.quantity_on_hand,
      costValue: roundMoney(summary.costValue + row.costValue),
      retailValue: roundMoney(summary.retailValue + row.retailValue),
      lowStockCount:
        summary.lowStockCount +
        (isLowStock(row.product.quantity_on_hand, row.product.reorder_level) ? 1 : 0),
      outOfStockCount:
        summary.outOfStockCount + (row.product.quantity_on_hand === 0 ? 1 : 0),
    }),
    {
      activeProductCount: 0,
      totalUnits: 0,
      costValue: 0,
      retailValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    },
  );
}

export function groupInventoryByCategory(
  rows: InventoryReportRow[],
): CategoryInventorySummary[] {
  const groups = new Map<string, CategoryInventorySummary>();

  for (const row of rows) {
    const existing = groups.get(row.categoryName) ?? {
      categoryName: row.categoryName,
      productCount: 0,
      units: 0,
      costValue: 0,
      retailValue: 0,
    };

    groups.set(row.categoryName, {
      categoryName: row.categoryName,
      productCount: existing.productCount + 1,
      units: existing.units + row.product.quantity_on_hand,
      costValue: roundMoney(existing.costValue + row.costValue),
      retailValue: roundMoney(existing.retailValue + row.retailValue),
    });
  }

  return [...groups.values()].sort((a, b) => b.costValue - a.costValue);
}

export function getLowStockRows(rows: InventoryReportRow[]) {
  return rows
    .filter((row) =>
      isLowStock(row.product.quantity_on_hand, row.product.reorder_level),
    )
    .sort((a, b) => a.product.quantity_on_hand - b.product.quantity_on_hand);
}

export function getOutOfStockRows(rows: InventoryReportRow[]) {
  return rows
    .filter((row) => row.product.quantity_on_hand === 0)
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
}
