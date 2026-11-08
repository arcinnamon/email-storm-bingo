# Idea: change font

## Idea
Change the font of the 25 bingo spaces to Arial or an equivalent, to match what Winamp uses.

## Constraints
- Change only the font of the 25 card spaces.

## Done looks like
The 25 spaces render in Arial (or equivalent) instead of the pixel font VT323.

## Decisions from review
- Set font-family on `.bingo-cell` only: `Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif`.
- Title, buttons, and VT323 loading stay as they are.
- Arial is a system font. No web font, no new dependency.
- Arial is wider than VT323, so scale `.bingo-cell` font sizes down (about 0.8x), keep overflow-wrap, and check at 320px and 375px widths.
- Add a test that `.bingo-cell` computed font-family is not VT323, and run e2e at phone width.
