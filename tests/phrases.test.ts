// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { createPhraseRepository, PhraseConflictError, PhraseStorageError } from "@/lib/phrases";
import { getSupabaseClient } from "@/lib/supabase";
import initialPhrases from "../data/initial-phrases.json";

const phrases = Array.from({ length: 30 }, (_, index) => `Phrase ${index + 1}`);
const row = { id: 1, version: 1, phrases, updated_at: "2026-10-12T12:00:00Z" };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function setup(body: unknown, status = 200) {
  vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "private-test-key");
  vi.stubEnv("ADMIN_PASSWORD_HASH", "");
  vi.stubEnv("ADMIN_SESSION_SECRET", "");
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetch);
  return { repository: createPhraseRepository(getSupabaseClient()), fetch };
}

describe("phrase repository", () => {
  it("reads validated public configuration without requiring admin secrets or caching database reads", async () => {
    const { repository, fetch } = setup(row);
    expect(await repository.get()).toEqual({ version: 1, phrases });
    expect(fetch.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("distinguishes missing configuration from failed storage", async () => {
    const { repository } = setup(null);
    await expect(repository.get()).rejects.toMatchObject({ code: "not_initialized" });
  });

  it.each([
    { ...row, version: 0 }, { ...row, version: 1.5 }, { ...row, phrases: ["Too short"] },
    { ...row, phrases: phrases.join("\n") }, { ...row, phrases: [...phrases, phrases[0]] },
  ])("rejects corrupt stored configuration: %j", async (invalid) => {
    await expect(setup(invalid).repository.get()).rejects.toMatchObject({ code: "invalid_data" });
  });

  it("normalizes a valid write and returns the database version", async () => {
    const { repository, fetch } = setup([{ ...row, version: 2 }]);
    expect(await repository.update(phrases.map((phrase) => ` ${phrase} `), 1)).toEqual({ version: 2, phrases });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ expected_version: 1, new_phrases: phrases });
    expect(String(fetch.mock.calls[0][0])).toContain("/rpc/update_bingo_config");
  });

  it("reports stale writes as conflicts without attempting another write", async () => {
    const { repository, fetch } = setup([]);
    await expect(repository.update(phrases, 1)).rejects.toBeInstanceOf(PhraseConflictError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid input before sending any database request", async () => {
    const { repository, fetch } = setup(row);
    for (const version of [0, -1, 1.5, "1", null, Number.MAX_SAFE_INTEGER]) {
      await expect(repository.update(phrases, version)).rejects.toThrow("version");
    }
    await expect(repository.update(["Too short"], 1)).rejects.toThrow("24");
    await expect(repository.seed(["Too short"])).rejects.toThrow("24");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([true, false])("reports whether seeding initialized the empty database: %s", async (seeded) => {
    const { repository, fetch } = setup(seeded);
    expect(await repository.seed(initialPhrases)).toBe(seeded);
    expect(String(fetch.mock.calls[0][0])).toContain("/rpc/seed_bingo_config");
    expect(initialPhrases).toHaveLength(30);
  });

  it("sanitizes database errors for reads, writes, and seeding", async () => {
    const { repository } = setup({ message: "private-test-key internal database details", code: "XX000" }, 500);
    for (const operation of [() => repository.get(), () => repository.update(phrases, 1), () => repository.seed(phrases)]) {
      await expect(operation()).rejects.toBeInstanceOf(PhraseStorageError);
      await expect(operation()).rejects.not.toThrow("private-test-key");
    }
  });

  it("handles failed network requests without automatic replay", async () => {
    const { repository, fetch } = setup(row);
    fetch.mockRejectedValue(new Error("network unavailable"));
    await expect(repository.get()).rejects.toMatchObject({ code: "unavailable" });
    await expect(repository.update(phrases, 1)).rejects.toMatchObject({ code: "unavailable" });
    await expect(repository.seed(phrases)).rejects.toMatchObject({ code: "unavailable" });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it.each([null, {}, [row, row], [{ ...row, version: 4 }]])("rejects an invalid update response: %j", async (body) => {
    await expect(setup(body).repository.update(phrases, 1)).rejects.toMatchObject({ code: "invalid_data" });
  });

  it("does not report a successful seed for an invalid database response", async () => {
    await expect(setup(null).repository.seed(phrases)).rejects.toMatchObject({ code: "invalid_data" });
  });
});
