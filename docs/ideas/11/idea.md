# Idea 11: keep bingo spaces square on mobile

## Request
As a mobile player I want the spaces to be squares so the page looks like a bingo card.
Square spaces render well on a PC but not on a phone.

## Done looks like
Given I am a player, when I load the page on a mobile device, then every space renders as a square.

## Review findings
- The pixel font is probably not the cause. `.bingo-cell` uses `aspect-ratio: 1` but has no `min-height: 0` or overflow limit. On a ~360px screen long phrases wrap past the cell height and the button grows, so the row stops being square.
- Fix: fixed square cells (`min-height: 0`, `overflow: hidden`), a smaller font on narrow widths, and `hyphens: auto`.
- Put the full phrase in `title`/`aria-label` so clipped text is still available.
- Add Playwright checks at 360px and 320px that each cell's width equals its height within 1px, plus a desktop check.

## Decisions (owner approved defaults)
- If a phrase can't fit: shrink text to a floor of about 10px on narrow screens, then shorten any phrases that still overflow.
- Keep the VT323 font. No font swap and no new dependency.
- Keep tap targets and contrast as they are.
