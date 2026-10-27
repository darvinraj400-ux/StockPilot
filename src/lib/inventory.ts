export const MOVEMENT_TYPES = ["stock_in", "stock_out", "adjustment"] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  stock_in: "Stock in",
  stock_out: "Stock out",
  adjustment: "Adjustment",
};

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

/**
 * Low stock is defined consistently as on-hand quantity at or below the
 * reorder level. Zero stock is also low stock, but is surfaced separately as
 * out of stock in status badges and the out-of-stock report.
 */
export function isLowStock(quantityOnHand: number, reorderLevel: number) {
  return quantityOnHand <= reorderLevel;
}

export function getStockStatus(
  quantityOnHand: number,
  reorderLevel: number,
): StockStatus {
  if (quantityOnHand <= 0) return "out_of_stock";
  if (isLowStock(quantityOnHand, reorderLevel)) return "low_stock";
  return "in_stock";
}

export function inventoryValue(quantityOnHand: number, costPrice: number) {
  return Math.round(quantityOnHand * costPrice * 100) / 100;
}

export function getSignedDelta(
  movementType: MovementType,
  quantity: number,
): number {
  if (movementType === "stock_out") return -Math.abs(quantity);
  return quantity;
}

export function validateMovementQuantity(
  movementType: MovementType,
  quantity: number,
): string | null {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
    return "Quantity must be a whole number.";
  }
  if (movementType === "adjustment") {
    if (quantity === 0) {
      return "Adjustment quantity cannot be zero.";
    }
    return null;
  }
  if (quantity <= 0) {
    return movementType === "stock_in"
      ? "Stock-in quantity must be greater than zero."
      : "Stock-out quantity must be greater than zero.";
  }
  return null;
}

export function validateResultingQuantity(
  quantityBefore: number,
  quantityDelta: number,
): string | null {
  if (quantityBefore + quantityDelta < 0) {
    return `Cannot remove more than the ${quantityBefore} currently on hand.`;
  }
  return null;
}
