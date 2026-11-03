# Idea: change font

## Idea
Use a less pixelated font.

## Constraints
- Fine to break from the Winamp pixel font. Colors stay the same. Words should be a bit more readable.

## Done looks like
The page uses a cleaner, non-pixelated font.

## Decisions from review
- Use Inter via `next/font/google` (self-hosted at build time, no new dependency, no runtime requests to Google).
- Rename `--font-pixel` to a neutral name and keep a system sans fallback. Nothing should point at VT323.
- Retune sizes in `globals.css` (body 1.25rem and cell clamp values were tuned to VT323).
- Check the 5x5 grid at phone widths: long phrases must not overflow, and cells stay square (#12).
- Keep text contrast at WCAG AA or better on the existing colors. Cell text at least 14px.
- Tests: page no longer loads VT323, body font resolves to the new font, no cell text overflows at phone width.
