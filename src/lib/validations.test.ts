import { describe, expect, it } from "vitest";

import {
  endOfDayExclusiveIso,
  parseDateInput,
  startOfDayIso,
} from "@/lib/dates";
import { getPagination, parsePage } from "@/lib/pagination";
import {
  categoryFormSchema,
  categoryFormToInput,
} from "@/lib/validations/category";
import {
  productFormSchema,
  productFormToInput,
} from "@/lib/validations/product";
import {
  stockMovementSchema,
  stockMovementToRpcInput,
} from "@/lib/validations/stock";
import {
  supplierFormSchema,
  supplierFormToInput,
} from "@/lib/validations/supplier";

const PRODUCT_ID = "f1b8a2a4-3c1d-4e5f-9a6b-7c8d9e0f1a2b";

const validProduct = {
  sku: "SKU-100",
  name: "Widget",
  description: "",
  categoryId: "none",
  supplierId: "none",
  unit: "case",
  costPrice: "12.50",
  sellingPrice: "19.99",
  reorderLevel: "5",
};

describe("date input parsing", () => {
  it("accepts valid ISO dates", () => {
    expect(parseDateInput("2026-02-28")).toBe("2026-02-28");
    expect(parseDateInput(["2024-02-29"])).toBe("2024-02-29");
  });

  it("rejects impossible or malformed dates", () => {
    expect(parseDateInput("2026-02-30")).toBeNull();
    expect(parseDateInput("2025-02-29")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
    expect(parseDateInput("26-01-01")).toBeNull();
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput(undefined)).toBeNull();
  });

  it("builds inclusive-day boundaries in UTC", () => {
    expect(startOfDayIso("2026-01-15")).toBe("2026-01-15T00:00:00.000Z");
    expect(endOfDayExclusiveIso("2026-01-15")).toBe(
      "2026-01-16T00:00:00.000Z",
    );
    expect(endOfDayExclusiveIso("2026-12-31")).toBe(
      "2027-01-01T00:00:00.000Z",
    );
  });
});

describe("pagination", () => {
  it("parses positive pages and clamps invalid input", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });

  it("clamps the current page to available pages", () => {
    expect(getPagination(0, 1, 15)).toMatchObject({
      page: 1,
      totalPages: 1,
      from: 0,
      to: 14,
      hasPrevious: false,
      hasNext: false,
    });

    expect(getPagination(46, 4, 15)).toMatchObject({
      page: 4,
      totalPages: 4,
      from: 45,
      to: 59,
      hasPrevious: true,
      hasNext: false,
    });

    expect(getPagination(46, 99, 15).page).toBe(4);
  });
});

describe("product form validation", () => {
  it("accepts a complete product and normalizes relations", () => {
    const result = productFormSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(productFormToInput(result.data)).toEqual({
      sku: "SKU-100",
      name: "Widget",
      description: null,
      category_id: null,
      supplier_id: null,
      unit: "case",
      cost_price: 12.5,
      selling_price: 19.99,
      reorder_level: 5,
    });
  });

  it("trims text fields", () => {
    const result = productFormSchema.safeParse({
      ...validProduct,
      name: "  Widget  ",
      sku: "  SKU-100  ",
      description: "  A widget  ",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name).toBe("Widget");
    expect(result.data.sku).toBe("SKU-100");
    expect(result.data.description).toBe("A widget");
  });

  it("rejects missing names, invalid SKUs, and malformed prices", () => {
    expect(productFormSchema.safeParse({ ...validProduct, name: " " }).success).toBe(
      false,
    );
    expect(
      productFormSchema.safeParse({ ...validProduct, sku: "-BAD" }).success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ ...validProduct, costPrice: "12.345" }).success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ ...validProduct, costPrice: "-1" }).success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ ...validProduct, sellingPrice: "free" })
        .success,
    ).toBe(false);
  });

  it("rejects fractional or negative reorder levels", () => {
    expect(
      productFormSchema.safeParse({ ...validProduct, reorderLevel: "2.5" }).success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ ...validProduct, reorderLevel: "-1" }).success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ ...validProduct, reorderLevel: "0" }).success,
    ).toBe(true);
  });

  it("rejects invalid category identifiers but accepts none", () => {
    expect(
      productFormSchema.safeParse({ ...validProduct, categoryId: "hardware" })
        .success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({ ...validProduct, categoryId: PRODUCT_ID })
        .success,
    ).toBe(true);
  });
});

describe("stock movement form validation", () => {
  const base = {
    productId: PRODUCT_ID,
    movementType: "stock_in" as const,
    quantity: 5,
    note: "",
  };

  it("accepts a positive stock-in quantity", () => {
    expect(stockMovementSchema.safeParse(base).success).toBe(true);
  });

  it("rejects zero and negative receipt or issue quantities", () => {
    expect(stockMovementSchema.safeParse({ ...base, quantity: 0 }).success).toBe(
      false,
    );
    expect(stockMovementSchema.safeParse({ ...base, quantity: -5 }).success).toBe(
      false,
    );
    expect(
      stockMovementSchema.safeParse({
        ...base,
        movementType: "stock_out",
        quantity: -2,
      }).success,
    ).toBe(false);
  });

  it("requires a documented reason for adjustments", () => {
    const missingNote = stockMovementSchema.safeParse({
      productId: PRODUCT_ID,
      movementType: "adjustment",
      quantity: -2,
      note: "",
    });
    expect(missingNote.success).toBe(false);

    const withNote = stockMovementSchema.safeParse({
      productId: PRODUCT_ID,
      movementType: "adjustment",
      quantity: -2,
      note: "Cycle count correction",
    });
    expect(withNote.success).toBe(true);
  });

  it("rejects a zero adjustment and an invalid product id", () => {
    expect(
      stockMovementSchema.safeParse({
        ...base,
        movementType: "adjustment",
        quantity: 0,
        note: "Count correction",
      }).success,
    ).toBe(false);

    expect(
      stockMovementSchema.safeParse({ ...base, productId: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("limits notes to 500 characters", () => {
    expect(
      stockMovementSchema.safeParse({ ...base, note: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it("converts form values to signed RPC arguments", () => {
    expect(
      stockMovementToRpcInput({
        productId: PRODUCT_ID,
        movementType: "stock_out",
        quantity: 3,
        note: "  Sold to customer  ",
      }),
    ).toEqual({
      p_product_id: PRODUCT_ID,
      p_movement_type: "stock_out",
      p_quantity_delta: -3,
      p_note: "Sold to customer",
    });

    expect(
      stockMovementToRpcInput({
        productId: PRODUCT_ID,
        movementType: "adjustment",
        quantity: -2,
        note: "Cycle count correction",
      }).p_quantity_delta,
    ).toBe(-2);
  });
});

describe("category and supplier validation", () => {
  it("trims category values and rejects empty names", () => {
    const result = categoryFormSchema.safeParse({
      name: "  Adhesives ",
      description: "  Tapes and glues ",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(categoryFormToInput(result.data)).toEqual({
      name: "Adhesives",
      description: "Tapes and glues",
    });

    expect(categoryFormSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("normalizes optional supplier fields", () => {
    const result = supplierFormSchema.safeParse({
      name: "Acme Supply",
      contactName: " ",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(supplierFormToInput(result.data)).toEqual({
      name: "Acme Supply",
      contact_name: null,
      email: null,
      phone: null,
      address: null,
      notes: null,
    });
  });

  it("rejects invalid supplier emails and overlong names", () => {
    expect(
      supplierFormSchema.safeParse({ name: "Acme", email: "not-an-email" }).success,
    ).toBe(false);
    expect(
      supplierFormSchema.safeParse({ name: "x".repeat(121) }).success,
    ).toBe(false);
  });
});
