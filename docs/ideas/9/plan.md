# Plan: remove check marks

## Goal
Stop rendering the "✓ " character on spaces in a completed Bingo line. Nothing else about the card changes.

## Out of scope
- Replacing the ✓ with another marker or new styling.
- Changes to the "Bingo!" banner, `data-winning`, marking logic, or storage.

## Data model
None.

## Pages and routes
- `/` (public): unchanged, except winning spaces no longer show a leading ✓.

## Tasks
- [x] T1: In `components/bingo-card.tsx`, delete the `<span aria-hidden="true">✓ </span>` line so a cell renders only its phrase. Verify: `npm run typecheck` and `npm run lint` pass; existing e2e tests in `tests/e2e/bingo.spec.ts` still pass.
- [x] T2: Add an e2e test in `tests/e2e/bingo.spec.ts` that seeds a card, completes the row of cells 10-14, then asserts the "Bingo!" banner is visible, the five cells have `data-winning`, and no `.bingo-cell` text contains "✓". Verify: `npm run test:e2e` (the test fails if the ✓ is restored).

## Risks
- No DOM unit-test library is installed and none may be added, so the test is Playwright rather than Vitest.
- Winning spaces may look only subtly different from other marked spaces; accepted per the owner's decision.
