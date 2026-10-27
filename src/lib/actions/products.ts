"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";

import {
  fieldErrorsFromZod,
  type ActionResult,
  type FieldErrors,
} from "@/lib/action-state";
import { getActionSession } from "@/lib/auth";
import { isUuid } from "@/lib/search";
import {
  productFormSchema,
  productFormToInput,
  type ProductFormValues,
} from "@/lib/validations/product";

function productDbError(error: PostgrestError): {
  message: string;
  fieldErrors?: FieldErrors;
} {
  if (error.code === "23505") {
    return {
      message: "That SKU is already used by another product.",
      fieldErrors: { sku: ["That SKU is already used by another product."] },
    };
  }
  if (error.code === "23503") {
    return {
      message: "Select a category and supplier from your workspace.",
      fieldErrors: {
        categoryId: ["Select a category from your workspace."],
        supplierId: ["Select a supplier from your workspace."],
      },
    };
  }
  if (error.code === "23514") {
    return { message: "One of the product values is outside the allowed range." };
  }
  return { message: "The product could not be saved. Please try again." };
}

function revalidateProducts(id?: string) {
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  if (id) revalidatePath(`/products/${id}`);
}

export async function createProduct(
  values: ProductFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = productFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the product details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("products")
    .insert({ user_id: user.id, ...productFormToInput(parsed.data) })
    .select("id")
    .single();

  if (error) {
    return { ok: false, ...productDbError(error) };
  }

  revalidateProducts(data.id);
  return { ok: true, data: { id: data.id } };
}

export async function updateProduct(
  id: string,
  values: ProductFormValues,
): Promise<ActionResult<{ id: string }>> {
  if (!isUuid(id)) {
    return { ok: false, message: "That product could not be found." };
  }

  const parsed = productFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the product details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("products")
    .update(productFormToInput(parsed.data))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, ...productDbError(error) };
  }
  if (!data) {
    return { ok: false, message: "That product could not be found." };
  }

  revalidateProducts(id);
  return { ok: true, data: { id } };
}

export async function setProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  if (!isUuid(id)) {
    return { ok: false, message: "That product could not be found." };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "The product could not be updated." };
  }
  if (!data) {
    return { ok: false, message: "That product could not be found." };
  }

  revalidateProducts(id);
  return { ok: true };
}
