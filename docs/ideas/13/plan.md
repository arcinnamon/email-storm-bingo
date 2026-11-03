# Plan: cleaner, non-pixelated font

## Goal
Replace the VT323 pixel font with Inter so all text is more readable, keeping the Winamp colors and layout. Retune sizes so the 5x5 grid still fits with square cells at phone widths.

## Out of scope
- Changing colors, layout, frame styling, or phrases (except shortening if needed to fit).
- Adding a dependency (Inter comes from the existing `next/font/google`).
- Per-element font mixing or a font picker.

## Data model
None.

## Pages and routes
- `/`: public, unchanged behavior. Only typography changes.

## Tasks
- [ ] T1: Write tests first. Update `tests/unit/theme.test.ts` to expect a neutral `--font-sans` variable fed by Inter with a `sans-serif` fallback, and no `VT323`/`vt323`/`--font-pixel` anywhere in `app/`. Add an e2e test in `tests/e2e/` that body `font-family` contains Inter's loaded family (not VT323 or monospace). Verify: both fail on the current code.
- [ ] T2: In `app/layout.tsx`, replace VT323 with `Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })` and apply the variable to `<html>`. Verify: `npm run build` and `npm run typecheck`.
- [ ] T3: In `app/globals.css`, rename `--font-pixel` to `--font-sans`, set it to `var(--font-inter), system-ui, -apple-system, "Segoe UI", sans-serif`, and update the `body` usage. Verify: T1 unit test passes.
- [ ] T4: Retune sizes for Inter: body about 1rem, h1, banner, title bar (drop wide letter-spacing if it hurts), and cell text with a 14px floor on desktop and phones. Colors unchanged. Verify: `winamp.spec.ts` font-size checks updated and passing, cell computed font-size >= 14px.
- [ ] T5: Update `.bingo-cell` and the max-width 480px media query so text never grows the cell (keep `aspect-ratio: 1`, `overflow: hidden`, `hyphens`, `overflow-wrap`). Verify: `bingo-square.spec.ts` passes at 320, 360 and desktop widths.
- [ ] T6: Make the no-clipping test in `bingo-square.spec.ts` cover every phrase in the pool at 320 and 360px (`scrollWidth <= clientWidth`, `scrollHeight <= clientHeight`, 1px tolerance). Verify: `npm run test:e2e -- bingo-square`.
- [ ] T7: Shorten any phrase in `lib/phrases.ts` that fails T6 at the 14px floor (keep count and uniqueness). Verify: `tests/unit/phrases.test.ts` and T6 pass.
- [ ] T8: Add a contrast unit test in `tests/unit/theme.test.ts` computing WCAG ratios for the text/background pairs in use (green on black, black on green, white on blue, yellow on blue, black on silver), each at least 4.5:1. Verify: `npm run test`.
- [ ] T9: Run `bash .github/scripts/verify.sh` and fix lint, typecheck, unit, and build failures. Verify: all checks green.

## Risks
- Inter is wider than VT323, and a 14px floor in 320px-wide square cells may force many phrase edits (T7). If it cannot fit, fall back to 12px on phones only and tell the owner.
- `next/font/google` fetches at build time, so a build without network access could fail.
- Title bar and banner may wrap on narrow screens after retuning.
