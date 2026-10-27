export type FieldErrors = Record<string, string[]>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
};

export const initialActionState: ActionState = { status: "idle" };

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export function actionError(
  message: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

export function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return errors;
}
