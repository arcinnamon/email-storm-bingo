# Plan: Arial for bingo spaces

## Goal
The 25 bingo spaces render in Arial (or a close system equivalent) instead of VT323. Nothing else on the page changes, and text still fits in every space at phone widths.

## Out of scope
- Fonts for the title, buttons, or any other element.
- Changing how VT323 is loaded.
- Adding a web font or any dependency.
- Changing the phrases, colors, or layout.

## Data model
None.

## Pages and routes
No new routes. `/` (public) shows the card with the new cell font.

## Tasks
- [x] T1: In `app/globals.css`, replace `font: inherit` on `.bingo-cell` with `font-family: Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif`, and scale both `font-size` clamps (base and the max-width 480px block) down by about 0.8x. Keep `overflow-wrap` and `hyphens`. Verify: unit test in `tests/unit/theme.test.ts` reading the CSS, asserting the `.bingo-cell` rule sets the Arial stack and does not mention VT323.
- [x] T2: Add an e2e test in `tests/e2e/bingo-square.spec.ts` that every `.bingo-cell` has a computed font-family starting with Arial and not containing VT323, while the page title keeps its original font. Verify: the new test, run with `npm run test:e2e`.
- [ ] T3: Confirm text fits at 320px, 375px, and desktop widths with the new font, adjusting the font-size clamps if any phrase clips. Verify: existing fit and square tests in `tests/e2e/bingo-square.spec.ts` pass, with a 375px size added to `SIZES`.
- [ ] T4: Run the full suite. Verify: `bash .github/scripts/verify.sh` passes.

## Risks
- Arial is wider than VT323, so long phrases may clip. The fit tests at 320px and 375px catch this.
- Fallback fonts differ by device, so the rendered face varies. Tests check the declared stack, not the rendered face.
