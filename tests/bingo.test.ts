// @vitest-environment node
import { describe, expect, it } from "vitest";
import { findWinningLines, generateCard, toggleSquare } from "@/lib/bingo";
import { PhraseValidationError } from "@/lib/validation";

const phrases = (count = 30) => Array.from({ length: count }, (_, i) => `Phrase ${i + 1}`);
const marks = (...indices: number[]) => Array.from({ length: 25 }, (_, i) => i === 12 || indices.includes(i));
const lines = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];

describe("card generation", () => {
  it.each([24, 30, 200])("creates 25 cells with 24 distinct phrases from a pool of %i", (count) => {
    const input = Object.freeze(phrases(count));
    const card = generateCard(input);
    expect(card.cells).toHaveLength(25);
    expect(card.cells[12]).toBe("FREE SPACE");
    const selected = card.cells.filter((_, index) => index !== 12);
    expect(new Set(selected).size).toBe(24);
    expect(selected.every((phrase) => input.includes(phrase))).toBe(true);
    expect(card.marked).toEqual(marks());
    expect(input).toEqual(phrases(count));
  });

  it("uses the supplied random source to shuffle the entire pool before selecting phrases", () => {
    const input = phrases();
    const card = generateCard(input, () => 0);
    const selected = card.cells.filter((_, index) => index !== 12);
    expect(selected).toEqual(input.slice(1, 25));
    expect(generateCard(input, () => 0)).toEqual(card);
    expect(generateCard(input, () => 0.999999).cells).not.toEqual(card.cells);
  });

  it("validates and normalizes phrases before creating a card", () => {
    expect(generateCard(phrases(24).map((phrase) => ` ${phrase} `)).cells).toContain("Phrase 1");
    for (const input of [phrases(23), phrases(201), [...phrases(), "phrase 1"], [...phrases(), "FREE SPACE"], [...phrases(), "a".repeat(101)]]) {
      expect(() => generateCard(input)).toThrow(PhraseValidationError);
    }
  });

  it.each([-0.1, 1, NaN, Infinity])("rejects invalid random value %s", (value) => {
    expect(() => generateCard(phrases(), () => value)).toThrow(RangeError);
  });

  it("creates independent state for each card", () => {
    const first = generateCard(phrases(), () => 0);
    const second = generateCard(phrases(), () => 0);
    expect(first.cells).not.toBe(second.cells);
    expect(first.marked).not.toBe(second.marked);
  });
});

describe("square toggling", () => {
  it.each([0, 24])("marks and unmarks square %i without changing other marks or the input", (index) => {
    const original = Object.freeze(marks(3));
    const marked = toggleSquare(original, index);
    expect(marked).toEqual(marks(3, index));
    expect(toggleSquare(marked, index)).toEqual(original);
    expect(original).toEqual(marks(3));
  });

  it("keeps the free center marked", () => {
    expect(toggleSquare(Object.freeze(marks(0)), 12)).toEqual(marks(0));
  });

  it.each([-1, 25, 1.5, NaN])("rejects invalid square index %s", (index) => {
    expect(() => toggleSquare(marks(), index)).toThrow(RangeError);
  });
});

describe("winning lines", () => {
  it.each(lines.map((line, index) => ({ line, index })))("detects winning line $index", ({ line }) => {
    const marked = Object.freeze(marks(...line));
    expect(findWinningLines(marked)).toEqual([line]);
    expect(marked).toEqual(marks(...line));
  });

  it("does not report a win for only the free center or scattered marks", () => {
    expect(findWinningLines(marks())).toEqual([]);
    expect(findWinningLines(marks(0, 2, 7, 15, 24))).toEqual([]);
  });

  it("reports every simultaneous win exactly once", () => {
    expect(findWinningLines(marks(...lines[0], ...lines[5]))).toEqual([lines[0], lines[5]]);
    expect(findWinningLines(Array<boolean>(25).fill(true))).toEqual(lines);
  });

  it("removes a win as soon as a winning square is unmarked", () => {
    const marked = marks(...lines[0]);
    expect(findWinningLines(marked)).toEqual([lines[0]]);
    expect(findWinningLines(toggleSquare(marked, 2))).toEqual([]);
  });

  it("keeps another completed line when one win is broken", () => {
    const marked = marks(...lines[0], ...lines[5]);
    expect(findWinningLines(toggleSquare(marked, 2))).toEqual([lines[5]]);
    expect(findWinningLines(toggleSquare(marked, 0))).toEqual([]);
  });

  it.each([0, 24, 26])("rejects marks for a board with %i cells", (count) => {
    const marked = Array<boolean>(count).fill(true);
    expect(() => findWinningLines(marked)).toThrow(RangeError);
    expect(() => toggleSquare(marked, 0)).toThrow(RangeError);
  });
});
