import { z } from "zod";

const moneyStringSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount.")
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Enter a valid amount with up to 2 decimal places.",
  )
  .refine(
    (value) => Number(value) <= 9_999_999_999.99,
    "Amount is larger than the database supports.",
  );

const reorderStringSchema = z
  .string()
  .trim()
  .min(1, "Enter a reorder level.")
  .regex(/^\d+$/, "Enter a whole number.")
  .refine(
    (value) => Number(value) <= 2_147_483_647,
    "Reorder level is too large.",
  );

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) =>
      !value || value === "none" || z.uuid().safeParse(value).success,
    "Select a valid option.",
  );

export const productFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required.")
    .max(64, "SKU must be 64 characters or fewer.")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "SKU can use letters, numbers, dots, dashes, and underscores.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(160, "Product name must be 160 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .optional()
    .default(""),
  categoryId: optionalUuid,
  supplierId: optionalUuid,
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required.")
    .max(32, "Unit must be 32 characters or fewer."),
  costPrice: moneyStringSchema,
  sellingPrice: moneyStringSchema,
  reorderLevel: reorderStringSchema,
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;

export type ProductInput = {
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  supplier_id: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
};

function normalizeRelation(value: string | undefined) {
  if (!value || value === "none") return null;
  return value;
}

export function productFormToInput(values: ProductFormValues): ProductInput {
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    description: values.description.trim() || null,
    category_id: normalizeRelation(values.categoryId),
    supplier_id: normalizeRelation(values.supplierId),
    unit: values.unit.trim(),
    cost_price: Number(values.costPrice),
    selling_price: Number(values.sellingPrice),
    reorder_level: Number(values.reorderLevel),
  };
}
