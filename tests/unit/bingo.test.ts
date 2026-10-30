import { describe, expect, it } from "vitest";
import { buildCard, findBingo, FREE_INDEX, FREE_LABEL, LINES } from "@/lib/bingo";
import { PHRASES } from "@/lib/phrases";

function markedWith(indexes: number[]): boolean[] {
  const m = Array<boolean>(25).fill(false);
  indexes.forEach((i) => (m[i] = true));
  return m;
}

describe("LINES", () => {
  it("has 12 distinct lines of 5 cells", () => {
    expect(LINES).toHaveLength(12);
    expect(new Set(LINES.map((l) => l.join(","))).size).toBe(12);
    expect(LINES.every((l) => l.length === 5)).toBe(true);
  });
});

describe("findBingo", () => {
  it.each(LINES.map((l, i) => [i, l] as const))("line %i wins when fully marked", (_, line) => {
    expect(findBingo(markedWith(line))).toContainEqual(line);
  });
  it.each(LINES.map((l, i) => [i, l] as const))("line %i does not win with 4 of 5", (_, line) => {
    const partial = line.slice(0, 4);
    expect(findBingo(markedWith(partial)).some((l) => l === line)).toBe(false);
  });
  it("does not win with only the free space", () => {
    expect(findBingo(markedWith([FREE_INDEX]))).toEqual([]);
  });
  it("counts the free space even if unmarked", () => {
    expect(findBingo(markedWith([10, 11, 13, 14]))).toHaveLength(1);
  });
});

describe("buildCard", () => {
  it("gives 25 cells, 24 distinct phrases, free in the center", () => {
    const card = buildCard(PHRASES);
    expect(card).toHaveLength(25);
    expect(card[FREE_INDEX]).toBe(FREE_LABEL);
    const others = card.filter((_, i) => i !== FREE_INDEX);
    expect(new Set(others).size).toBe(24);
    expect(others.every((p) => PHRASES.includes(p))).toBe(true);
  });
  it("throws with too few phrases", () => {
    expect(() => buildCard(["a", "b"])).toThrow();
  });
});
