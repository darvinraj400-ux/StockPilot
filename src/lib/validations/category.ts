import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(80, "Category name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .default(""),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function categoryFormToInput(values: CategoryFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
  };
}
