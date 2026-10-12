# Test Scenarios

- Given a player opens the app for the first time
  When the page loads
  Then the app should fetch the shared phrase list
  And generate a fresh 5x5 bingo card
  And the center square should be the free space

- Given the app has loaded a bingo card
  When the player marks a non-free square
  Then the square should toggle to the marked state
  And the board should update visually

- Given a marked square is toggled off
  When the player clicks the same square again
  Then the square should return to the unmarked state
  And the win state should be recalculated

- Given the free space is always present at the center
  When the player attempts to click it
  Then it should remain marked
  And it should not be unmarked

- Given there are at least 24 valid phrases in the shared list
  When a new card is generated
  Then exactly 24 non-free phrases should be selected
  And the board should contain exactly 25 cells total
  And no phrase should be duplicated on the same card

- Given the phrase list contains fewer than 24 valid phrases
  When the app tries to generate a card
  Then it should reject the configuration
  And it should show a validation error

- Given a card is generated
  When the player marks all five squares in a row
  Then the app should detect a horizontal win
  And the winning squares should be highlighted
  And a bingo message should appear

- Given a card is generated
  When the player marks all five squares in a column
  Then the app should detect a vertical win
  And the winning squares should be highlighted
  And a bingo message should appear

- Given a card is generated
  When the player marks all five squares on a diagonal
  Then the app should detect a diagonal win
  And the winning squares should be highlighted
  And a bingo message should appear

- Given a winning line exists
  When the player unmarks one of the winning squares
  Then the app should recalculate the winning lines
  And the win should disappear if no valid line remains

- Given multiple winning lines are possible at the same time
  When the player completes more than one line
  Then the app should highlight all valid winning lines

- Given the Randomize button is clicked
  When a new card is generated
  Then the previous marks should be cleared
  And the free space should remain marked
  And the winning state should be reset

- Given the phrase list has changed since the current card was generated
  When the player clicks Randomize
  Then the app should fetch the newest phrase list first
  And generate a new card from the latest version

- Given the phrase fetch fails
  When the app tries to load or re-randomize the board
  Then the current board should remain visible
  And the user should see a retryable error message

- Given an admin visits the protected admin page without a valid session
  When the request is made
  Then the server should reject it with an unauthorized response

- Given the admin enters the correct password
  When the login request is submitted
  Then the server should create a valid signed admin session
  And the user should be redirected or allowed into the admin page

- Given the admin enters the wrong password
  When the login request is submitted
  Then the login should fail
  And the user should receive a generic error message
  And the failed attempt should be counted for rate limiting

- Given the admin has made repeated failed login attempts
  When the threshold is exceeded
  Then subsequent login attempts should be rejected with a rate-limit response

- Given the admin is authenticated
  When the phrase list is loaded in the admin editor
  Then the current phrase count should be displayed
  And the existing entries should be shown in the textarea

- Given the admin enters a phrase list with fewer than 24 valid entries
  When the save action is triggered
  Then the server should reject the update
  And the validation error should be shown

- Given the admin enters duplicate phrases after normalization
  When the save action is triggered
  Then the update should be rejected
  And the error should explain the duplicate values

- Given the admin tries to save a phrase equal to FREE SPACE
  When the validation runs
  Then the update should be rejected
  And the reserved value error should be shown

- Given the admin submits a valid phrase list
  When the save request is processed
  Then the app should persist the updated list to Supabase
  And increment the configuration version
  And return a successful response

- Given another admin update was made after the current editor loaded
  When the user submits an older version
  Then the save should fail with a conflict error
  And the server should reject the stale update

- Given the admin logs out
  When the logout request is submitted
  Then the session cookie should be cleared
  And the user should be signed out

- Given a player loads a board after the admin changed the phrase list
  When a new card is generated
  Then the player should receive the newest shared phrase list

- Given the app is loaded on a small mobile viewport
  When the board renders
  Then the layout should stay within the viewport
  And no horizontal scrolling should be required

- Given a keyboard user navigates the board
  When they tab to a square and press Enter or Space
  Then the square should toggle its state
  And the focus state should remain visible

- Given the app is running in production
  When admin or phrase API responses are sent
  Then the headers should include no-store caching directives

- Given a database error occurs while fetching or saving phrases
  When the request is handled
  Then the user should receive a meaningful server error
  And the app should not silently overwrite existing data

- Given the app starts locally
  When the project is booted with the development environment
  Then the app should compile successfully
  And the test suite should pass

- Given a production deployment is configured
  When the app is deployed to Vercel
  Then the public game page and admin pages should load successfully
  And the database-backed phrase list should work in the deployed environment
