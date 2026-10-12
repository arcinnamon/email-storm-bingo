# Refined test scenarios for email-storm-bingo

These scenarios are written as red-to-green acceptance tests. Start by writing the failing test for each behavior before implementation. Keep assertions focused on observable outcomes, not internal implementation details.

## Test conventions

- Prefer descriptive names that read like behavior: "creates a 5x5 board with a free center square" rather than "renders board".
- Keep each scenario atomic: one condition, one action, one expected outcome.
- Assert against user-visible state: board contents, win state, auth result, validation message, or data persisted in Supabase.
- Treat all tests as failing first for the TDD loop: write the test, confirm it fails, implement the behavior, confirm it passes.

## Core gameplay

### 1. Initial load creates a valid board
- Title: loads a fresh game board on first visit
- Given the app is opened for the first time
- When the page finishes loading
- Then it fetches the shared phrase list from the configured source
- And it generates a 5x5 board with exactly 25 cells
- And the center cell is marked as the free space
- And the board is ready for interaction without requiring a manual refresh

### 1a. Failed initial load shows an error without a playable board
- Title: offers Retry when the shared phrase list cannot be loaded on first visit
- Given the app is opened for the first time and no board exists
- When the initial phrase fetch fails
- Then the user sees a phrase-loading error with a Retry action
- And no playable or partially generated board is shown
- And no bundled fallback phrases are used to generate a board

### 1b. Retrying initial load creates a board after recovery
- Title: recovers from an initial phrase-loading failure without reloading the page
- Given the initial phrase fetch failed and the error with Retry is visible
- And the configured phrase source is now available with a valid shared phrase list
- When the player clicks Retry and the fetch succeeds
- Then a valid 5x5 board is generated from the fetched shared phrase list
- And only the free center square is marked
- And the loading error is cleared
- And the board is ready for interaction without a page reload

### 2. Player can toggle a non-free square
- Title: toggles a selected square on and off
- Given a board is loaded and a non-free square is unmarked
- When the player clicks that square
- Then that square changes to the marked state
- And the visual state updates immediately
- And the board still contains exactly 25 cells

### 3. Toggling the same square again clears it
- Title: clears a marked square when clicked again
- Given a board is loaded and a non-free square is already marked
- When the player clicks the same square again
- Then the square returns to the unmarked state
- And the winning-state calculation is recomputed
- And any previous win highlighting for that square is removed

### 4. The free center square cannot be toggled off
- Title: prevents the free center square from being unmarked
- Given the center square is the free space and is always marked
- When the player attempts to click it
- Then the square remains marked
- And the app does not treat the click as a normal toggle event
- And the board state remains valid

### 5. Generated board contains exactly 24 phrases and no duplicates
- Title: generates a valid bingo card from the shared phrase list
- Given the phrase source contains at least 24 valid entries
- When a new card is generated
- Then exactly 24 non-free phrases are selected for the board
- And the board contains exactly 25 cells total
- And no phrase appears more than once on the same card
- And the free-space cell does not reuse a phrase value

### 6. Invalid phrase lists are rejected before board generation
- Title: rejects a phrase list that is too small for a board
- Given the phrase source contains fewer than 24 valid entries
- When the app attempts to generate a new board
- Then the generation is rejected
- And the app surfaces a validation error to the user
- And no partially generated board is shown

## Win detection

### 7. Horizontal win is detected when a row is completed
- Title: detects a full row as a bingo
- Given a valid board is generated
- When the player marks all five cells in a single row
- Then the app identifies a horizontal win
- And the five winning cells are highlighted
- And a bingo message is displayed

### 8. Vertical win is detected when a column is completed
- Title: detects a full column as a bingo
- Given a valid board is generated
- When the player marks all five cells in a single column
- Then the app identifies a vertical win
- And the five winning cells are highlighted
- And a bingo message is displayed

### 9. Diagonal win is detected when either diagonal is completed
- Title: detects a diagonal as a bingo
- Given a valid board is generated
- When the player marks all five cells on either diagonal
- Then the app identifies a diagonal win
- And the winning cells are highlighted
- And a bingo message is displayed

### 10. Win state recalculates after a winning square is cleared
- Title: clears the win when the winning pattern is broken
- Given a valid winning line exists on the board
- When the player unmarks one of the cells in that winning line
- Then the app recalculates the winning lines
- And the win is removed if no valid line remains
- And the board returns to the non-winning state without reloading

### 11. Multiple wins are all reported when more than one line is complete
- Title: highlights every valid winning line at once
- Given a board with multiple valid winning patterns available
- When the player completes more than one line at the same time
- Then the app highlights all valid winning lines
- And the message reflects the board's current winning state
- And duplicate line reporting is avoided

## Clear, Randomize, and refresh behavior

### 12. Randomize clears marks and resets win state
- Title: randomizes a fresh board and resets progress
- Given a player has a board with marked cells and a completed winning line
- And they have clicked the Randomize button
- When the latest phrase list is successfully fetched and a valid new board is generated
- Then the new board replaces the current board
- And the previous cell selections are cleared
- And the free center square remains marked
- And the winning state is reset to no win
- And the Randomize button is enabled again

### 12a. Pending Randomize preserves the board and prevents duplicate requests
- Title: disables additional Randomize requests while a new board is loading
- Given a board has marked cells and a completed winning line
- When the player clicks Randomize and the phrase fetch remains pending
- Then a loading indicator is displayed
- And the Randomize button is disabled until the attempt succeeds or fails
- And further attempts to activate Randomize do not start another request
- And the current phrases, positions, marks, winning highlights, and bingo message remain unchanged

### 12b. Players can keep playing while Randomize is pending
- Title: keeps square interactions available while fetching a new phrase list
- Given a Randomize phrase fetch is pending and the current board is still visible
- When the player activates a non-free square
- Then that square toggles its marked state immediately
- And winning highlights and the bingo message update to reflect the current marks
- And the board retains its current phrases and positions until a valid replacement is ready
- And the free center square remains marked

### 13. Randomize fetches the newest shared phrase list before generating
- Title: refreshes phrase data before creating a new board
- Given the shared phrase list has changed since the current card was created
- When the player clicks Randomize
- Then the app fetches the latest phrase list first
- And it generates a new card from that newest data set
- And the new board does not reuse stale phrases from the old list

### 14. Failed Randomize preserves the current board and progress
- Title: handles phrase-loading failures without losing ongoing gameplay
- Given a Randomize phrase fetch is pending for a visible board
- And the player has changed marks while the request was pending
- When the phrase fetch fails
- Then the existing board remains visible and playable with the same phrases and positions
- And all current marks are preserved, including changes made while the request was pending
- And winning highlights and the bingo message still reflect those current marks
- And the user sees a phrase-loading error with a Retry action
- And the loading indicator is cleared and the Randomize button is enabled again
- And no replacement board is generated from stale or bundled fallback phrases

### 14a. Retrying failed Randomize replaces the board only after success
- Title: retries a failed Randomize without discarding progress before recovery
- Given a Randomize fetch failed and the current board and loading error remain visible
- And the configured phrase source is now available with a valid shared phrase list
- When the player clicks Retry
- Then a new phrase fetch starts and a loading indicator is displayed
- And Randomize and Retry are disabled while that request is pending to prevent duplicate requests
- And the current board remains playable until a valid replacement is ready
- And after the fetch succeeds a new board generated from the fetched list replaces the current board
- And only the free center square is marked and no win is displayed
- And the loading error and indicator are cleared and Randomize is enabled again

### 14b. Clear removes marks without changing the phrase arrangement
- Title: clears progress while keeping the current card
- Given a board has marked non-free squares and a completed winning line
- When the player clicks the Clear button
- Then all non-free squares become unmarked
- And the free center square remains marked
- And every phrase remains in its current position
- And all winning highlights and the bingo message are removed
- And no phrase fetch or board randomization is triggered
- And the current board remains ready for interaction

## Admin authentication and session handling

### 15. Unauthenticated admin requests are rejected
- Title: blocks protected admin routes without a valid session
- Given an admin visits the protected admin page without a valid signed session
- When the request is made
- Then the server responds with an unauthorized status
- And the user is not granted access to admin features

### 16. Correct admin password creates a valid session
- Title: signs a valid admin session on correct login
- Given the admin enters the correct password
- When the login request is submitted
- Then the server creates a valid signed session
- And the user is redirected or allowed into the protected admin page
- And the session remains valid for the expected lifetime

### 17. Incorrect password fails without revealing details
- Title: rejects invalid admin credentials
- Given the admin enters the wrong password
- When the login request is submitted
- Then the login fails
- And the user receives a generic error message
- And the failed attempt increments the rate-limit counter

### 18. Rate limiting blocks repeated failed login attempts
- Title: locks out repetitive failed admin login attempts
- Given the admin has made repeated failed login attempts beyond the configured threshold
- When another login request is submitted
- Then the server rejects the request with a rate-limit response
- And the response does not reveal whether the credentials are valid or invalid

### 19. Logout clears the session cookie
- Title: clears admin session state on logout
- Given an authenticated admin session is active
- When the admin logs out
- Then the session cookie is cleared
- And the user is signed out
- And subsequent protected requests are rejected

## Phrase list administration

### 20. Admin editor loads the current phrase list
- Title: shows the current phrase data in the admin editor
- Given the admin is authenticated
- When the phrase list is loaded in the admin editor
- Then the current phrase count is displayed
- And the existing entries are shown in the textarea
- And the data is loaded from the latest saved value

### 21. Phrase list with too few entries is rejected
- Title: rejects phrase sets that cannot support a valid board
- Given the admin enters a phrase list with fewer than 24 valid entries
- When the save action is triggered
- Then the server rejects the update
- And the user sees a validation error explaining the minimum required count

### 22. Duplicate phrases are rejected after normalization
- Title: rejects duplicate entries after trimming and normalization
- Given the admin enters duplicate phrases after normalization such as trimming whitespace or case-folding
- When the save action is triggered
- Then the update is rejected
- And the UI or API error explains that duplicate values are not allowed

### 23. The reserved FREE SPACE phrase is rejected
- Title: rejects the reserved center phrase value
- Given the admin attempts to save a phrase equal to the reserved FREE SPACE value
- When validation runs
- Then the update is rejected
- And the user sees a reserved-value validation error

### 24. Valid phrase list is persisted and versioned
- Title: saves a valid phrase update with version tracking
- Given the admin submits a valid phrase list
- When the save request is processed
- Then the updated list is persisted to Supabase
- And the configuration version is incremented
- And the server returns a successful response

### 25. Stale admin updates are rejected with a conflict error
- Title: prevents overwriting newer admin edits with stale data
- Given another admin update was made after the currently loaded editor state
- When the user submits an older version of the phrase list
- Then the save fails with a conflict error
- And the server rejects the stale update without overwriting newer data

## Resilience and production checks

### 26. Database failures surface a meaningful error and preserve data
- Title: fails safely when phrase persistence or retrieval fails
- Given a database error occurs while fetching or saving phrases
- When the request is handled
- Then the user receives a meaningful error message
- And the previous valid data is not silently overwritten or lost

### 27. Production responses include no-store directives
- Title: prevents caching of sensitive admin and phrase responses in production
- Given the app is running in production
- When admin or phrase API responses are sent
- Then the HTTP headers include no-store caching directives
- And the responses are not cached by intervening infrastructure

## Accessibility and mobile usability

### 28. Mobile layout remains usable on small screens
- Title: keeps the board within the viewport on small screens
- Given the app is loaded on a small mobile viewport
- When the board renders
- Then the layout remains within the viewport
- And no horizontal scrolling is required to use the game

### 29. Keyboard interaction toggles squares and keeps focus visible
- Title: supports keyboard-only board interaction
- Given a keyboard user navigates the board
- When they tab to a square and press Enter or Space
- Then the square toggles its marked state
- And focus remains visible so the user knows where they are on the board

## Local and deployment smoke tests

### 30. Local boot succeeds with the project test suite
- Title: verifies the app boots cleanly in development
- Given the app starts locally in the development environment
- When the project boots
- Then the app compiles successfully
- And the automated test suite passes without failures

### 31. Production deployment smoke test loads the app and data
- Title: verifies the deployed app works in production
- Given the app is configured for production deployment on Vercel
- When the public game page and admin pages are loaded
- Then both pages render successfully
- And the database-backed phrase list works in the deployed environment

## Priority ordering for implementation

1. Board generation and win logic
2. Admin auth and phrase validation
3. Error handling and resilience
4. Accessibility and responsive layout
5. Local and deployment smoke verification

The goal is to keep the suite focused on behavior that users and admins can observe, while writing the smallest tests that prove the app works in production.
