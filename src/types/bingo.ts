/** Shared public configuration; database metadata stays in the repository layer. */
export interface PhraseConfig {
  readonly version: number;
  readonly phrases: readonly string[];
}

/** Row-major marks, aligned with the card's 25 cells. */
export type MarkedSquares = readonly boolean[];

export interface BingoCard {
  readonly cells: readonly string[];
  readonly marked: MarkedSquares;
}

/** Five row-major cell indices, suitable for highlighting a completed line. */
export type WinningLine = readonly [number, number, number, number, number];
