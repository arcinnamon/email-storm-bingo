import "server-only";

import { createRequire } from "node:module";
import { WebSocket as NodeWebSocket } from "ws";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDatabaseEnv } from "./env";
import type { Database } from "@/types/database";

const require = createRequire(import.meta.url);
let supabaseModule: typeof import("@supabase/supabase-js") | undefined;

if (typeof globalThis.WebSocket === "undefined") {
  Object.defineProperty(globalThis, "WebSocket", {
    value: NodeWebSocket,
    configurable: true,
    writable: true,
  });
}

function loadSupabaseModule(): typeof import("@supabase/supabase-js") {
  if (!supabaseModule) {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const loaded = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
      supabaseModule = loaded;
    } finally {
      console.warn = warn;
    }
  }
  return supabaseModule!;
}

/** Lazy construction lets the application build before services are provisioned. */
export function getSupabaseClient(): SupabaseClient<Database> {
  const env = getDatabaseEnv();
  const { createClient } = loadSupabaseModule();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    db: { retry: false },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => fetch(input, {
        ...init,
        cache: "no-store",
        signal: init?.signal ?? AbortSignal.timeout(10_000),
      }),
    },
  });
}
