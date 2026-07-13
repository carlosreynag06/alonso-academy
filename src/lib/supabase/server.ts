import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { requireSupabasePublicConfig } from "./config";
import { isDevelopmentFixtureRequest } from "@/lib/development-fixtures/source";

export async function createClient() {
  if (await isDevelopmentFixtureRequest()) {
    throw new Error("Supabase access is forbidden while a development fixture session is active.");
  }
  const cookieStore = await cookies();
  const { url, publishableKey } = requireSupabasePublicConfig();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes sessions.
        }
      },
    },
  });
}
