"use client";

import { useEffect, useState } from "react";
import { buildCard, CELLS, findBingo, FREE_INDEX } from "@/lib/bingo";
import { loadGame, saveGame, type Game } from "@/lib/bingo-storage";
import { PHRASES } from "@/lib/phrases";

function newGame(): Game {
  const marked = Array<boolean>(CELLS).fill(false);
  marked[FREE_INDEX] = true;
  return { cells: buildCard(PHRASES), marked };
}

export function BingoCard() {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    // Built after mount so the random shuffle never causes a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGame(loadGame() ?? newGame());
  }, []);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  if (!game) return <p>Loading card</p>;

  const lines = findBingo(game.marked);
  const winning = new Set(lines.flat());

  function toggle(index: number) {
    if (index === FREE_INDEX) return;
    setGame((g) => g && { ...g, marked: g.marked.map((m, i) => (i === index ? !m : m)) });
  }

  function reset() {
    if (window.confirm("Start a new card? Your current card and marks will be lost.")) {
      setGame(newGame());
    }
  }

  return (
    <div>
      <div role="status" className="bingo-status">
        {lines.length > 0 ? <strong className="bingo-banner">Bingo!</strong> : null}
      </div>
      <div className="bingo-grid">
        {game.cells.map((phrase, i) => (
          <button
            key={i}
            type="button"
            className="bingo-cell"
            aria-pressed={game.marked[i]}
            aria-disabled={i === FREE_INDEX || undefined}
            data-winning={winning.has(i) || undefined}
            onClick={() => toggle(i)}
          >
            {winning.has(i) ? <span aria-hidden="true">✓ </span> : null}
            {phrase}
          </button>
        ))}
      </div>
      <button type="button" className="bingo-reset" onClick={reset}>
        New card
      </button>
    </div>
  );
}
