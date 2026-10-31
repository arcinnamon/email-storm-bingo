import { BingoCard } from "@/components/bingo-card";

export default function Home() {
  return (
    <main className="bingo">
      <div className="winamp-frame">
        <div className="winamp-titlebar" aria-hidden="true" data-testid="titlebar">
          <span>Reply-all storm bingo</span>
          <span className="winamp-grip" />
        </div>
        <div className="winamp-body">
          <h1>Reply-all storm bingo</h1>
          <p>Tap a square when you see that phrase in your inbox. Complete a row, column, or diagonal to win.</p>
          <BingoCard />
        </div>
      </div>
    </main>
  );
}
