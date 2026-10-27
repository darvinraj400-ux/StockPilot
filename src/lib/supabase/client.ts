"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { requireSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const { url, key } = requireSupabaseConfig();
    browserClient = createBrowserClient<Database>(url, key);
  }
  return browserClient;
}
