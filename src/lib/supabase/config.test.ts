import { describe, expect, it } from "vitest";

import { normalizeSupabaseUrl } from "./config";

describe("normalizeSupabaseUrl", () => {
  it("strips the /rest/v1/ suffix copied from the Data API settings", () => {
    expect(
      normalizeSupabaseUrl("https://example-ref.supabase.co/rest/v1/"),
    ).toBe("https://example-ref.supabase.co");
  });

  it("strips /rest/v1 without a trailing slash", () => {
    expect(
      normalizeSupabaseUrl("https://example-ref.supabase.co/rest/v1"),
    ).toBe("https://example-ref.supabase.co");
  });

  it("strips auth and trailing slashes", () => {
    expect(
      normalizeSupabaseUrl("https://example-ref.supabase.co/auth/v1/"),
    ).toBe("https://example-ref.supabase.co");
  });

  it("keeps a plain project URL unchanged", () => {
    expect(normalizeSupabaseUrl("https://example-ref.supabase.co")).toBe(
      "https://example-ref.supabase.co",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSupabaseUrl("  https://example-ref.supabase.co/  ")).toBe(
      "https://example-ref.supabase.co",
    );
  });

  it("returns undefined for empty values", () => {
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined();
    expect(normalizeSupabaseUrl("   ")).toBeUndefined();
  });

  it("builds the signup endpoint on the project base path", () => {
    const base = normalizeSupabaseUrl(
      "https://example-ref.supabase.co/rest/v1/",
    );
    expect(`${base}/auth/v1/signup`).toBe(
      "https://example-ref.supabase.co/auth/v1/signup",
    );
  });
});
