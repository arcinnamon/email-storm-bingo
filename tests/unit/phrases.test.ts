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
      "Reply from VP or above",
      "Comic Sans signature block",
      "“Have a fantastic weekend!”",
      "Real answer gets buried",
      "Reaches the right person",
      "Original question answered",
      "A very long-winded “why me”",
      "ALL CAPS",
      "ALL CAPS BIG FONT",
      "Topical joke",
      "Follow-up topical joke",
      "Topical meme",
      "Non-topical meme",
      "Someone you know replies all",
      "“You mean another Jennifer”",
      "“This isn’t my team”",
      "“Why am I on this list”",
      "“Ditto”",
      "“Unsubscribe”",
      "Technical “well actually”",
      "Obviously AI-written reply",
      "“Sent out in error”",
      "High priority flag used",
      "Sarcasm",
      "OP apology",
      "Near-famous name",
      "Silly name (Chris Test)",
      "“Me too”",
      "“Me three”",
    ]);
  });
  it("excludes the free label", () => {
    expect(PHRASES).not.toContain(FREE_LABEL);
  });
});
