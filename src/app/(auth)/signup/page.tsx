import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your StockPilot inventory workspace.",
};

export default async function SignupPage() {
  if (!isSupabaseConfigured()) return null;

  const { user } = await getSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Create your workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Start with a clean inventory ledger. Add products, suppliers, and
          stock as you go.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
