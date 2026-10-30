import { CELLS, FREE_INDEX, FREE_LABEL } from "@/lib/bingo";
import { PHRASES } from "@/lib/phrases";

export type Game = { cells: string[]; marked: boolean[] };

export const STORAGE_KEY = "email-storm-bingo:game";

function isValid(data: unknown): data is Game {
  if (typeof data !== "object" || data === null) return false;
  const { cells, marked } = data as Record<string, unknown>;
  if (!Array.isArray(cells) || !Array.isArray(marked)) return false;
  if (cells.length !== CELLS || marked.length !== CELLS) return false;
  if (!marked.every((m) => typeof m === "boolean")) return false;
  if (cells[FREE_INDEX] !== FREE_LABEL || marked[FREE_INDEX] !== true) return false;
  const known = new Set(PHRASES);
  const others = cells.filter((_, i) => i !== FREE_INDEX);
  return others.every((c) => typeof c === "string" && known.has(c)) && new Set(others).size === CELLS - 1;
}

function defaultStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadGame(storage: Pick<Storage, "getItem"> | undefined = defaultStorage()): Game | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
}

export function saveGame(game: Game, storage: Pick<Storage, "setItem"> | undefined = defaultStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Storage unavailable or full: the game still works, it just won't survive a reload.
  }
}
