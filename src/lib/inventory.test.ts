import { describe, expect, it } from "vitest";

import {
  getSignedDelta,
  getStockStatus,
  inventoryValue,
  isLowStock,
  validateMovementQuantity,
  validateResultingQuantity,
} from "@/lib/inventory";

describe("low-stock detection", () => {
  it("treats stock at the reorder level as low", () => {
    expect(isLowStock(5, 5)).toBe(true);
  });

  it("treats stock below the reorder level as low", () => {
    expect(isLowStock(2, 5)).toBe(true);
  });

  it("does not flag stock above the reorder level", () => {
    expect(isLowStock(6, 5)).toBe(false);
  });

  it("treats zero stock as low and out of stock", () => {
    expect(isLowStock(0, 5)).toBe(true);
    expect(getStockStatus(0, 5)).toBe("out_of_stock");
  });

  it("distinguishes low stock from in-stock and out-of-stock", () => {
    expect(getStockStatus(3, 5)).toBe("low_stock");
    expect(getStockStatus(12, 5)).toBe("in_stock");
  });
});

describe("inventory valuation", () => {
  it("multiplies quantity by cost and rounds to cents", () => {
    expect(inventoryValue(3, 4.99)).toBe(14.97);
    expect(inventoryValue(7, 0.1)).toBe(0.7);
  });

  it("values empty stock at zero", () => {
    expect(inventoryValue(0, 25)).toBe(0);
  });
});

describe("movement quantity validation", () => {
  it("accepts positive stock-in quantities", () => {
    expect(validateMovementQuantity("stock_in", 5)).toBeNull();
  });

  it("rejects zero stock-in and stock-out quantities", () => {
    expect(validateMovementQuantity("stock_in", 0)).toMatch(/greater than zero/);
    expect(validateMovementQuantity("stock_out", 0)).toMatch(/greater than zero/);
  });

  it("rejects negative stock-in and stock-out quantities", () => {
    expect(validateMovementQuantity("stock_in", -3)).toMatch(/greater than zero/);
    expect(validateMovementQuantity("stock_out", -3)).toMatch(/greater than zero/);
  });

  it("rejects fractional quantities", () => {
    expect(validateMovementQuantity("stock_in", 1.5)).toMatch(/whole number/);
  });

  it("allows signed non-zero adjustments", () => {
    expect(validateMovementQuantity("adjustment", -4)).toBeNull();
    expect(validateMovementQuantity("adjustment", 6)).toBeNull();
    expect(validateMovementQuantity("adjustment", 0)).toMatch(/cannot be zero/);
  });
});

describe("signed deltas", () => {
  it("converts a stock-out quantity to a negative delta", () => {
    expect(getSignedDelta("stock_out", 4)).toBe(-4);
  });

  it("keeps stock-in and adjustment values signed as entered", () => {
    expect(getSignedDelta("stock_in", 4)).toBe(4);
    expect(getSignedDelta("adjustment", -4)).toBe(-4);
  });
});

describe("resulting quantity validation", () => {
  it("rejects removing more than the quantity on hand", () => {
    expect(validateResultingQuantity(3, -4)).toMatch(/Cannot remove more than/);
  });

  it("allows exactly draining stock to zero", () => {
    expect(validateResultingQuantity(3, -3)).toBeNull();
  });

  it("allows stock-in and positive adjustments", () => {
    expect(validateResultingQuantity(0, 10)).toBeNull();
    expect(validateResultingQuantity(10, 2)).toBeNull();
  });
});
