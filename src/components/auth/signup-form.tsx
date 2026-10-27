"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { FieldError, FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { signUp } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialActionState);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  if (state.status === "success") {
    return (
      <div className="rounded-xl border bg-card p-6 text-center shadow-xs sm:p-7">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Confirm your email
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {state.message}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message ? (
        <FormAlert>{state.message}</FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Alex Morgan"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.fullName)}
          aria-describedby={
            state.fieldErrors?.fullName ? "signup-name-error" : undefined
          }
        />
        <FieldError id="signup-name-error" messages={state.fieldErrors?.fullName} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Work email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "signup-email-error" : undefined}
        />
        <FieldError id="signup-email-error" messages={state.fieldErrors?.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password
              ? "signup-password-error signup-password-hint"
              : "signup-password-hint"
          }
        />
        <p id="signup-password-hint" className="text-xs text-muted-foreground">
          Use at least 8 characters, including a letter and a number.
        </p>
        <FieldError
          id="signup-password-error"
          messages={state.fieldErrors?.password}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <PasswordInput
          id="signup-confirm"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          aria-describedby={
            state.fieldErrors?.confirmPassword ? "signup-confirm-error" : undefined
          }
        />
        <FieldError
          id="signup-confirm-error"
          messages={state.fieldErrors?.confirmPassword}
        />
      </div>

      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-700 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
