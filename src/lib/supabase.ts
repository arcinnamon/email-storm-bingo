import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getDatabaseEnv } from "./env";
import type { Database } from "@/types/database";

/** Lazy construction lets the application build before services are provisioned. */
export function getSupabaseClient() {
  const env = getDatabaseEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    db: { retry: false },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        cache: "no-store",
        signal: init?.signal ?? AbortSignal.timeout(10_000),
      }),
    },
  });
}
