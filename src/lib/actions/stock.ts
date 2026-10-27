"use server";

import { revalidatePath } from "next/cache";

import {
  fieldErrorsFromZod,
  type ActionResult,
} from "@/lib/action-state";
import { getActionSession } from "@/lib/auth";
import {
  stockMovementSchema,
  stockMovementToRpcInput,
  type StockMovementFormValues,
} from "@/lib/validations/stock";
import type { StockMovement } from "@/types/database";

const knownErrorFragments = [
  "Archived products",
  "Insufficient stock",
  "Product not found",
  "Stock-in quantity",
  "Stock-out quantity",
  "Quantity change",
  "Note must be",
  "signed in",
];

function stockErrorMessage(message: string) {
  if (knownErrorFragments.some((fragment) => message.includes(fragment))) {
    return message;
  }
  if (message.toLowerCase().includes("permission")) {
    return "You do not have permission to change stock for this product.";
  }
  return "The stock movement could not be recorded. Please try again.";
}

export async function recordStockMovement(
  values: StockMovementFormValues,
): Promise<ActionResult<{ movement: StockMovement }>> {
  const parsed = stockMovementSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the stock movement details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase } = await getActionSession();
  const { data, error } = await supabase.rpc(
    "record_stock_movement",
    stockMovementToRpcInput(parsed.data),
  );

  if (error) {
    return { ok: false, message: stockErrorMessage(error.message) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath(`/products/${parsed.data.productId}`);
  revalidatePath("/stock-movements");
  revalidatePath("/reports");

  return { ok: true, data: { movement: data as StockMovement } };
}
