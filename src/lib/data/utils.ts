import type { PostgrestError } from "@supabase/supabase-js";

export function handleQueryError(error: PostgrestError | null, area: string) {
  if (!error) return;
  console.error(`[stockpilot] Failed to load ${area}`, {
    code: error.code,
    message: error.message,
  });
  throw new Error(`We could not load ${area}. Please try again.`);
}
