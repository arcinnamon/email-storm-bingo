# Plan: square bingo spaces on mobile

## Goal
Every bingo space renders as a square on phone-width screens, as it does on desktop. Fix it in CSS (fixed squares, smaller narrow-screen font) and keep the VT323 font.

## Out of scope
- Changing the font or adding a font dependency.
- Redesigning the card, theme, or tap target sizes.
- Phrase edits, except shortening phrases that still overflow at the 10px floor.

## Data model
None.

## Pages and routes
- `/`: public, unchanged. Only the bingo grid styling and the cell's accessible label change.

## Tasks
- [x] T1: Add a Playwright test in `tests/e2e/bingo-square.spec.ts` that loads `/` at 360x740, 320x640, and desktop, and asserts every `.bingo-cell` has width equal to height within 1px. Write it first so it fails on current CSS at phone widths. Verify: `npm run test:e2e -- bingo-square` (fails before T2, passes after).
- [x] T2: In `app/globals.css`, make `.bingo-cell` a fixed square: add `min-height: 0`, `overflow: hidden`, and `hyphens: auto` so text never grows the cell. Verify: T1 passes at 360px.
- [x] T3: Add a narrow-width media query (max-width about 480px) that lowers the cell font size, with a floor of 10px, and trims padding. Desktop sizes stay unchanged. Verify: T1 passes at 320px, and the existing `winamp.spec.ts` font-size check (>= 12px at desktop) still passes.
- [x] T4: In `components/bingo-card.tsx`, add `title` and `aria-label` with the full phrase to each cell. Confirm `<html lang="en">` is set in `app/layout.tsx` so hyphenation works. Verify: e2e test that each cell's `aria-label` equals its text content, and `getByRole("button", { name: phrase })` still finds it.
- [x] T5: Add an e2e test that no phrase is clipped: for each cell at 320px and 360px, `scrollHeight <= clientHeight` and `scrollWidth <= clientWidth` (1px tolerance). Verify: `npm run test:e2e -- bingo-square`.
- [x] T6 (shortened every phrase over about 28 characters; not confirmed in a browser because Playwright Chromium is not installed in the build environment): For any phrase that fails T5 at the 10px floor, shorten it in `lib/phrases.ts` (keep the count and uniqueness). Verify: `tests/unit/phrases.test.ts` passes, and the T5 test passes for every phrase in the pool, not only one deal (for example, by rendering a test page or looping over several new cards).
- [x] T7: Run `bash .github/scripts/verify.sh` and fix lint, typecheck, unit, and build failures. Verify: all checks green.

## Risks
- Some long phrases may not fit in a 320px-wide square at 10px, forcing phrase edits (T6).
- The pool may have more phrases than the 25 on a card, so the fit test must cover every phrase, not one random deal.
- Native hyphenation depends on `lang` and browser support, so it may not break words everywhere. `overflow-wrap: anywhere` stays as the backstop.
