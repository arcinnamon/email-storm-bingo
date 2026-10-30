import { describe, expect, it } from "vitest";
import { PHRASES } from "@/lib/phrases";

describe("PHRASES", () => {
  it("has at least 24 phrases", () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(24);
  });
  it("has no duplicates", () => {
    expect(new Set(PHRASES).size).toBe(PHRASES.length);
  });
  it("has no blank entries", () => {
    expect(PHRASES.every((p) => p.trim().length > 0)).toBe(true);
  });
});
