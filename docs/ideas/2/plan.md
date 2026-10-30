# Plan: bingo app (issue #2)

## Goal

The home page shows a shuffled 5x5 bingo card of reply-all storm phrases with a free center. Players tap squares to mark them and see a "Bingo!" banner when any of the 12 lines is complete.

## Out of scope

- Database, accounts, Supabase calls, or shared/multiplayer cards.
- Editing phrases in the UI (the owner edits `lib/phrases.ts`).
- Sound, animations, scoring, or history.
- New dependencies, and any change to the auth scaffold.

## Data model

None. Card and marks live in the browser's localStorage only.

## Pages and routes

- `/`: public. Server Component page with heading, short instructions, and the client `BingoCard`. Replaces the placeholder content. No other routes.

## Tasks

- [ ] T1: Add `lib/phrases.ts` exporting `PHRASES` (about 30 placeholder reply-all phrases, e.g. "Please remove me from this list", "Reply-all is not a good idea"). Verify: `tests/unit/phrases.test.ts` fails if there are fewer than 24 phrases, any duplicates, or any blank entries.
- [ ] T2: Add `lib/bingo.ts` with pure functions: `LINES` (the 12 index lines on a 25-cell board), `FREE_INDEX = 12`, `buildCard(phrases, random)` (picks 24 distinct phrases, shuffled, free space at index 12), and `findBingo(marked)` returning completed lines. Verify: `tests/unit/bingo.test.ts` checks there are exactly 12 distinct lines; each of the 5 rows, 5 columns, and 2 diagonals wins when marked; 4 of 5 does not win; the free space alone completes nothing; `buildCard` gives 25 cells with 24 distinct phrases and free at the center.
- [ ] T3: Add `lib/bingo-storage.ts` with `loadGame` and `saveGame` over localStorage that validate stored data (right shape, 25 cells, phrases still in `PHRASES`, free space intact) and return null for anything invalid or unavailable. Verify: `tests/unit/bingo-storage.test.ts` with a stubbed storage: round-trip works; corrupt JSON, wrong length, unknown phrases, and a throwing storage all return null.
- [ ] T4: Add client component `components/bingo-card.tsx` (`"use client"`). After mount it loads a saved game or builds a new card, then renders a 5x5 grid of buttons with `aria-pressed`, the free space shown as marked and non-toggleable, and saves on every change. Before mount it renders a plain "Loading card" placeholder so server and client output match. Verify: `tests/e2e/bingo.spec.ts` loads `/`, sees 25 squares, taps one, and sees `aria-pressed="true"`.
- [ ] T5: Add the "Bingo!" banner to `BingoCard` as visible text in a `role="status"` region, shown when `findBingo` finds a line, with winning squares also marked by a non-color cue (e.g. a check mark). Verify: e2e test seeds localStorage with a card, taps the four non-free squares of a line through the free space, and expects the "Bingo!" text; before the last tap it is absent.
- [ ] T6: Add a "New card" button that asks for confirmation (`window.confirm`) before replacing the card and clearing marks. Verify: e2e test marks a square, dismisses the dialog and sees the card unchanged, then accepts it and sees only the free space marked.
- [ ] T7: Confirm persistence on reload. Verify: e2e test marks a square, reloads, and sees the same phrases with the square still marked.
- [ ] T8: Replace the placeholder in `app/page.tsx` with the heading, one-line instructions, and `<BingoCard />`; add bingo styles to `app/globals.css` (responsive grid that fits 360px wide, wrapped phrase text, visible `:focus-visible` outline, sufficient contrast). Update `tests/e2e/home.spec.ts` to assert the new h1 in place of the removed "Hola" placeholder greeting. Verify: `tests/e2e/home.spec.ts` passes, and a 360px-wide e2e check finds no horizontal scroll.
- [ ] T9: Run the full check. Verify: `bash .github/scripts/verify.sh` passes (lint, typecheck, unit tests, build, e2e).

## Risks

- Hydration mismatch from the random shuffle: mitigated by building the card only after mount.
- Stale or tampered localStorage (for example after the owner edits phrases) could break the card: mitigated by validating on load and falling back to a new card.
- Replacing the placeholder breaks the existing home e2e test: T8 updates it to match the new page.
