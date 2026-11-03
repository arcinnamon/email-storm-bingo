# Idea: remove check marks

## Request
Selected spaces don't need the checkmark character.

## Constraints
Just remove the character, no other functional changes.

## Done looks like
When I click a space there is no leading checkmark character.

## Decisions from review
- The "✓ " is only rendered on spaces in a completed Bingo line (`components/bingo-card.tsx`), not on every clicked space. Treat the request as "no ✓ anywhere".
- Keep the `data-winning` attribute, its styling, and the "Bingo!" banner unchanged.
- Nothing replaces the ✓ on winning spaces.
- No accessibility change: the ✓ was `aria-hidden`.
- Add a test that completes a line and asserts no "✓" in any space, while the banner and `data-winning` still appear.
