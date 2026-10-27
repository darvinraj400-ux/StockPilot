"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { FormAlert, FieldError } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { signIn } from "@/lib/actions/auth";

export function LoginForm({
  redirectPath,
  initialError,
}: {
  redirectPath: string;
  initialError?: string;
}) {
  const [state, formAction] = useActionState(signIn, initialActionState);
  const [email, setEmail] = useState("");
  const formError =
    state.status === "error" && state.message ? state.message : initialError;

  return (
    <form action={formAction} className="space-y-5">
      {redirectPath !== "/dashboard" ? (
        <input type="hidden" name="redirect" value={redirectPath} />
      ) : null}

      {formError ? (
        <FormAlert>{formError}</FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="login-email">Work email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "login-email-error" : undefined}
        />
        <FieldError id="login-email-error" messages={state.fieldErrors?.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "login-password-error" : undefined
          }
        />
        <FieldError
          id="login-password-error"
          messages={state.fieldErrors?.password}
        />
      </div>

      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        New to StockPilot?{" "}
        <Link
          href="/signup"
          className="font-medium text-emerald-700 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
