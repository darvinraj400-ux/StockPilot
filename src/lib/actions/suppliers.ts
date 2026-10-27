"use server";

import { revalidatePath } from "next/cache";

import { fieldErrorsFromZod, type ActionState, type ActionResult } from "@/lib/action-state";
import { getActionSession } from "@/lib/auth";
import { getFormString } from "@/lib/form-data";
import { isUuid } from "@/lib/search";
import {
  supplierFormSchema,
  supplierFormToInput,
} from "@/lib/validations/supplier";

function revalidateSuppliers() {
  revalidatePath("/suppliers");
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

function parseSupplierFormData(formData: FormData) {
  return supplierFormSchema.safeParse({
    name: getFormString(formData, "name"),
    contactName: getFormString(formData, "contactName"),
    email: getFormString(formData, "email"),
    phone: getFormString(formData, "phone"),
    address: getFormString(formData, "address"),
    notes: getFormString(formData, "notes"),
  });
}

export async function createSupplier(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseSupplierFormData(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the supplier details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getActionSession();
  const { error } = await supabase
    .from("suppliers")
    .insert({ user_id: user.id, ...supplierFormToInput(parsed.data) });

  if (error) {
    return {
      status: "error",
      message: "The supplier could not be saved. Please try again.",
    };
  }

  revalidateSuppliers();
  return { status: "success", message: "Supplier created." };
}

export async function updateSupplier(
  id: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isUuid(id)) {
    return { status: "error", message: "That supplier could not be found." };
  }

  const parsed = parseSupplierFormData(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the supplier details and try again.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("suppliers")
    .update(supplierFormToInput(parsed.data))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      message: "The supplier could not be updated. Please try again.",
    };
  }
  if (!data) {
    return { status: "error", message: "That supplier could not be found." };
  }

  revalidateSuppliers();
  return { status: "success", message: "Supplier updated." };
}

export async function setSupplierActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  if (!isUuid(id)) {
    return { ok: false, message: "That supplier could not be found." };
  }

  const { supabase, user } = await getActionSession();
  const { data, error } = await supabase
    .from("suppliers")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "The supplier could not be updated." };
  }
  if (!data) {
    return { ok: false, message: "That supplier could not be found." };
  }

  revalidateSuppliers();
  return { ok: true };
}
