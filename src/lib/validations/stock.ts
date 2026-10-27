import { z } from "zod";

import {
  MOVEMENT_TYPES,
  getSignedDelta,
  validateMovementQuantity,
} from "@/lib/inventory";

export const stockMovementSchema = z
  .object({
    productId: z.uuid("Select a product."),
    movementType: z.enum(MOVEMENT_TYPES, {
      message: "Select a movement type.",
    }),
    quantity: z
      .number({ message: "Enter a quantity." })
      .int("Quantity must be a whole number.")
      .finite("Enter a valid quantity."),
    note: z
      .string()
      .trim()
      .max(500, "Note must be 500 characters or fewer.")
      .optional()
      .default(""),
  })
  .superRefine((values, ctx) => {
    const quantityError = validateMovementQuantity(
      values.movementType,
      values.quantity,
    );
    if (quantityError) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: quantityError,
      });
    }

    if (values.movementType === "adjustment" && values.note.trim().length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Document the reason for an adjustment (at least 3 characters).",
      });
    }
  });

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;
export type StockMovementFormInput = z.input<typeof stockMovementSchema>;

export function stockMovementToRpcInput(values: StockMovementFormValues) {
  return {
    p_product_id: values.productId,
    p_movement_type: values.movementType,
    p_quantity_delta: getSignedDelta(values.movementType, values.quantity),
    p_note: values.note.trim() || null,
  };
}
