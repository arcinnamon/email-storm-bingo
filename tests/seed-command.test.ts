// @vitest-environment node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const run = promisify(execFile);
const env = {
  ...process.env,
  SUPABASE_URL: "https://seed-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "private-seed-test-key",
};

describe("seed command", () => {
  it.each([
    [true, "Initialized bingo configuration at version 1."],
    [false, "Configuration already exists; no changes made."],
  ])("reports the initialization result: %s", async (seeded, message) => {
    // Run the real CLI/loader/server-only boundary; only the HTTP transport is faked.
    const { stdout, stderr } = await run(process.execPath, [
      "--conditions=react-server", "--import", "tsx", "--input-type=module", "--eval",
      `globalThis.fetch = async () => new Response('${seeded}', { headers: { 'Content-Type': 'application/json' } }); await import('./scripts/seed.ts');`,
    ], { env });
    expect(stdout.trim()).toBe(message);
    expect(stderr).toBe("");
  }, 15_000);

  it("exits nonzero with a safe error when credentials are missing", async () => {
    await expect(run(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/seed.ts"], {
      env: { ...env, SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" },
    })).rejects.toMatchObject({ code: 1, stdout: "", stderr: expect.stringContaining("Seeding failed. Check server database configuration") });
  }, 15_000);
});
