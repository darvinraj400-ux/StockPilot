const redirectPrefixes = [
  "/dashboard",
  "/products",
  "/categories",
  "/suppliers",
  "/stock-movements",
  "/reports",
  "/settings",
];

export function sanitizeRedirectPath(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  // Browsers treat a backslash as a path separator, so "/\evil.com" would
  // resolve to another origin. Reject it and its encoded form.
  if (candidate.includes("\\") || /%5c/i.test(candidate)) {
    return fallback;
  }

  if (/[\u0000-\u001f\u007f]/.test(candidate)) {
    return fallback;
  }

  let resolved: URL;
  try {
    resolved = new URL(candidate, "https://stockpilot.invalid");
  } catch {
    return fallback;
  }

  if (resolved.origin !== "https://stockpilot.invalid") {
    return fallback;
  }

  const pathname = resolved.pathname;
  const allowed = redirectPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!allowed) return fallback;

  return `${pathname}${resolved.search}`;
}
