import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhraseConfig } from "@/types/bingo";
import type { Database } from "@/types/database";
import { getSupabaseClient } from "./supabase";
import { validatePhraseConfig, validatePhrases, validateVersion } from "./validation";

export class PhraseStorageError extends Error {
  constructor(readonly code: "unavailable" | "not_initialized" | "invalid_data") {
    const messages = {
      unavailable: "Phrase storage is unavailable. Please try again.",
      not_initialized: "Phrase storage has not been initialized. Run the seed command.",
      invalid_data: "Phrase storage returned invalid configuration.",
    };
    super(messages[code]);
    this.name = "PhraseStorageError";
  }
}

export class PhraseConflictError extends Error {
  constructor() {
    super("The phrase configuration changed. Reload the latest version before saving.");
    this.name = "PhraseConflictError";
  }
}

function parseStoredConfig(data: unknown): PhraseConfig {
  try { return validatePhraseConfig(data); }
  catch { throw new PhraseStorageError("invalid_data"); }
}

// Do not propagate SDK/network errors: their details can include credentials or SQL.
async function query<T>(operation: () => PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  try {
    const { data, error } = await operation();
    if (error) throw new PhraseStorageError("unavailable");
    return data;
  } catch { throw new PhraseStorageError("unavailable"); }
}

export function createPhraseRepository(client: SupabaseClient<Database>) {
  return {
    async get(): Promise<PhraseConfig> {
      const data = await query(() => client.from("bingo_config")
        .select("version, phrases").eq("id", 1).maybeSingle());
      if (data === null) throw new PhraseStorageError("not_initialized");
      return parseStoredConfig(data);
    },

    async update(input: unknown, expectedVersion: unknown): Promise<PhraseConfig> {
      const phrases = validatePhrases(input);
      const version = validateVersion(expectedVersion);
      const data = await query(() => client.rpc("update_bingo_config", {
        expected_version: version, new_phrases: phrases,
      }));
      if (!Array.isArray(data)) throw new PhraseStorageError("invalid_data");
      if (data.length === 0) throw new PhraseConflictError();
      if (data.length !== 1) throw new PhraseStorageError("invalid_data");
      const config = parseStoredConfig(data[0]);
      if (config.version !== version + 1) throw new PhraseStorageError("invalid_data");
      return config;
    },

    async seed(input: unknown): Promise<boolean> {
      const phrases = validatePhrases(input);
      const data = await query(() => client.rpc("seed_bingo_config", { initial_phrases: phrases }));
      if (typeof data !== "boolean") throw new PhraseStorageError("invalid_data");
      return data;
    },
  };
}

export function getPhraseRepository() {
  try { return createPhraseRepository(getSupabaseClient()); }
  catch { throw new PhraseStorageError("unavailable"); }
}
