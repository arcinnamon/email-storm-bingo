# Idea: Winamp style (issue #4)

## Ask
Restyle the bingo page to look like Winamp's classic default skin.

## Constraints
- Colors match: blue with yellow and white trim lines, silver raised buttons, green text on black for bingo cells.
- Font matches (pixel/LCD style).

## Done looks like
The page looks like Winamp.

## Decisions from review
- CSS only: gradients and bevel borders. No Winamp images, logo, or bitmap font (copyrighted). No new dependency.
- Font: VT323 via `next/font/google`, applied to the whole page.
- Decorative player chrome (title bar and frame around the card): yes, `aria-hidden`, no behavior.
- One fixed Winamp theme replaces the light/dark theme.
- Contrast: bright green on near-black and yellow on blue must meet WCAG AA.
- Marked cells invert (black text on green) and keep `aria-pressed`; winning cells keep an outline and check mark.
- Yellow, visible focus rings.
- Phrases wrap; minimum font size about 12px; works at phone widths.
- No behavior changes; existing tests keep passing. Add one test for the new theme/markup.
