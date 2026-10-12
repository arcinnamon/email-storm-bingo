# Bingo Card Web App — Implementation Plan

PROJECT SPECIFICATION

•

MVP v1.0

•

Vercel deployment

Objective: Build and deploy a simple, responsive 5×5 bingo web app where players receive randomized cards, mark completed squares, and automatically detect a winning bingo. A password-protected admin interface manages one shared phrase list.

The application will support 2–20 users without user accounts, player databases, or real-time synchronization.

## 1. Architecture recommendation

I recommend Next.js + TypeScript + Tailwind CSS + Supabase Postgres, deployed on Vercel.

This slightly changes my preliminary suggestion of React/Vite. Next.js is a better fit now that you've confirmed you need shared persistent storage and a password-protected admin interface. Supabase gives us durable relational storage, server-side auth support, and a clean place to store admin rate-limit data without operating a bespoke database server.

Browser

Bingo board · Randomize · Mark squares · Admin UI

HTTPS requests

Next.js on Vercel

Public phrase API · Authenticated admin API · Session management

Server-only credentials

Supabase Postgres

Shared phrases · Admin login attempts · Configuration versions

Supabase provides durable relational storage for this app and keeps the data model simple: a small `bingo_config` record for the shared phrase list and a `login_attempts` table for temporary admin throttling. It removes the need to manage a custom database service while still giving us predictable, queryable storage.

[image](https://www.google.com/s2/favicons?domain=https://vercel.com\&sz=32)

Vercel

+2



### Technology decisions

| Component            | Choice                                    |
| -------------------- | ----------------------------------------- |
| Frontend             | Next.js App Router + React                |
| Language             | TypeScript, strict mode                   |
| Styling              | Tailwind CSS                              |
| Hosting              | Vercel                                    |
| Database             | Supabase Postgres                        |
| Admin authentication | One server-verified password             |
| Admin sessions       | Signed, HttpOnly cookie                  |
| Player progress      | In-memory browser state                 |
| Testing              | Vitest, React Testing Library, Playwright |

Important architectural distinction: The phrase list persists in Supabase and is shared by everyone. Individual bingo cards and marked squares exist only in the player's current page session. Reloading always creates a fresh card.

## 2. Agreed product behavior

| Feature              | Expected behavior                               |
| -------------------- | ----------------------------------------------- |
| Board                | 5 columns × 5 rows                              |
| Center               | Permanent FREE SPACE                            |
| Phrases per card     | 24 unique, randomly selected phrases            |
| Initial load         | Generate a new random board                     |
| Randomize            | Generate another board and clear marks          |
| Square interaction   | Tap/click to mark or unmark                     |
| Free space           | Always marked; cannot be unmarked               |
| Bingo detection      | 5 completed cells in a row, column, or diagonal |
| Win feedback         | Highlight winning line and display BINGO        |
| Refresh              | Generate new board, discard prior progress      |
| Admin                | Password-protected phrase management            |
| Shared configuration | Changes available to all newly generated boards |
| Hosting              | Vercel                                          |

Players do not need to log in. No gameplay data is stored on the server.

There is one useful refinement: randomizing should ideally produce a different board from the one currently displayed, provided a different arrangement can be generated. That prevents the Randomize button from appearing broken.

## 3. Functional specification

### 3.1 Player page — `/`

The home page is the bingo game.

On load, the application requests the current phrase list from the backend, selects 24 distinct phrases, shuffles them, inserts FREE SPACE in the center (position 12, using zero-based indexing), and renders the board.

The UI should provide a clear BINGO heading, the 5×5 grid, a Randomize button, and a modest win indicator.

Square behavior

- Unmarked: neutral background with phrase text.
- Marked: contrasting green background with a checkmark.
- Free space: distinct appearance, marked by default.
- Clicking a marked square removes its mark, except for the free space.
- Winning squares receive a stronger visual treatment.

The board must work with touch, mouse, and keyboard. Use actual button elements for individual squares, not clickable `div` elements. Provide accessible pressed states.

### 3.2 Randomization

Use the Fisher–Yates shuffle algorithm. Randomly select 24 phrases without replacement, then place the free space in the center.

The shuffle must be unbiased, rather than sorting by a random comparator.

```

export const BOARD_SIZE = 5;
export const FREE_INDEX = 12;

export function generateCard(phrases: string[]): string[] {
  if (phrases.length < 24) {
    throw new Error("At least 24 phrases are required");
  }

  const shuffled = [...phrases];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, 24);
  selected.splice(FREE_INDEX, 0, "FREE SPACE");

  return selected;
}

```

The function above is the basic implementation. The coding agent should also handle repeat randomization, enforce unique normalized phrases at the data boundary, and retry or otherwise generate a distinct card when necessary.

When Randomize is clicked, clear every completed mark except the center. If the current phrase list has changed since the previous generation, fetch the newest list before creating the next card. If the request fails, preserve the existing board and show a retryable error rather than discarding progress.

### 3.3 Winning logic

There are 12 possible winning lines:

- 5 horizontal rows
- 5 vertical columns
- 2 diagonals

A player wins when all five squares in any one line are completed. The center free space counts as already completed.

The winning logic should run immediately after each square is marked or unmarked.

```

export const WINNING_LINES: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],

  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],

  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function findWinningLines(
  marked: Set<number>
): number[][] {
  return WINNING_LINES.filter(line =>
    line.every(index => marked.has(index))
  );
}

```

When one or more winning lines are detected, show a clear BINGO celebration and highlight all winning squares. For the MVP, an inline success banner and a small animation are sufficient; no confetti library is necessary.

If a player unmarks a square and breaks every winning line, the win state disappears. If another valid winning line remains, the card continues to display the win.

### 3.4 Admin page — `/admin`

The admin page should not be advertised in public navigation. However, a secret URL is not a security boundary: authentication must be enforced on the server.

Phrase Management

Example admin interface

SHARED PHRASE LIST

Circle back

Move the needle

Let's take this offline

Low-hanging fruit

…and more phrases

Example: 30 phrases · Minimum 24

Save Changes

For simplicity, use a multiline text editor with one phrase per line, instead of building a complex CRUD table. This handles adding, editing, deleting, and reordering in one interface.

Admin requirements:

- Password login form.
- Persistent authenticated session for up to 24 hours.
- Load the current shared phrase list.
- Multiline editor, with one phrase per line.
- Display the current phrase count.
- Validate the list before saving.
- Save changes to Supabase.
- Show successful-save feedback and validation errors.
- Logout action.

Validation rules:

| Rule                        | Requirement                                    |
| --------------------------- | ---------------------------------------------- |
| Minimum count               | 24 phrases                                     |
| Maximum count               | 200 phrases                                    |
| Phrase length               | 1–100 characters                               |
| Blank lines                 | Ignore                                         |
| Leading/trailing whitespace | Trim                                           |
| Duplicates                  | Reject, case-insensitively after normalization |
| Reserved value              | Reject `FREE SPACE`                            |
| Empty submission            | Reject                                         |

Admin changes should take effect on the next new card generation or randomization, not rewrite cards that players are currently using.

## 4. Data storage design

Use a single Supabase row for the phrase configuration, storing a JSON payload or normalized text array in a standard Postgres column.

```

{
  "version": 1,
  "updated_at": "2026-10-09T20:00:00.000Z",
  "phrases": [
    "Circle back",
    "Move the needle",
    "Let's take this offline",
    "Low-hanging fruit"
  ]
}

```

This JSON is illustrative; a valid saved configuration must contain at least 24 phrases.

| Table / record    | Purpose                               |
| ----------------- | ------------------------------------- |
| `bingo_config`    | Canonical shared phrase configuration |
| `login_attempts`  | Recent failed login attempts by IP     |

The backend should read and write the single `bingo_config` row atomically. Include a version field and increment it on successful updates.

Initial data: Add a `seed` script that loads approximately 30 initial phrases from a local JSON file. It must only initialize an empty database and never silently overwrite existing admin changes.

Players should not receive Supabase credentials. All database access occurs on the server.

## 5. API contracts

Use Next.js Route Handlers. Define the following endpoints:

| Method | Endpoint             | Access               | Purpose                      |
| ------ | -------------------- | -------------------- | ---------------------------- |
| GET    | `/api/phrases`       | Public               | Get shared phrase list       |
| POST   | `/api/admin/login`   | Public, rate-limited | Authenticate admin           |
| GET    | `/api/admin/phrases` | Admin                | Retrieve configuration       |
| PUT    | `/api/admin/phrases` | Admin                | Validate and replace phrases |
| POST   | `/api/admin/logout`  | Admin                | End session                  |

Example public response:

```
{
  "version": 3,
  "phrases": [
    "Circle back",
    "Move the needle"
  ]
}
```

This is a shortened example. The actual stored list must meet the 24-phrase minimum.

For `PUT /api/admin/phrases`, accept the new phrase array and an `expectedVersion` number. Reject stale updates with HTTP 409 instead of silently overwriting another admin edit.

Use consistent HTTP behavior:

- `200`: successful read or update
- `400`: invalid phrase input
- `401`: unauthenticated request
- `409`: stale configuration version
- `429`: login attempts exceeded
- `500` or `503`: server or storage problem

Set `Cache-Control: no-store` for phrase and authenticated API responses to prevent stale data from delaying admin changes. Validate requests and enforce authorization inside every protected API handler.

## 6. Authentication and security

Use one admin password, configured through a Vercel environment variable. Avoid adding an authentication provider and user-management database for a single administrator.

Suggested environment variables:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

Store an Argon2id password hash, not a plaintext password. The login endpoint verifies the submitted password against the hash on the server.

After successful authentication, issue a signed session cookie containing an expiry and minimal session metadata. Set the cookie as HttpOnly, Secure in production, SameSite=Strict, and with an appropriate path. Use a 24-hour expiry; verify the signature and expiration on each admin request. Logout clears the cookie. Use a validated HMAC signature with constant-time comparison or a reputable session library, rather than custom cryptography.

Use a Supabase-backed login rate limit, approximately five failed attempts per 15-minute window per client IP, with suitable handling for shared IPs. Store the attempts in a dedicated `login_attempts` table and enforce the limit server-side before verifying the password.

[image](https://www.google.com/s2/favicons?domain=https://www.npmjs.com\&sz=32)

npm

+1



Additional security requirements:

- Require HTTPS in production.
- Verify same-origin requests for state-changing admin endpoints.
- Never expose password hashes or session secrets to the client.
- Never prefix private environment variables with `NEXT_PUBLIC_`.
- Do not log passwords, cookies, or Supabase credentials.
- Do not cache authenticated admin content.
- Verify admin authorization server-side, not only through UI redirects.
- Exclude `/admin` from ordinary navigation and mark it `noindex`.
- Return a generic error for incorrect login attempts.

Use `next/headers` cookie APIs in the supported Next.js version.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nextjs.org\&sz=32)

Next.js



For MVP, logout invalidates the current browser's cookie. Full server-side revocation of already-issued session tokens is out of scope; changing the session secret revokes all existing sessions.

## 7. Recommended project structure

```
bingo-app/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── phrases/
│   │       │   └── route.ts
│   │       └── admin/
│   │           ├── login/route.ts
│   │           ├── logout/route.ts
│   │           └── phrases/route.ts
│   ├── components/
│   │   ├── BingoBoard.tsx
│   │   ├── BingoSquare.tsx
│   │   ├── BingoControls.tsx
│   │   ├── BingoWinBanner.tsx
│   │   ├── AdminLoginForm.tsx
│   │   └── PhraseEditor.tsx
│   ├── lib/
│   │   ├── bingo.ts
│   │   ├── supabase.ts
│   │   ├── phrases.ts
│   │   ├── auth.ts
│   │   └── validation.ts
│   └── types/
│       └── bingo.ts
├── data/
│   └── initial-phrases.json
├── scripts/
│   └── seed.ts
├── tests/
│   ├── bingo.test.ts
│   ├── validation.test.ts
│   ├── auth.test.ts
│   └── e2e/
│       ├── gameplay.spec.ts
│       └── admin.spec.ts
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

Keep card generation and win detection in `lib/bingo.ts` as pure functions. This makes them independently testable and avoids coupling the logic to React.

The client-side state only needs the current card, a set of marked cell indexes, and the current list version. Winning lines can be derived from marked cells rather than stored separately.

## 8. Implementation phases

Phase 1 — Project scaffolding

Initialize Next.js with TypeScript, Tailwind CSS, ESLint, and the App Router. Create the folder structure, configure environment variables, and add the initial 30-phrase JSON file.

Exit criterion: the app builds successfully and runs locally.

Phase 2 — Core bingo engine

Implement the shuffle, unique phrase selection, free-space insertion, square toggling, and 12 winning-line checks. Add unit tests before building the user interface.

Exit criterion: all game logic tests pass.

Phase 3 — Player interface

Build the responsive board, marking interactions, Randomize control, win indication, loading state, and error handling.

Exit criterion: gameplay works with temporary local phrase data.

Phase 4 — Shared phrase database

Integrate Supabase Postgres, implement the phrase repository, add the public API, and create the safe initialization script. Replace temporary local data in the player page with API-loaded phrases.

Exit criterion: multiple browsers receive the same shared phrase configuration.

Phase 5 — Admin authentication

Implement login, signed sessions, protected API handlers, logout, CSRF protections, and login rate limiting.

Exit criterion: anonymous users cannot read or modify private admin endpoints.

Phase 6 — Admin phrase editor

Implement the multiline editor, validation, phrase count, save action, version conflict handling, and success/error feedback.

Exit criterion: a valid admin edit is immediately available to new cards.

Phase 7 — Testing and quality

Add integration and browser tests, check narrow-screen usability, test keyboard interaction, verify state reset behavior, and test login protection.

Exit criterion: all automated tests pass, with no critical accessibility failures.

Phase 8 — Vercel deployment

Connect the Git repository to Vercel, provision Supabase, configure production secrets, initialize data, and run production smoke tests.

Exit criterion: the public game and protected admin page work on the production URL.

## 9. Testing and acceptance criteria

The following is the minimum ship checklist. It is also an appropriate definition of done for your coding agent.

Acceptance checklist

0 / 18 verified

Every generated board contains exactly 25 squares.

Position 12 is always FREE SPACE and always marked.

Exactly 24 distinct non-free phrases appear on each card.

Randomize produces a new layout and resets progress.

Page refresh generates a new card and resets progress.

Clicking or tapping a square toggles its marked state.

All 12 winning lines are detected correctly.

Removing a mark updates or removes the win indication.

Two independent browsers can generate and play separate cards.

Unauthenticated requests cannot modify the shared phrase list.

Admin login, logout, and session expiration work.

Invalid phrases, duplicates, and lists under 24 are rejected.

Successful admin edits persist through redeployments.

Players use the newest list when generating a new card.

Database errors do not silently overwrite existing data.

The UI works on a 320px-wide viewport without horizontal page scrolling.

Keyboard users can navigate and activate every square.

TypeScript, lint, automated tests, and production build all pass.

A few test cases deserve special attention: winning with the free space in the center, two simultaneous winning lines, removing a completed square after winning, logging in with the wrong password repeatedly, and attempting to submit directly to the admin API without authentication.

For randomization tests, inject or mock the random-number generator so tests are deterministic. For live behavior, it is sufficient to use `Math.random`; the app is recreational and does not require cryptographic randomness.

## 10. Deployment and operational plan

### Vercel setup

1. Create a GitHub repository for the app.
2. Import the repository into Vercel.
3. Provision a Supabase project and database.
4. Confirm that the project URL and service-role key are available to the application's server-side runtime.
5. Configure the admin password hash and a securely generated session-signing secret.
6. Configure local equivalents through `.env.local`, excluded from Git.
7. Deploy the application.
8. Run the one-time seed operation against the intended production database.
9. Test the game, admin login, phrase update, and subsequent new-card generation.

Supabase gives the app a managed Postgres database with straightforward SQL schema management and secret handling.

### Ongoing maintenance

There should be almost none beyond normal dependency updates and checking for unexpected costs or errors.

Use a single production Supabase project, and avoid allowing preview deployments to write to it. For local development, use a separate development project or a deliberate test-data setup. The seed script must never reset an existing production phrase list.

Before major changes, export the current phrase configuration. A small JSON backup is sufficient at this scale.

### Scope deliberately excluded from v1

The following are not needed to ship:

- Player accounts or profiles
- Game history or saved cards
- Multiplayer synchronization
- Leaderboards
- Persistent win tracking
- PDF/print exports
- Social sharing
- Analytics dashboards
- Multiple admin roles
- Custom game sizes

These are potential future enhancements, not prerequisites.

## 11. Copy-paste prompt for your IDE coding agent

The following prompt is designed for direct use in Cursor, Claude Code, Codex, or another coding agent. It captures the required functionality, design constraints, and definition of done.

# Coding Agent Task: Build Bingo Card Web App

You are a senior full-stack software engineer. Build a complete, production-ready MVP of a 5×5 Bingo web application.

Work autonomously through implementation, tests, documentation, and build verification. Do not stop after scaffolding. Do not add unnecessary features or architectural complexity.

## 1. Stack

- Next.js App Router (current stable version)
- React and TypeScript (strict mode)
- Tailwind CSS
- Supabase Postgres
- Vercel deployment
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for browser tests

Use the project's installed framework versions and their current documented APIs. Avoid deprecated patterns.

## 2. Player experience

Create a public homepage at `/` with:

- A responsive 5×5 bingo board.
- Exactly 24 unique phrases selected randomly from the shared phrase list.
- A permanent, marked FREE SPACE at the center (index 12).
- A Randomize button.
- Clickable/tappable squares that toggle between marked and unmarked.
- Automatically detected winning rows, columns, and diagonals.
- Clear visual feedback when BINGO occurs.
- A simple, attractive, mobile-first design.

On every page load, fetch the shared phrase list and generate a new card. Do not persist cards or marked positions in browser storage or the database.

Randomize fetches the latest phrase list, generates a different card when possible, clears every previous mark except the center, and resets winning status.

Implement Fisher–Yates shuffle. Never mutate the source phrase array.

Use semantic HTML buttons, keyboard accessibility, visible focus indicators, appropriate text wrapping, and sufficient visual contrast.

Ensure the free space cannot be unmarked.

## 3. Game engine

Create pure TypeScript functions for:

- `generateCard(phrases)`
- `findWinningLines(marked)`
- Square toggle logic
- Phrase normalization and validation

Winning lines include all five rows, five columns, and two diagonals.

Derive winning state from marked squares; do not keep redundant state.

Place game logic in `src/lib/bingo.ts` with unit tests.

## 4. Persistent phrase configuration

Use Supabase Postgres as the shared storage backend.

Store a single row in a `bingo_config` table containing:

- `id`
- `version`
- `updated_at`
- `phrases`

Implement GET `/api/phrases` as a public endpoint.

Create `data/initial-phrases.json` with 30 reasonable sample phrases suitable for testing. Create an explicit, idempotent initialization script that seeds the database only if configuration does not already exist.

Do not hardcode phrases in the UI. Do not write to the filesystem at runtime.

Protect against stale caching: newly generated cards must use the latest saved phrase list.

Use descriptive errors when storage is unavailable.

## 5. Admin experience

Create `/admin` with a server-protected administrator interface and an appropriate login flow at `/admin/login`.

Do not place the admin URL in the public navigation. Mark admin pages as noindex, but do not treat an unlisted URL as security.

Use one administrator password; no user account table is required.

The authenticated admin can:

- View the existing phrase list.
- Edit phrases using a multiline text area, one phrase per line.
- Add and remove phrases.
- See the phrase count.
- Save the entire phrase list.
- View validation errors.
- Log out.

Validation:

- Minimum 24 phrases.
- Maximum 200 phrases.
- 1–100 characters per phrase.
- Trim surrounding whitespace.
- Ignore blank lines.
- Reject duplicate phrases after case-insensitive normalization.
- Reject the reserved phrase `FREE SPACE`.

Store updates atomically as a single database row update.

Use an incrementing configuration version and reject stale update submissions with HTTP 409.

The editor should warn about unsaved changes when navigating away.

## 6. Authentication and security

Implement:

- Server-side verification of an Argon2id password hash.
- Server-side session creation using a securely signed token or a well-maintained session library.
- HttpOnly, SameSite=Strict session cookies, Secure in production.
- A 24-hour session expiry.
- Authenticated server-side access checks on every protected API endpoint.
- Login rate limiting using a Supabase `login_attempts` table.
- Same-origin verification for state-changing admin requests.
- Logout that clears the session cookie.
- Safe error handling that does not leak credentials.
- No secrets in frontend bundles or committed files.

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`

Create `.env.example` with placeholder values and documentation describing how to generate the password hash and signing secret.

Do not implement client-side-only password protection.

## 7. API routes

Implement:

- `GET /api/phrases`
- `POST /api/admin/login`
- `GET /api/admin/phrases`
- `PUT /api/admin/phrases`
- `POST /api/admin/logout`

Use appropriate HTTP response codes, schema validation, and consistent JSON error structures.

Disable caching of phrase and private admin API responses.

## 8. UI requirements

Use a clean, playful but minimal visual style.

Player page:

- Prominent BINGO heading.
- Five equally sized columns.
- Word wrapping for longer phrases.
- Distinct free-space styling.
- Clear marked state and checkmarks.
- Winning line highlighting.
- Simple BINGO celebration.
- Prominent Randomize control.
- Loading and retryable error states.

Admin page:

- Simple password login.
- Multiline phrase editor.
- Phrase count and validation feedback.
- Save and Logout actions.
- Confirmation of successful saves.
- Clear response to conflicting edits.

Avoid unnecessary UI component libraries or heavy animation packages.

## 9. Tests

Write meaningful automated tests covering:

- Exactly 25 cells per card.
- Center free space.
- Unique phrase selection.
- Insufficient phrase count.
- Randomize and marked-state reset.
- Each winning direction.
- Breaking a winning line by unmarking.
- Multiple simultaneous winning lines.
- Admin validation and duplicate detection.
- Protected API authorization.
- Invalid passwords and login rate limits.
- Stale configuration version rejection.
- Persistence of phrase edits.
- Browser reload resetting the game.
- Responsive layout and accessible square controls.

Mock Supabase calls where appropriate for unit tests. Use a deliberate isolated test configuration for integration tests.

Ensure linting, TypeScript checking, tests, and production build pass.

## 10. Deployment readiness

Prepare the app for Vercel.

Create a README that covers:

1. Project overview
2. Prerequisites
3. Local setup
4. Supabase configuration
5. Generating admin password hash and session secret
6. Environment variables
7. Database initialization
8. Running tests
9. Production deployment
10. Admin access
11. Troubleshooting

Create appropriate package.json scripts such as:

- `dev`
- `build`
- `start`
- `lint`
- `typecheck`
- `test`
- `test:e2e`
- `db:seed`

Do not use deprecated Vercel KV integration packages.

Do not allow production seed scripts to overwrite an existing phrase configuration.

## 11. Implementation sequence

Implement in this order:

1. Initialize project.
2. Create types and pure game logic.
3. Write game logic unit tests.
4. Build responsive player UI.
5. Integrate Supabase and public phrase API.
6. Implement admin authentication.
7. Build phrase management UI.
8. Add API and component tests.
9. Add Playwright smoke tests.
10. Verify production build.
11. Complete documentation.

After each phase, validate functionality and fix discovered problems.

## 12. Final delivery

When finished, provide:

- Summary of implemented functionality.
- Significant architectural decisions.
- Repository file tree.
- Local launch commands.
- Environment setup instructions.
- Test results.
- Vercel deployment steps.
- Any remaining limitations.

Do not claim functionality is working unless it has been implemented and verified.

Avoid feature creep. The goal is a dependable, small, maintainable MVP that can be deployed and used by approximately 2–20 people.

## 12. Final recommendations

I'd make three product choices explicit before beginning the implementation.

First, no player logins. Everyone opens the same URL, gets a unique randomized card, and plays independently. This is the smallest solution that meets your requirements.

Second, one shared list, not shared cards. When the admin updates a phrase, every subsequently generated card can use it, while existing cards remain unchanged. This avoids needing game sessions or multiplayer synchronization.

Third, keep the admin editor deliberately simple. A single multiline editor with Save is easier to build, test, and maintain than 30 individual editable records.

The main infrastructure cost will be Vercel hosting plus Supabase storage. Both offer entry-level options, though actual charges depend on usage and the plans selected. With 2–20 players and infrequent admin changes, resource consumption should be modest.

The implementation prompt above is ready to paste into your IDE agent. The plan deliberately separates pure game logic from the backend, so you can implement and verify the gameplay before configuring Vercel or Supabase.