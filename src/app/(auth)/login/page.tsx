import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";
import { sanitizeRedirectPath } from "@/lib/redirects";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your StockPilot inventory workspace.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  if (!isSupabaseConfigured()) return null;

  const { user } = await getSession();
  const params = await searchParams;
  const redirectPath = sanitizeRedirectPath(
    Array.isArray(params.redirect) ? params.redirect[0] : params.redirect,
  );
  const errorParam = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const initialError =
    typeof errorParam === "string" ? errorParam.trim().slice(0, 300) : "";

  if (user) {
    redirect(redirectPath);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to review stock levels, record movements, and run reports.
        </p>
      </div>
      <LoginForm redirectPath={redirectPath} initialError={initialError} />
    </div>
  );
}
