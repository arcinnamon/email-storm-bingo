export default function Home() {
  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <h1 className="text-4xl leading-tight font-black tracking-tight sm:text-6xl">
          Email storm bingo
        </h1>
      </div>

      <section
        aria-labelledby="welcome-heading"
        className="rounded-2xl border border-line bg-white p-6 sm:p-10"
      >
        <p className="max-w-lg leading-relaxed text-muted">
          The game is coming soon.
        </p>
      </section>
    </div>
  );
}
