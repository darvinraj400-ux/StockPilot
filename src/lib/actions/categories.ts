"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";

import { fieldErrorsFromZod, type ActionState, type ActionResult } from "@/lib/action-state";
import { getActionSession } from "@/lib/auth";
import { getFormString } from "@/lib/form-data";
import { isUuid } from "@/lib/search";
import {
  categoryFormSchema,
  categoryFormToInput,
} from "@/lib/validations/category";

function uniqueNameError(error: PostgrestError) {
  if (error.code === "23505") {
    return {
      status: "error" as const,
      message: "A category with that name already exists.",
      fieldErrors: { name: ["A category with that name already exists."] },
    };
  }
  return {
    status: "error" as const,
    message: "The category could not be saved. Please try again.",
  };
}

function revalidateCategories() {
  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function createCategory(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categoryFormSchema.safeParse({
    name: getFormString(formData, "name"),
    description: getFormString(formData, "description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the category details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getActionSession();
  const { error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, ...categoryFormToInput(parsed.data) });

  if (error) return uniqueNameError(error);

  revalidateCategories();
  return { status: "success", message: "Category created." };
}

export async function updateCategory(
  id: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isUuid(id)) {
    return { status: "error", message: "That category could not be found." };
  }

  const parsed = categoryFormSchema.safeParse({
    name: getFormString(formData, "name"),
    description: getFormString(formData, "description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the category details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("categories")
    .update(categoryFormToInput(parsed.data))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return uniqueNameError(error);
  if (!data) {
    return { status: "error", message: "That category could not be found." };
  }

  revalidateCategories();
  return { status: "success", message: "Category updated." };
}

export async function setCategoryActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  if (!isUuid(id)) {
    return { ok: false, message: "That category could not be found." };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "The category could not be updated." };
  }
  if (!data) {
    return { ok: false, message: "That category could not be found." };
  }

  revalidateCategories();
  return { ok: true };
}
