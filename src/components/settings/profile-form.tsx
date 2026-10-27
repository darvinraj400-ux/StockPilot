"use client";

import { useActionState } from "react";

import { FieldError, FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/action-state";

export function ProfileForm({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [state, formAction] = useActionState(updateProfile, initialActionState);
  const nameErrors = state.fieldErrors?.fullName;

  return (
    <form action={formAction} className="space-y-5">
      {state.status !== "idle" && state.message ? (
        <FormAlert tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={nameErrors?.length ? true : undefined}
          aria-describedby={nameErrors?.length ? "fullName-error" : undefined}
        />
        <FieldError id="fullName-error" messages={nameErrors} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" value={email} readOnly disabled />
        <p className="text-xs text-muted-foreground">
          Email addresses cannot be changed from this screen.
        </p>
      </div>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
