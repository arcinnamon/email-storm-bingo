// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizePhrases, PhraseValidationError, validatePhrases } from "@/lib/validation";

const phrases = (count: number) => Array.from({ length: count }, (_, i) => `Phrase ${i + 1}`);

describe("phrase normalization", () => {
  it("trims text lines and ignores blanks while preserving display case and internal spaces", () => {
    expect(normalizePhrases("  Reply  All \r\n\t\r\n Follow up \n")).toEqual([
      "Reply  All", "Follow up",
    ]);
  });

  it("normalizes a list without modifying it", () => {
    const input = Object.freeze(["  Reply all ", "", " \t", "Follow up"]);
    expect(normalizePhrases(input)).toEqual(["Reply all", "Follow up"]);
    expect(input).toEqual(["  Reply all ", "", " \t", "Follow up"]);
  });

  it.each([null, undefined, 24, {}, [...phrases(24), 1], [null]].map((input) => ({ input })))("rejects malformed input: $input", ({ input }) => {
    expect(() => validatePhrases(input)).toThrow(PhraseValidationError);
  });
});

describe("phrase validation", () => {
  it.each([24, 30, 200])("accepts %i unique phrases", (count) => {
    expect(validatePhrases(phrases(count))).toEqual(phrases(count));
  });

  it("accepts editor text and returns trimmed phrases without blank lines", () => {
    const input = phrases(24).map((phrase) => `  ${phrase}  `).join("\r\n\r\n");
    expect(validatePhrases(input)).toEqual(phrases(24));
  });

  it.each([0, 23, 201])("rejects %i phrases with an actionable count error", (count) => {
    expect(() => validatePhrases(phrases(count))).toThrow(/24.*200/);
  });

  it("counts phrases after blank lines are removed", () => {
    expect(() => validatePhrases([...phrases(23), "", "  "])).toThrow(/24.*200/);
  });

  it.each(["A", "a".repeat(100), "😀".repeat(100)])("accepts a phrase at the character limits", (phrase) => {
    expect(validatePhrases([...phrases(23), ` ${phrase} `])).toContain(phrase);
  });

  it.each(["a".repeat(101), "😀".repeat(101)])("rejects a phrase longer than 100 characters", (phrase) => {
    expect(() => validatePhrases([...phrases(23), phrase])).toThrow(/100 characters/);
  });

  it.each(["Phrase 1", "  Phrase 1  ", "pHrAsE 1"])("rejects normalized duplicate %j", (phrase) => {
    expect(() => validatePhrases([...phrases(24), phrase])).toThrow(/duplicate/i);
  });

  it.each(["FREE SPACE", "  free space  ", "Free Space"])("rejects reserved phrase %j", (phrase) => {
    expect(() => validatePhrases([...phrases(23), phrase])).toThrow(/reserved.*FREE SPACE/i);
  });
});
