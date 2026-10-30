import { describe, expect, it } from "vitest";
import { buildCard, FREE_INDEX } from "@/lib/bingo";
import { loadGame, saveGame, STORAGE_KEY, type Game } from "@/lib/bingo-storage";
import { PHRASES } from "@/lib/phrases";

function fakeStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

function sampleGame(): Game {
  const marked = Array<boolean>(25).fill(false);
  marked[FREE_INDEX] = true;
  marked[0] = true;
  return { cells: buildCard(PHRASES), marked };
}

describe("bingo storage", () => {
  it("round-trips a game", () => {
    const storage = fakeStorage();
    const game = sampleGame();
    saveGame(game, storage);
    expect(loadGame(storage)).toEqual(game);
  });
  it("returns null when nothing is saved", () => {
    expect(loadGame(fakeStorage())).toBeNull();
  });
  it("returns null for corrupt JSON", () => {
    expect(loadGame(fakeStorage("{not json"))).toBeNull();
  });
  it("returns null for the wrong length", () => {
    const g = sampleGame();
    expect(loadGame(fakeStorage(JSON.stringify({ ...g, cells: g.cells.slice(1) })))).toBeNull();
  });
  it("returns null for unknown phrases", () => {
    const g = sampleGame();
    const cells = [...g.cells];
    cells[0] = "Not a real phrase";
    expect(loadGame(fakeStorage(JSON.stringify({ ...g, cells })))).toBeNull();
  });
  it("returns null when the free space is damaged", () => {
    const g = sampleGame();
    const marked = [...g.marked];
    marked[FREE_INDEX] = false;
    expect(loadGame(fakeStorage(JSON.stringify({ ...g, marked })))).toBeNull();
  });
  it("returns null when storage throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
    };
    expect(loadGame(throwing)).toBeNull();
  });
  it("does not throw when saving fails", () => {
    const throwing = {
      setItem: () => {
        throw new Error("full");
      },
    };
    expect(() => saveGame(sampleGame(), throwing)).not.toThrow();
  });
});
