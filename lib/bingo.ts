export const SIZE = 5;
export const CELLS = SIZE * SIZE;
export const FREE_INDEX = 12;
export const FREE_LABEL = "Free space";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const LINES: number[][] = [
  ...range(SIZE).map((r) => range(SIZE).map((c) => r * SIZE + c)),
  ...range(SIZE).map((c) => range(SIZE).map((r) => r * SIZE + c)),
  range(SIZE).map((i) => i * SIZE + i),
  range(SIZE).map((i) => i * SIZE + (SIZE - 1 - i)),
];

/** Picks 24 distinct phrases, shuffled, with the free space at the center. */
export function buildCard(phrases: readonly string[], random: () => number = Math.random): string[] {
  const pool = [...new Set(phrases)];
  if (pool.length < CELLS - 1) throw new Error("Not enough phrases to build a card");
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, CELLS - 1);
  return [...picked.slice(0, FREE_INDEX), FREE_LABEL, ...picked.slice(FREE_INDEX)];
}

/** Returns every completed line. The free space counts as marked. */
export function findBingo(marked: readonly boolean[]): number[][] {
  return LINES.filter((line) => line.every((i) => i === FREE_INDEX || marked[i]));
}
