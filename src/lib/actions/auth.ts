"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  fieldErrorsFromZod,
  type ActionState,
  type FieldErrors,
} from "@/lib/action-state";
import {
  getActionSession,
  getSiteOrigin,
} from "@/lib/auth";
import { friendlyAuthError, logAuthError } from "@/lib/auth-errors";
import { sanitizeRedirectPath } from "@/lib/redirects";
import { getFormString } from "@/lib/form-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  profileSchema,
  signupSchema,
} from "@/lib/validations/auth";

function validationError(fieldErrors: FieldErrors): ActionState {
  return {
    status: "error",
    message: "Please fix the highlighted fields and try again.",
    fieldErrors,
  };
}

export async function signIn(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
  });

  if (!parsed.success) {
    return validationError(fieldErrorsFromZod(parsed.error.issues));
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      logAuthError("signIn", error);
      return { status: "error", message: friendlyAuthError(error) };
    }
  } catch (error) {
    logAuthError("signIn", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      status: "error",
      message: "Could not reach the authentication service. Check your connection and try again.",
    };
  }

  redirect(
    sanitizeRedirectPath(formData.get("redirect"), "/dashboard"),
  );
}

export async function signUp(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    fullName: getFormString(formData, "fullName"),
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    confirmPassword: getFormString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return validationError(fieldErrorsFromZod(parsed.error.issues));
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = getSiteOrigin(requestHeaders.get("origin"));
  let hasSession = false;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      logAuthError("signUp", error);
      return { status: "error", message: friendlyAuthError(error) };
    }

    hasSession = Boolean(data.session);
  } catch (error) {
    logAuthError("signUp", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      status: "error",
      message: "Could not create your account right now. Please try again.",
    };
  }

  if (hasSession) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: `We sent a confirmation link to ${parsed.data.email}. Open it to finish setting up your workspace. If you already have an account, sign in instead.`,
  };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateProfile(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    fullName: getFormString(formData, "fullName"),
  });

  if (!parsed.success) {
    return validationError(fieldErrorsFromZod(parsed.error.issues));
  }

  const { supabase, user } = await getActionSession();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  if (error) {
    return {
      status: "error",
      message: "Your profile could not be updated. Please try again.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: `Profile updated for ${user.email ?? "your account"}.`,
  };
}
