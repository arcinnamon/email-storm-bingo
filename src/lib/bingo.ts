import type { BingoCard, MarkedSquares, WinningLine } from "@/types/bingo";
import { FREE_SPACE, validatePhrases } from "@/lib/validation";

export const CELL_COUNT = 25;
export const FREE_SPACE_INDEX = 12;

const WINNING_LINES: readonly WinningLine[] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

/** No input mutation or stored state. Inject random values in [0, 1) for repeatable cards. */
export function generateCard(
  phrases: readonly string[],
  random: () => number = Math.random,
): BingoCard {
  const shuffled = validatePhrases(phrases);
  // Fisher–Yates over the entire pool gives every phrase a chance to be selected.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("Random values must be in the range [0, 1).");
    }
    const j = Math.floor(value * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const cells = shuffled.slice(0, CELL_COUNT - 1);
  cells.splice(FREE_SPACE_INDEX, 0, FREE_SPACE);
  return {
    cells,
    marked: Array.from({ length: CELL_COUNT }, (_, index) => index === FREE_SPACE_INDEX),
  };
}

function assertBoardSize(marked: MarkedSquares): void {
  if (marked.length !== CELL_COUNT) {
    throw new RangeError(`A card must have exactly ${CELL_COUNT} marks.`);
  }
}

export function toggleSquare(marked: MarkedSquares, index: number): MarkedSquares {
  assertBoardSize(marked);
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
    throw new RangeError("Square index must be an integer between 0 and 24.");
  }
  return marked.map((value, cell) => cell === FREE_SPACE_INDEX || (cell === index ? !value : value));
}

/** Wins are derived on each call, so unmarking a square immediately breaks its lines. */
export function findWinningLines(marked: MarkedSquares): readonly WinningLine[] {
  assertBoardSize(marked);
  return WINNING_LINES.filter((line) => line.every((index) => marked[index]))
    .map((line): WinningLine => [...line]);
}
