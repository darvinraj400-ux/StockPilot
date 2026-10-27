import { describe, expect, it } from "vitest";

import type { Category, Product, Supplier } from "@/types/database";
import {
  buildInventoryReportRows,
  getLowStockRows,
  getOutOfStockRows,
  groupInventoryByCategory,
  summarizeInventory,
} from "@/lib/reports";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    user_id: "user-1",
    category_id: null,
    supplier_id: null,
    sku: "SKU-1",
    name: "Product",
    description: null,
    unit: "unit",
    cost_price: 10,
    selling_price: 15,
    quantity_on_hand: 10,
    reorder_level: 5,
    is_active: true,
    needs_reorder: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-1",
    user_id: "user-1",
    name: "Hardware",
    description: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: "supplier-1",
    user_id: "user-1",
    name: "Acme Supply",
    contact_name: null,
    email: null,
    phone: null,
    address: null,
    notes: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const products: Product[] = [
  makeProduct({
    id: "product-zinc",
    name: "Zinc brackets",
    sku: "ZBR-1",
    category_id: "category-1",
    supplier_id: "supplier-1",
    quantity_on_hand: 2,
    reorder_level: 5,
    cost_price: 2.5,
    selling_price: 4,
  }),
  makeProduct({
    id: "product-alpha",
    name: "Alpha tape",
    sku: "ATA-1",
    quantity_on_hand: 0,
    reorder_level: 1,
    cost_price: 10,
    selling_price: 12,
  }),
  makeProduct({
    id: "product-archived",
    name: "Archived item",
    sku: "OLD-1",
    quantity_on_hand: 100,
    is_active: false,
  }),
];

describe("inventory report rows", () => {
  const rows = buildInventoryReportRows(
    products,
    [makeCategory()],
    [makeSupplier()],
  );

  it("excludes archived products and sorts by name", () => {
    expect(rows.map((row) => row.product.name)).toEqual([
      "Alpha tape",
      "Zinc brackets",
    ]);
  });

  it("resolves category and supplier names with sensible fallbacks", () => {
    const alpha = rows[0];
    const zinc = rows[1];

    expect(alpha.categoryName).toBe("Uncategorized");
    expect(alpha.supplierName).toBe("No supplier");
    expect(zinc.categoryName).toBe("Hardware");
    expect(zinc.supplierName).toBe("Acme Supply");
  });

  it("computes stock status and both valuations", () => {
    expect(rows[0].status).toBe("out_of_stock");
    expect(rows[0].costValue).toBe(0);
    expect(rows[0].retailValue).toBe(0);

    expect(rows[1].status).toBe("low_stock");
    expect(rows[1].costValue).toBe(5);
    expect(rows[1].retailValue).toBe(8);
  });
});

describe("inventory summaries", () => {
  const rows = buildInventoryReportRows(products, [makeCategory()], [makeSupplier()]);

  it("summarizes active products, units, value, and exceptions", () => {
    expect(summarizeInventory(rows)).toEqual({
      activeProductCount: 2,
      totalUnits: 2,
      costValue: 5,
      retailValue: 8,
      lowStockCount: 2,
      outOfStockCount: 1,
    });
  });

  it("groups value by category, highest cost value first", () => {
    expect(groupInventoryByCategory(rows)).toEqual([
      {
        categoryName: "Hardware",
        productCount: 1,
        units: 2,
        costValue: 5,
        retailValue: 8,
      },
      {
        categoryName: "Uncategorized",
        productCount: 1,
        units: 0,
        costValue: 0,
        retailValue: 0,
      },
    ]);
  });

  it("orders low-stock rows by quantity on hand", () => {
    expect(getLowStockRows(rows).map((row) => row.product.sku)).toEqual([
      "ATA-1",
      "ZBR-1",
    ]);
  });

  it("returns only zero-quantity rows for the out-of-stock report", () => {
    expect(getOutOfStockRows(rows).map((row) => row.product.sku)).toEqual([
      "ATA-1",
    ]);
  });

  it("produces an all-zero summary when there are no rows", () => {
    expect(summarizeInventory([])).toEqual({
      activeProductCount: 0,
      totalUnits: 0,
      costValue: 0,
      retailValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    });
  });
});
