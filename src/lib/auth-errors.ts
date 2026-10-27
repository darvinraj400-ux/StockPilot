export type AuthErrorDetails = {
  message?: string;
  code?: string;
  status?: number;
};

export const AUTH_GENERIC_ERROR =
  "We couldn't complete that request. Please try again.";

export const AUTH_CONFIGURATION_ERROR =
  "Authentication is temporarily unavailable due to a configuration problem. Please contact your administrator.";

export function friendlyAuthError(error: AuthErrorDetails): string {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "invalid_api_key" ||
    code === "no_api_key" ||
    error.status === 401 ||
    error.status === 404 ||
    message.includes("invalid path")
  ) {
    return AUTH_CONFIGURATION_ERROR;
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirm your email address before signing in. Check your inbox for the confirmation link.";
  }
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("user already registered")
  ) {
    return "An account already exists with this email. Try signing in instead.";
  }
  if (code === "weak_password" || message.includes("password")) {
    return "That password does not meet the requirements.";
  }
  if (code === "signup_disabled") {
    return "New account creation is currently disabled. Please contact your administrator.";
  }
  if (
    code.startsWith("over_") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (
    code === "email_address_invalid" ||
    code === "email_address_not_authorized"
  ) {
    return "That email address can't be used to create an account.";
  }
  if (error.status && error.status >= 500) {
    return "The authentication service is temporarily unavailable. Please try again.";
  }
  return AUTH_GENERIC_ERROR;
}

export function redactAuthDetail(value: string | undefined): string | undefined {
  if (!value) return value;
  return value
    .replace(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
      "[redacted-email]",
    )
    .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, "[redacted-key]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-token]")
    .slice(0, 200);
}

export function logAuthError(operation: string, error: AuthErrorDetails) {
  if (process.env.NODE_ENV === "production") return;

  console.error(`[auth] ${operation} failed`, {
    status: error.status,
    code: error.code,
    message: redactAuthDetail(error.message),
  });
}
