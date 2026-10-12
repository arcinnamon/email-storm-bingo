"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FREE_SPACE_INDEX, findWinningLines, generateCard, toggleSquare } from "@/lib/bingo";
import { validatePhraseConfig } from "@/lib/validation";
import type { BingoCard, PhraseConfig, WinningLine } from "@/types/bingo";

async function fetchPhraseConfig(): Promise<PhraseConfig> {
  const response = await fetch("/api/phrases", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Phrase list is unavailable. Please try again.");
  }

  const payload = await response.json();
  return validatePhraseConfig(payload);
}

function getBoardMessage(winningLines: readonly WinningLine[]): string {
  if (winningLines.length === 0) {
    return "Build a row, column, or diagonal to win.";
  }

  if (winningLines.length === 1) {
    return "Bingo! You have a winning line.";
  }

  return `Bingo! ${winningLines.length} lines are active.`;
}

export default function Home() {
  const [board, setBoard] = useState<BingoCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const winningLines = useMemo(
    () => (board ? findWinningLines(board.marked) : []),
    [board],
  );

  const winningSet = useMemo(
    () => new Set(winningLines.flatMap((line) => [...line])),
    [winningLines],
  );

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const config = await fetchPhraseConfig();
      const nextBoard = generateCard(config.phrases);
      setBoard(nextBoard);
    } catch (loadError) {
      setBoard(null);
      setError(loadError instanceof Error ? loadError.message : "Phrase list is unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const randomizeBoard = useCallback(async () => {
    if (isRandomizing || isLoading) {
      return;
    }

    setIsRandomizing(true);
    setError(null);

    try {
      const config = await fetchPhraseConfig();
      setBoard(generateCard(config.phrases));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Phrase list is unavailable. Please try again.");
    } finally {
      setIsRandomizing(false);
    }
  }, [isLoading, isRandomizing]);

  const toggleCell = useCallback((index: number) => {
    if (!board) {
      return;
    }

    setBoard((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        marked: toggleSquare(current.marked, index),
      };
    });
  }, [board]);

  const clearBoard = useCallback(() => {
    setBoard((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        marked: current.marked.map((_, index) => index === FREE_SPACE_INDEX),
      };
    });
    setError(null);
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const actionLabel = error && !isLoading ? (board ? "Retry" : "Retry") : isRandomizing ? "Refreshing..." : "Randomize";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-6">
        <div className="w-full rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted">Game board</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearBoard}
                className="rounded-full border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => void randomizeBoard()}
                disabled={isLoading || isRandomizing}
                className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition enabled:hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-live="polite"
              >
                {actionLabel}
              </button>
            </div>
          </div>

          {isLoading && !board ? (
            <div className="rounded-2xl border border-dashed border-line bg-accent-soft p-4 text-sm text-muted" aria-live="polite">
              Loading your game board…
            </div>
          ) : null}

          {error && !board ? (
            <div role="alert" className="rounded-2xl border border-line bg-red-50 p-4 text-sm text-red-900">
              <p className="mb-3 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => void loadBoard()}
                className="rounded-full bg-red-900 px-3 py-2 font-medium text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900"
              >
                Retry
              </button>
            </div>
          ) : null}

          {board ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-accent-soft p-3 text-sm text-ink" aria-live="polite">
                {getBoardMessage(winningLines)}
              </div>

              <div
                role="grid"
                aria-label="Bingo board"
                className="grid w-full grid-cols-5 gap-2"
              >
                {board.cells.map((cell, index) => {
                  const isMarked = board.marked[index];
                  const isWinning = winningSet.has(index);
                  const isFreeSpace = index === FREE_SPACE_INDEX;

                  return (
                    <button
                      key={`cell-${index}`}
                      type="button"
                      role="gridcell"
                      aria-label={`Toggle square ${index + 1}: ${cell}`}
                      aria-pressed={isMarked}
                      onClick={() => { if (!isFreeSpace) toggleCell(index); }}
                      className={`flex aspect-square w-full items-center justify-center rounded-xl border p-1 text-center text-[0.56rem] font-medium transition sm:text-xs ${
                        isMarked
                          ? isWinning
                            ? "border-accent bg-accent text-white shadow-sm"
                            : isFreeSpace
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-accent bg-accent-soft text-ink"
                          : isWinning
                            ? "border-accent bg-accent/10 text-ink"
                            : "border-line bg-white text-ink hover:border-accent"
                      } ${isFreeSpace ? "cursor-default" : "cursor-pointer"} break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                    >
                      <span className="line-clamp-4 overflow-hidden">{cell}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="w-full rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-ink">How to play</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>Click any non-free square to mark it.</li>
            <li>Complete a row, column, or diagonal to score a bingo.</li>
            <li>Use Randomize for a fresh card from the latest shared phrase list.</li>
            <li>Clear removes your progress without changing the card layout.</li>
          </ul>
        </aside>
      </section>

      {error && board ? (
        <div role="alert" className="max-w-xl rounded-2xl border border-line bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void randomizeBoard()}
            className="mt-3 rounded-full bg-red-900 px-3 py-2 font-medium text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!board && !isLoading && !error && (
        <div className="max-w-xl rounded-2xl border border-dashed border-line bg-white p-4 text-sm text-muted">
          Your board is ready to load.
        </div>
      )}
    </div>
  );
}
