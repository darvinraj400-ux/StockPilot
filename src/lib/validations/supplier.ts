import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .max(254, "Email must be 254 characters or fewer.")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Enter a valid email address.",
  );

export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Supplier name is required.")
    .max(120, "Supplier name must be 120 characters or fewer."),
  contactName: z
    .string()
    .trim()
    .max(120, "Contact name must be 120 characters or fewer.")
    .optional()
    .default(""),
  email: optionalEmail.optional().default(""),
  phone: z
    .string()
    .trim()
    .max(40, "Phone must be 40 characters or fewer.")
    .optional()
    .default(""),
  address: z
    .string()
    .trim()
    .max(500, "Address must be 500 characters or fewer.")
    .optional()
    .default(""),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer.")
    .optional()
    .default(""),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function supplierFormToInput(values: SupplierFormValues) {
  return {
    name: values.name.trim(),
    contact_name: values.contactName.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    address: values.address.trim() || null,
    notes: values.notes.trim() || null,
  };
}
