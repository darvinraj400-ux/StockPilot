import { describe, expect, it } from "vitest";

import { sanitizeRedirectPath } from "@/lib/redirects";

describe("sanitizeRedirectPath", () => {
  it("allows known internal destinations", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/products")).toBe("/products");
    expect(sanitizeRedirectPath("/products/abc?tab=history")).toBe(
      "/products/abc?tab=history",
    );
    expect(sanitizeRedirectPath("/stock-movements/123")).toBe(
      "/stock-movements/123",
    );
    expect(sanitizeRedirectPath("/reports?view=low-stock")).toBe(
      "/reports?view=low-stock",
    );
  });

  it("falls back for external, scheme-relative, and backslash URLs", () => {
    const fallback = "/dashboard";
    expect(sanitizeRedirectPath("https://evil.example")).toBe(fallback);
    expect(sanitizeRedirectPath("//evil.example")).toBe(fallback);
    expect(sanitizeRedirectPath("/\\evil.example")).toBe(fallback);
    expect(sanitizeRedirectPath("/%5Cevil.example")).toBe(fallback);
    expect(sanitizeRedirectPath("\\\\evil.example")).toBe(fallback);
  });

  it("falls back for auth routes and unknown paths", () => {
    expect(sanitizeRedirectPath("/login")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/signup?next=/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/unknown")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/dashboard-evil")).toBe("/dashboard");
  });

  it("rejects control characters and non-string values", () => {
    expect(sanitizeRedirectPath("/dashboard\nSet-Cookie: x=y")).toBe(
      "/dashboard",
    );
    expect(sanitizeRedirectPath("/dashboard\u0000")).toBe("/dashboard");
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
    expect(sanitizeRedirectPath(undefined, "/products")).toBe("/products");
  });

  it("normalizes surrounding whitespace", () => {
    expect(sanitizeRedirectPath("  /settings  ")).toBe("/settings");
  });
});
