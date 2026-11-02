# Plan: update phrases (issue #7)

## Goal

Replace the default phrase pool with the 29 email-storm phrases from the idea. The center free space now reads "Please remove me from this distribution list".

## Out of scope

- Fixing "Aaron Rogers" (kept as written).
- Migrating saved games (they reset once).
- New dependencies, layout redesign, or logic changes beyond the label.

## Data model

None.

## Pages and routes

- `/`: public, unchanged behavior. Card draws 24 of the 29 phrases; center cell shows the new free label.

## Tasks

- [x] T1: In `lib/phrases.ts`, replace `PHRASES` with the 29 phrases from `docs/ideas/7/idea.md` (typographic quotes kept, outer wrapping quotes dropped; the free label text excluded). Verify: `tests/unit/phrases.test.ts` asserts the list equals the exact 29 phrases in order and excludes the free label.
- [x] T2: In `lib/bingo.ts`, set `FREE_LABEL` to "Please remove me from this distribution list". Verify: `tests/unit/bingo.test.ts` asserts `FREE_LABEL` equals that text, the center of a built card is it, and no other cell is it.
- [x] T3: Confirm old saved games reset. Verify: `tests/unit/bingo-storage.test.ts` gets a case where the saved center is "Free space" and the loader returns null.
- [x] T4: Update e2e tests for the new label. Verify: `tests/e2e/bingo.spec.ts` asserts the center cell text is the new label, still `aria-pressed="true"` after a click.
- [x] T5: Check the card at phone width. Verify: e2e at a 375px viewport asserts no horizontal overflow and the center cell's `scrollHeight <= clientHeight` (no clipping); adjust wrapping in `app/globals.css` only if it fails.
- [x] T6: Run the full suite. Verify: `bash .github/scripts/verify.sh` passes.

## Risks

- The long free label may clip in the small center square at 375px; T5 catches it.
- Typographic quotes copied wrongly would make the exact-list test fail; the test compares to the idea text.
- Saved games reset once for returning players; accepted.
