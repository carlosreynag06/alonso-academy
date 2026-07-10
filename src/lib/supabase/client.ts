"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { requireSupabasePublicConfig } from "./config";

export function createClient() {
  const { url, publishableKey } = requireSupabasePublicConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
