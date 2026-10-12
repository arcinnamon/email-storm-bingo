import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Storm Bingo",
  description: "A little bingo for your next big reply-all storm.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-white px-4 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to content
        </a>
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-5 sm:px-8">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-black text-white">
              B
            </span>
            <span className="text-sm font-bold tracking-wide">Email Storm Bingo</span>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-8 sm:py-16"
        >
          {children}
        </main>
        <footer className="border-t border-line">
          <p className="mx-auto max-w-4xl px-4 py-5 text-sm text-muted sm:px-8">
            A little fun for a very full inbox.
          </p>
        </footer>
      </body>
    </html>
  );
}
