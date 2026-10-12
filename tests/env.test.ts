// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

// Next.js enforces this import boundary at build time. Unit tests run outside it.
vi.mock("server-only", () => ({}));

import { getServerEnv } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("server environment", () => {
  it("reports missing configuration without including secret values", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "private-test-key");
    vi.stubEnv("ADMIN_PASSWORD_HASH", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", "private-test-secret");

    expect(() => getServerEnv()).toThrow("Missing server environment variable: ADMIN_PASSWORD_HASH");
  });

  it("reads configured values when a server feature requests them", () => {
    const values = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      ADMIN_PASSWORD_HASH: "test-password-hash",
      ADMIN_SESSION_SECRET: "test-session-secret",
    };
    for (const [name, value] of Object.entries(values)) vi.stubEnv(name, value);

    expect(getServerEnv()).toEqual(values);
  });
});
