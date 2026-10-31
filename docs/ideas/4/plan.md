# Plan: Winamp style (issue #4)

## Goal

Restyle the home page to look like Winamp's classic default skin: blue frame with yellow and white trim, silver raised buttons, and green-on-black bingo cells in a pixel font. Behavior stays exactly as it is.

## Out of scope

- Winamp images, logo, bitmap font, or any copyrighted skin art.
- New dependencies, sound, animation, skin switching, or a light/dark toggle.
- Changes to game logic, storage, phrases, or auth.

## Data model

None.

## Pages and routes

- `/`: public, unchanged behavior. Gains a decorative title bar and frame around the card (`aria-hidden`). No other routes.

## Tasks

- [ ] T1: Load VT323 with `next/font/google` in `app/layout.tsx`, expose it as a CSS variable on `<html>`, and set the page title to "Reply-all storm bingo". Verify: `npm run build` succeeds and e2e `tests/e2e/winamp.spec.ts` checks `document.title`.
- [ ] T2: Replace the light/dark tokens in `app/globals.css` with one fixed Winamp palette (CSS variables: deep blue, yellow, white trim, silver, near-black, bright green), remove the `prefers-color-scheme` block, and use the font variable with a monospace fallback. Verify: `tests/unit/theme.test.ts` reads `globals.css` and fails if a `prefers-color-scheme` block exists or a required token is missing.
- [ ] T3: Check palette contrast. Verify: `tests/unit/theme.test.ts` parses the hex tokens and fails if green-on-black, black-on-green, yellow-on-blue, or black-on-silver is below 4.5:1.
- [ ] T4: Add decorative chrome in `app/page.tsx`: a title bar (gradient and grip lines, labelled with the app name, no logo) and a frame, with `aria-hidden` on decorative elements and the real `h1` kept. Verify: e2e checks the `h1` is visible and the chrome element exists with `aria-hidden="true"`.
- [ ] T5: Restyle grid cells: black background, bright green text, beveled inset border, wrapping text, minimum font size 12px. Marked cells invert to black-on-green; winning cells keep outline and check mark. Verify: e2e checks an unmarked cell computes black background and green text, a marked cell computes green background and black text, and `aria-pressed` still toggles.
- [ ] T6: Restyle "New card" as a silver raised button with bevel borders and a pressed state on `:active`, and the "Bingo!" banner in yellow on blue. Verify: e2e checks the button's computed background matches the silver token and the banner is visible after completing a line.
- [ ] T7: Add yellow `:focus-visible` rings on cells and the button, and make the layout fit at 375px width. Verify: e2e at a 375px viewport asserts `scrollWidth <= clientWidth` and a keyboard-focused cell has a yellow outline.
- [ ] T8: Run the full suite with existing tests unchanged. Verify: `bash .github/scripts/verify.sh` passes, including existing `tests/e2e/bingo.spec.ts`.

## Risks

- `next/font/google` fetches at build time, so an offline build fails. Mitigation: the CSS variable falls back to a monospace stack.
- VT323 renders small, so phrases may be hard to read in 5 columns on phones. Mitigation: size it so rendered text is at least 12px and let phrases wrap.
- Existing e2e tests rely on `.bingo-cell`, roles, and `aria-pressed`. Keep those class names and attributes.
