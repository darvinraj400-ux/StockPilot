import { describe, expect, it } from "vitest";

import {
  AUTH_CONFIGURATION_ERROR,
  AUTH_GENERIC_ERROR,
  friendlyAuthError,
  redactAuthDetail,
} from "./auth-errors";

describe("friendlyAuthError", () => {
  it("surfaces a configuration message for the Auth 404 caused by a malformed base URL", () => {
    expect(
      friendlyAuthError({
        status: 404,
        message: "Invalid path specified in request URL",
      }),
    ).toBe(AUTH_CONFIGURATION_ERROR);
  });

  it("maps invalid API keys to the same configuration message", () => {
    expect(
      friendlyAuthError({ status: 401, code: "invalid_api_key", message: "Invalid API key" }),
    ).toBe(AUTH_CONFIGURATION_ERROR);
  });

  it("maps invalid credentials", () => {
    expect(
      friendlyAuthError({
        status: 400,
        code: "invalid_credentials",
        message: "Invalid login credentials",
      }),
    ).toBe("Email or password is incorrect.");
  });

  it("maps unconfirmed email addresses", () => {
    expect(
      friendlyAuthError({
        status: 400,
        code: "email_not_confirmed",
        message: "Email not confirmed",
      }),
    ).toBe(
      "Confirm your email address before signing in. Check your inbox for the confirmation link.",
    );
  });

  it("maps an existing account by code and by legacy message", () => {
    expect(
      friendlyAuthError({
        status: 422,
        code: "user_already_exists",
        message: "User already registered",
      }),
    ).toBe("An account already exists with this email. Try signing in instead.");
    expect(
      friendlyAuthError({
        status: 400,
        message: "User already registered",
      }),
    ).toBe("An account already exists with this email. Try signing in instead.");
  });

  it("maps weak passwords", () => {
    expect(
      friendlyAuthError({
        status: 422,
        code: "weak_password",
        message: "Password should be at least 6 characters",
      }),
    ).toBe("That password does not meet the requirements.");
  });

  it("maps disabled signups", () => {
    expect(
      friendlyAuthError({
        status: 403,
        code: "signup_disabled",
        message: "Signups not allowed for this instance",
      }),
    ).toBe(
      "New account creation is currently disabled. Please contact your administrator.",
    );
  });

  it("maps rate limits", () => {
    expect(
      friendlyAuthError({
        status: 429,
        code: "over_email_send_rate_limit",
        message: "Email rate limit exceeded",
      }),
    ).toBe("Too many attempts. Wait a moment and try again.");
  });

  it("maps invalid email addresses", () => {
    expect(
      friendlyAuthError({
        status: 422,
        code: "email_address_invalid",
        message: "Email address is invalid",
      }),
    ).toBe("That email address can't be used to create an account.");
  });

  it("maps server failures to a temporary outage", () => {
    expect(
      friendlyAuthError({ status: 503, message: "Service unavailable" }),
    ).toBe("The authentication service is temporarily unavailable. Please try again.");
  });

  it("falls back to a generic message for unexpected errors", () => {
    expect(
      friendlyAuthError({ status: 400, message: "Something unexpected" }),
    ).toBe(AUTH_GENERIC_ERROR);
  });
});

describe("redactAuthDetail", () => {
  it("removes emails, API keys, and JWTs from diagnostic messages", () => {
    const redacted = redactAuthDetail(
      "User alex@example.com key sb_publishable_abc123 token eyJhbGciOi.eyJzdWIi.c2lnbmF0dXJl",
    );

    expect(redacted).not.toContain("alex@example.com");
    expect(redacted).not.toContain("sb_publishable_abc123");
    expect(redacted).not.toContain("eyJhbGciOi");
    expect(redacted).toContain("[redacted-email]");
    expect(redacted).toContain("[redacted-key]");
    expect(redacted).toContain("[redacted-token]");
  });

  it("keeps ordinary error messages intact", () => {
    expect(redactAuthDetail("Invalid path specified in request URL")).toBe(
      "Invalid path specified in request URL",
    );
  });

  it("handles missing messages", () => {
    expect(redactAuthDetail(undefined)).toBeUndefined();
  });
});
