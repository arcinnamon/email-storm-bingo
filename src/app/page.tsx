export default function Home() {
  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-4">
        <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Inbox entertainment</p>
        <h1 className="text-4xl leading-tight font-black tracking-tight sm:text-6xl">
          Email storm bingo
        </h1>
        <p className="text-lg leading-relaxed text-muted">
          Turn the familiar moments in an overflowing email thread into a little fun.
        </p>
      </div>
      <section aria-labelledby="welcome-heading" className="rounded-2xl border border-line bg-white p-6 sm:p-10">
        <p className="mb-5 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
          Coming soon
        </p>
        <h2 id="welcome-heading" className="max-w-lg text-2xl leading-snug font-bold tracking-tight sm:text-3xl">
          Your next reply-all deserves a bingo card.
        </h2>
        <p className="mt-4 max-w-lg leading-relaxed text-muted">
          The game is coming soon. Check back for your first card.
        </p>
      </section>
    </div>
  );
}
