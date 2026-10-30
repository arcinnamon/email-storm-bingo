# Idea: bingo app (issue #2)

A very simple bingo web app for phrases you might see in an email reply-all storm.

## As approved

- Standard 5x5 bingo grid with a free center space.
- 12 winning lines: 5 rows, 5 columns, 2 diagonals. The free space counts toward them.
- No database. The static page never calls Supabase; the auth scaffold stays untouched.

## Decisions from the review

- Phrases live in one editable file, `lib/phrases.ts`. About 30 placeholder phrases ship first; the owner swaps in their own.
- At least 24 phrases are required, with no duplicates (enforced by a unit test).
- Each visitor gets their own shuffled card (not shared).
- The shuffle runs after mount in a small client component to avoid a hydration mismatch.
- Card and marks are saved in localStorage so a reload keeps them. A "New card" button asks before resetting.
- Squares are buttons with `aria-pressed`, visible focus, and work at phone widths.
- A text "Bingo!" banner announces a win (not color alone).
- Win logic is a pure function in `lib/`, unit tested for all 12 lines and the free space.
- Static page, no user input, no secrets: free tier is fine.
