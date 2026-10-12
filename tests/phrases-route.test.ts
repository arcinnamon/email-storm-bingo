// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { get, getPhraseRepository } = vi.hoisted(() => {
  const get = vi.fn();
  return { get, getPhraseRepository: vi.fn(() => ({ get })) };
});
vi.mock("@/lib/phrases", () => ({ getPhraseRepository }));
import { GET } from "@/app/api/phrases/route";

beforeEach(() => { get.mockReset(); getPhraseRepository.mockImplementation(() => ({ get })); });
describe("GET /api/phrases", () => {
  it("returns only validated phrases and the current version with no-store", async () => {
    const phrases = Array.from({ length: 30 }, (_, i) => `Phrase ${i}`);
    get.mockResolvedValue({ version: 3, phrases, id: 1, updated_at: "private metadata" });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ version: 3, phrases });
  });

  it.each(["database", "configuration", "invalid output"])("returns a retryable, uncached error for %s failures", async (failure) => {
    if (failure === "database") get.mockRejectedValue(new Error("private database details"));
    if (failure === "configuration") getPhraseRepository.mockImplementation(() => { throw new Error("secret configuration"); });
    if (failure === "invalid output") get.mockResolvedValue({ version: -1, phrases: [] });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Phrases are unavailable. Please try again." });
  });
});
