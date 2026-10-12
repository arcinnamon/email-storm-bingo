# Bingo App Implementation Checklist

This checklist turns [docs/architecture.md](docs/architecture.md) and [docs/tests.md](docs/tests.md) into an implementation sequence. Complete each phase in order, writing focused tests before implementing behavior. The scope is deployment-ready application code and documentation; provisioning Supabase or deploying to Vercel is an operator task.

## Phase 1: Project foundation

- [x] Scaffold the Next.js App Router project with strict TypeScript and Tailwind CSS.
- [x] Configure Vitest, React Testing Library, and Playwright; add `dev`, `build`, `lint`, `typecheck`, `test`, and `test:e2e` scripts.
- [x] Create the shared app layout, global styles, and responsive page shell.
- [x] Add `.env.example`; ensure local environment files remain ignored and server secrets cannot enter client bundles.
- [x] Update the README with prerequisites and initial local setup.
- [x] Verify the development server starts and the production build succeeds.

## Phase 2: Bingo domain logic

- [ ] Define shared types for phrase configuration, cards, and winning lines.
- [ ] Implement phrase normalization and validation: trim surrounding whitespace, ignore blank lines, enforce 24–200 phrases and 1–100 characters per phrase, reject normalized duplicates, and reject the reserved `FREE SPACE` phrase.
- [ ] Implement pure card generation using Fisher–Yates shuffle without mutating the input list.
- [ ] Ensure every generated card contains exactly 25 cells, with 24 distinct phrases and `FREE SPACE` fixed at index 12.
- [ ] Implement square toggling so the free center cannot be unmarked.
- [ ] Implement detection of all 5 rows, 5 columns, and 2 diagonals; derive wins from the current marks.
- [ ] Add unit tests for valid/invalid phrase lists, card shape and uniqueness, non-mutation, toggling, each winning direction, multiple simultaneous wins, and breaking a win.

## Phase 3: Supabase persistence and public phrase API

- [ ] Add database migrations for a singleton `bingo_config` record containing phrases, version, and update timestamp.
- [ ] Add a `login_attempts` table or equivalent storage for bounded, expiring login-rate-limit data; minimize retained client-identifying information.
- [ ] Configure database access so credentials and the service-role client are server-only; prevent public access to private tables.
- [ ] Implement a server-side phrase repository with explicit storage errors.
- [ ] Implement atomic, version-checked configuration updates so stale submissions return a conflict and cannot overwrite newer data.
- [ ] Add approximately 30 initial phrases and an idempotent seed command that initializes an empty database only.
- [ ] Implement `GET /api/phrases` with the current version and phrases, input/output validation, and `Cache-Control: no-store`.
- [ ] Test persistence, version increments, stale writes, seed safety, public response shape, and database failures.

## Phase 4: Player gameplay

- [ ] Build the public game page and accessible 5×5 board using semantic buttons, visible focus, pressed states, and readable phrase wrapping.
- [ ] Fetch the shared phrase list on initial load; show a loading state and a retryable error if it fails, without showing a partial board or fallback phrases.
- [ ] Keep the page interactive after a retry succeeds; start each page load with a fresh card and only the free center marked.
- [ ] Implement square marking, unmarking, free-space behavior, win message, and highlighting for every active winning line.
- [ ] Implement Randomize so it fetches the latest phrase list and commits a new board only after fetch and validation succeed.
- [ ] While Randomize is pending, prevent duplicate requests but keep the current board, marks, win feedback, and square interactions intact.
- [ ] On Randomize failure, preserve the latest current marks and arrangement, show Retry, and allow another attempt.
- [ ] Add Clear to remove non-free marks and win feedback without changing phrase positions or fetching data.
- [ ] Ensure refresh discards the previous card and marks; do not persist player state in browser storage or the database.
- [ ] Add component and browser tests for load/retry, toggle/win flows, clear, successful and failed randomization, concurrent interaction, and reload reset.
- [ ] Verify the board works at a 320px viewport without horizontal page scrolling and is operable by keyboard.

## Phase 5: Admin authentication and protected APIs

- [ ] Add server-side Argon2id password verification using `ADMIN_PASSWORD_HASH`; never store or log the plaintext password.
- [ ] Create a signed admin session using a maintained signing/session library and `ADMIN_SESSION_SECRET`.
- [ ] Set a 24-hour HttpOnly cookie with SameSite=Strict, Secure in production, and a path that includes protected API requests; verify signature and expiry server-side.
- [ ] Implement logout by clearing the session cookie and verify subsequent protected requests fail.
- [ ] Enforce authorization inside every protected page and API handler; return `401` for unauthenticated API requests and do not rely on obscurity or client-only redirects.
- [ ] Verify same-origin requests for state-changing admin endpoints.
- [ ] Implement atomic Supabase-backed rate limiting for failed login attempts (approximately five failures per 15-minute window per client IP) and expire old records.
- [ ] Return generic incorrect-login errors and `429` when rate limited; do not reveal whether credentials were correct.
- [ ] Add `POST /api/admin/login` and `POST /api/admin/logout`; ensure sensitive responses use `Cache-Control: no-store`.
- [ ] Test correct/incorrect credentials, expiry, cookie attributes, logout, unauthorized API calls, same-origin enforcement, generic errors, and rate-limit behavior.

## Phase 6: Admin phrase editor

- [ ] Protect `/admin` server-side and provide a separate `/admin/login` flow; mark admin pages `noindex` and omit admin links from public navigation.
- [ ] Implement authenticated phrase loading and a one-phrase-per-line editor with count, validation feedback, Save, and Logout controls.
- [ ] Enforce all phrase validation on the server, regardless of client-side validation.
- [ ] Submit the loaded configuration version as `expectedVersion`; show a conflict response without overwriting the latest saved data.
- [ ] Show save success and actionable validation/storage errors; warn before navigating away with unsaved changes.
- [ ] Ensure saved changes are used by the next generated card without changing cards already open in other browsers.
- [ ] Add tests for editor loading, validation errors, successful persistence/versioning, stale conflicts, logout, and unsaved-change warning.

## Phase 7: Integration, accessibility, and quality gates

- [ ] Run the acceptance scenarios in [docs/tests.md](docs/tests.md) against the completed application and add missing automated coverage.
- [ ] Add Playwright smoke tests for public gameplay and protected admin flows.
- [ ] Verify public and authenticated phrase responses are never cached.
- [ ] Verify database failures surface meaningful errors and never silently replace valid configuration.
- [ ] Review narrow-screen layout, keyboard operation, focus visibility, and accessible state announcements.
- [ ] Run lint, TypeScript checking, unit/component/integration tests, Playwright smoke tests, and production build; resolve failures without weakening tests or checks.

## Phase 8: Deployment readiness

- [ ] Document local setup, Supabase project/schema configuration, safe seeding, required environment variables, and admin secret generation in the README.
- [ ] Document Vercel environment setup and separate production credentials from preview/development projects.
- [ ] Verify the app builds using production settings and document a production smoke-test checklist for the game, login, phrase save, and newly generated cards.
- [ ] Leave live Supabase provisioning, production data seeding, and Vercel deployment to an operator with the required credentials.

## Completion checklist

- [ ] All applicable scenarios in [docs/tests.md](docs/tests.md) pass.
- [ ] No card or player progress is persisted between page loads.
- [ ] Admin data and endpoints are server-protected; private credentials are absent from client bundles.
- [ ] Lint, typecheck, automated tests, browser smoke tests, and production build pass.
- [ ] Local setup and deployment instructions are complete and accurate.
