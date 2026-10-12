# Email Storm Bingo

A bingo game for the next reply-all storm. Built with Next.js App Router, strict
TypeScript, and Tailwind CSS.

Phase 1 provides the responsive app shell and development/test tooling. Card
generation, gameplay, Supabase persistence, and admin authentication are planned
in [implementation.md](implementation.md). The current page is a coming-soon
screen and does not require credentials or a database.

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

Open <http://localhost:3000>. The environment values can stay empty for phase 1.
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

`.env.example` lists the variables reserved for later phases:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server-side database credential |
| `ADMIN_PASSWORD_HASH` | Argon2id hash of the admin password |
| `ADMIN_SESSION_SECRET` | Independent random secret for signing admin sessions |

Keep real values in `.env.local` or the hosting environment. Local environment
files are ignored; only `.env.example` is committed. Never use `NEXT_PUBLIC_`
for these variables or put secrets in the `env` property of `next.config.ts`.
Server features should read configuration through `src/lib/env.ts`, which uses
`server-only` to make client imports fail at build time. It validates required
values when called, rather than when the shell loads. Do not pass its returned
secrets to client components or public responses.

Supabase provisioning, seeding, and Vercel deployment are outside phase 1 and
remain operator tasks.

## Project layout

- `src/app/`: shared layout, global styles, and public page.
- `src/lib/`: server configuration and future domain modules.
- `tests/`: unit/component tests and setup.
- `tests/e2e/`: browser smoke tests.
- `docs/architecture.md`: application design.
- `docs/tests.md`: acceptance scenarios for subsequent phases.
