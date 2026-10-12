# Email Storm Bingo

A bingo game for the next reply-all storm. Built with Next.js App Router, strict
TypeScript, and Tailwind CSS.

Phases 1–3 provide the app shell, tested bingo domain logic, Supabase persistence,
and the public phrase API. Gameplay and admin authentication follow in
[docs/implementation.md](docs/implementation.md). The current page is a coming-soon
screen; `/api/phrases` requires a configured, migrated, seeded database.

## Prerequisites

- Node.js 24 LTS (recommended; `.nvmrc` is included), or Node.js 22.12+.
- npm, bundled with Node.js.
- For browser tests: Playwright Chromium and its system dependencies.

## Local setup

```sh
# If you use nvm:
nvm install
nvm use

npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The environment values can stay empty for the shell.
The app uses system fonts, so builds do not need to download fonts.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint with no warnings allowed |
| `npm run typecheck` | Generate Next.js route types and check strict TypeScript |
| `npm test` | Run Vitest unit and React Testing Library component tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright in desktop and 320px mobile viewports |
| `npm run seed` | Initialize an empty database with 30 phrases; preserve existing configuration |

Install the browser before the first end-to-end run:

```sh
npx playwright install chromium
# On Linux, if required system libraries are missing:
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright starts and stops its own development server at
`http://127.0.0.1:3100`; leave that port available. Browser reports and traces are
ignored by Git. Vitest discovers `tests/**/*.test.{ts,tsx}`; Playwright discovers
the separate `tests/e2e/` directory.

To check the production server locally:

```sh
npm run build
npm start
```

Run lint and typecheck separately as part of verification; the production build
does not replace those checks.

Dependency audit note (October 12, 2026): npm reports five high-severity entries
from one `braces` advisory in the Next.js ESLint dependency tree. The offered
automatic fix downgrades `eslint-config-next` to a different Next.js major; it
has not been applied. Recheck this development-tooling dependency when updating
packages.

## Server configuration

`.env.example` lists the server configuration:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server-side database credential |
| `ADMIN_PASSWORD_HASH` | Argon2id hash of the admin password (phase 5) |
| `ADMIN_SESSION_SECRET` | Independent random secret for signing admin sessions (phase 5) |

Keep real values in `.env.local` or the hosting environment. Local environment
files are ignored; only `.env.example` is committed. Never use `NEXT_PUBLIC_`
for these variables or put secrets in the `env` property of `next.config.ts`.
Server features should read configuration through `src/lib/env.ts`, which uses
`server-only` to make client imports fail at build time. It validates required
values when called, rather than when the shell loads. Do not pass its returned
secrets to client components or public responses.

Database access uses `getDatabaseEnv()` and does not require admin secrets.
`src/lib/supabase.ts` creates a server-only service-role client, disables session
persistence and automatic retries, and applies a ten-second request timeout and
`no-store` to database fetches.

## Supabase setup and safe seeding

Provision a development Supabase project separately from production. As the
database owner, apply the SQL files in `supabase/migrations/` in filename order
using the Supabase SQL editor (or your existing Supabase CLI migration workflow):

1. `202610120001_persistence.sql` creates the singleton configuration, private
   login-attempt storage, and restricted database functions.
2. `202610120002_login_attempts_cleanup.sql` enables Supabase's `pg_cron` extension
   and schedules expired login-attempt cleanup every minute. Verify the job
   `bingo-purge-expired-login-attempts` appears in the dashboard's Cron jobs.

The tables have row-level security enabled and no public policies. `anon` and
`authenticated` cannot read or write either table or execute mutation functions.
Only server-side code uses the service-role credential. Do not add public table
policies to make the phrase API work; it reads on the server.

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, confirm they
target the intended project, then run:

```sh
npm run seed
```

The command validates `data/initial-phrases.json` and inserts version 1 only when
the singleton does not exist. Repeated or simultaneous runs preserve existing
phrases, version, and timestamp. It never resets a populated database. An error
exits nonzero without exposing database details. It uses Next.js environment
loading rules; exported variables take precedence. For production environment
file precedence, run `NODE_ENV=production npm run seed`.

`GET /api/phrases` returns `{ "version": 1, "phrases": ["..."] }` with
`Cache-Control: no-store`. No query parameters or request body are required.
Missing credentials, an unseeded database, corrupt data, and database failures
return `503` with an uncached retry message; there are no fallback phrases.

The repository's `update(phrases, expectedVersion)` method validates input and
uses a single conditional database update to increment the version and set the
timestamp. Stale writes throw `PhraseConflictError`, ready for the phase 6 admin
API to map to `409`. `PhraseStorageError` distinguishes unavailable storage,
uninitialized configuration, and invalid stored data. There is no public write API.

Login-attempt storage holds one HMAC-SHA256 client identifier and a counter capped
at five per client, with at most a 15-minute expiry. It never stores raw IPs.
Expired rows are purged within the next minute while Cron is running. Phase 5
will implement keyed hashing and atomic rate-limit enforcement against this table.

`npm test` runs the core migration against embedded Postgres (PGlite), checking
persistence, constraints, role privileges, stale writes, seed safety, and expiry
cleanup. Repository tests use the real Supabase SDK with mocked HTTP responses;
route tests verify response validation, error handling, and caching headers.
PGlite serializes queries; the suite does not simulate separate Postgres
connections or run the hosted PostgREST gateway or `pg_cron` scheduler. Verify
those integrations against a disposable Supabase project before deployment.

Live Supabase provisioning, migration application, production seeding, and Vercel
deployment remain operator tasks. See [ADR-001](docs/ADRs/ADR-001.md) for the
persistence decisions and upstream documentation.

## Project layout

- `src/app/`: shared layout, global styles, and public page.
- `src/lib/`: bingo logic, validation, server configuration, and phrase repository.
- `supabase/migrations/`: database schema, restricted functions, and expiry cleanup.
- `data/` and `scripts/seed.ts`: initial phrases and safe initialization command.
- `tests/`: unit/component tests and setup.
- `tests/e2e/`: browser smoke tests.
- `docs/architecture.md`: application design.
- `docs/tests.md`: acceptance scenarios for subsequent phases.
