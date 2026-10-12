import type { PhraseConfig } from "@/types/bingo";

export const FREE_SPACE = "FREE SPACE";
export const FREE_SPACE_LABEL = "Please remove me from this distro list (FREE SPACE)";
export const MIN_PHRASES = 24;
export const MAX_PHRASES = 200;
export const MAX_PHRASE_LENGTH = 100;

export class PhraseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhraseValidationError";
  }
}

/** Accept editor text or a phrase array, preserving display case and internal spaces. */
export function normalizePhrases(input: unknown): string[] {
  const entries: unknown = typeof input === "string" ? input.split(/\r\n|\n|\r/) : input;
  if (!Array.isArray(entries)) {
    throw new PhraseValidationError("Provide phrases as text or an array of strings.");
  }

  const phrases: string[] = [];
  for (const entry of entries) {
    if (typeof entry !== "string") {
      throw new PhraseValidationError("Every phrase must be a string.");
    }
    const phrase = entry.trim();
    if (phrase) phrases.push(phrase);
  }
  return phrases;
}

/** Returns a new normalized list or throws a user-readable validation error. */
export function validatePhrases(input: unknown): string[] {
  const phrases = normalizePhrases(input);
  if (phrases.length < MIN_PHRASES || phrases.length > MAX_PHRASES) {
    throw new PhraseValidationError(`Provide between ${MIN_PHRASES} and ${MAX_PHRASES} nonblank phrases.`);
  }

  const seen = new Set<string>();
  for (const [index, phrase] of phrases.entries()) {
    // Count Unicode code points so supplementary characters are not counted twice.
    if (Array.from(phrase).length > MAX_PHRASE_LENGTH) {
      throw new PhraseValidationError(`Phrase ${index + 1} must contain 1–${MAX_PHRASE_LENGTH} characters.`);
    }
    // Comparison is case-insensitive; the displayed phrase retains its original case.
    const key = phrase.toLowerCase();
    if (key === FREE_SPACE.toLowerCase()) {
      throw new PhraseValidationError(`Phrase ${index + 1} uses the reserved value ${FREE_SPACE}.`);
    }
    if (seen.has(key)) {
      throw new PhraseValidationError(`Phrase ${index + 1} is a duplicate after trimming and ignoring case.`);
    }
    seen.add(key);
  }
  return phrases;
}

/** Versions match PostgreSQL's positive integer range. */
export function validateVersion(input: unknown): number {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1 || input > 2_147_483_647) {
    throw new PhraseValidationError("Provide a valid positive configuration version.");
  }
  return input;
}

/** Validate API/storage data at runtime and omit all private database metadata. */
export function validatePhraseConfig(input: unknown): PhraseConfig {
  if (!input || typeof input !== "object" || !("version" in input) || !("phrases" in input) || !Array.isArray(input.phrases)) {
    throw new PhraseValidationError("Invalid phrase configuration.");
  }
  return { version: validateVersion(input.version), phrases: validatePhrases(input.phrases) };
}
