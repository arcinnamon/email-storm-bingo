# Idea: update phrases (issue #7)

Replace the default phrases with an email-storm list.

## The list (29 phrases, drawn 24 per card)

Any response from VP or above; Comic Sans signature block; Happy greeting “have a fantastic weekend!”; An actual answer that gets buried; Actually reaches the intended recipient; Actually resolved the intent of the original email; A very long-winded “why me”; ALL CAPS; ALL CAPS BIG FONT; Topical joke; Follow-up topical joke; Topical meme; Non-topical meme; You know someone who replied all; “I think you mean another Jennifer”; “This isn’t my team”; “Why am I on this list”; “Ditto”; “Unsubscribe”; A highly technical “well actually”; A clearly AI-generated response; “It looks to have been sent out in error”; Someone uses the high priority flag; Sarcasm; OP apology; Near-famous names (Aaron Rogers); Unbelievable names (Christopher Test); “Me too”; “Me three”.

## Decisions from review

- The center free space reads "Please remove me from this distribution list" (most common storm reply). `FREE_LABEL` changes from "Free space".
- That text is not in the phrase pool.
- Keep "Aaron Rogers" exactly as written.
- Keep curly quotes and apostrophes as typed. Drop the outer quotes only where a quote wraps the entire phrase.
- Replace the old list entirely. Old saved games fail validation and reset once to a fresh card. No migration.
- Check the long free label at phone width; fix wrapping only if it clips.
