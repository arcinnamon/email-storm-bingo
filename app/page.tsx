import { BingoCard } from "@/components/bingo-card";

export default function Home() {
  return (
    <main className="bingo">
      <h1>Reply-all storm bingo</h1>
      <p>Tap a square when you see that phrase in your inbox. Complete a row, column, or diagonal to win.</p>
      <BingoCard />
    </main>
  );
}
