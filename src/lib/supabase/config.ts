const API_PATH_SUFFIX = /\/(?:rest|auth|storage|functions|realtime|graphql)\/v1$/i;

export function normalizeSupabaseUrl(
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  let url = trimmed.replace(/\/+$/, "");
  while (API_PATH_SUFFIX.test(url)) {
    url = url.replace(API_PATH_SUFFIX, "").replace(/\/+$/, "");
  }

  return url || undefined;
}

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

let warnedAboutUrlNormalization = false;

function warnIfNormalized() {
  if (process.env.NODE_ENV === "production" || warnedAboutUrlNormalization) {
    return;
  }
  const trimmed = rawSupabaseUrl?.trim().replace(/\/+$/, "");
  if (trimmed && supabaseUrl && trimmed !== supabaseUrl) {
    warnedAboutUrlNormalization = true;
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL included an API path. Using the project base URL instead; set it to the base URL only (no /rest/v1/ or /auth/v1/).",
    );
  }
}

export type SupabaseConfig = {
  url: string;
  key: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  if (!supabaseUrl || !supabaseKey) return null;
  warnIfNormalized();
  return { url: supabaseUrl, key: supabaseKey };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }
  return config;
}
