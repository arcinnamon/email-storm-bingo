import { describe, expect, it } from "vitest";
import { FREE_LABEL } from "@/lib/bingo";
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
  it("is exactly the 29 email-storm phrases, in order", () => {
    expect(PHRASES).toEqual([
      "Any response from VP or above",
      "Comic Sans signature block",
      "Happy greeting “have a fantastic weekend!”",
      "An actual answer that gets buried",
      "Actually reaches the intended recipient",
      "Actually resolved the intent of the original email",
      "A very long-winded “why me”",
      "ALL CAPS",
      "ALL CAPS BIG FONT",
      "Topical joke",
      "Follow-up topical joke",
      "Topical meme",
      "Non-topical meme",
      "You know someone who replied all",
      "“I think you mean another Jennifer”",
      "“This isn’t my team”",
      "“Why am I on this list”",
      "“Ditto”",
      "“Unsubscribe”",
      "A highly technical “well actually”",
      "A clearly AI-generated response",
      "“It looks to have been sent out in error”",
      "Someone uses the high priority flag",
      "Sarcasm",
      "OP apology",
      "Near-famous names (Aaron Rogers)",
      "Unbelievable names (Christopher Test)",
      "“Me too”",
      "“Me three”",
    ]);
  });
  it("excludes the free label", () => {
    expect(PHRASES).not.toContain(FREE_LABEL);
  });
});
