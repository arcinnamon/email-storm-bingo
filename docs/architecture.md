# Bingo App Architecture

## Overview

This project is a small, public-facing bingo app with a protected admin workflow. Players use a shared 5×5 card and mark squares locally in the browser. The application stores only the shared phrase list in the database; card state and marked cells stay in browser memory and are reset on reload. Major architectural decisions need to be logged as incremental Architecture Decisions Records (ADRs) in the ADRs subfolder. Those ADRs need to be named and numbered like ADR-001.md, ADR-002.md, etc.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Vercel hosting
- Vitest + React Testing Library + Playwright

## Core design

### 1. Player experience

- Public route at `/`
- 5×5 board with a permanent free space in the center
- Exactly 24 unique phrases selected from the shared list
- Mark/unmark interaction via semantic button elements
- Automatic detection of rows, columns, and diagonals
- Randomize action that reshuffles and clears previous marks
- No login required for players

### 2. Shared configuration

The phrase list belongs to the shared app state, not to a player session. The app stores a single canonical configuration in Supabase and pulls the newest version whenever a new board is generated.

Recommended table shape:

- `bingo_config`
  - `id`
  - `version`
  - `updated_at`
  - `phrases` (JSON or array field)
- `login_attempts`
  - `id`
  - `ip_address`
  - `failed_at`

### 3. Admin experience

- Protected admin route at `/admin`
- Separate login flow at `/admin/login`
- One server-side admin password
- Signed HttpOnly cookie for authenticated admin sessions
- 24-hour session lifetime
- Multiline phrase editor with one phrase per line
- Save validation and optimistic conflict handling via `expectedVersion`

## Security model

- Admin authentication is enforced server-side, not via UI-only checks
- Passwords are never stored in plaintext
- Use `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` in environment variables
- Rate limiting is enforced against a Supabase-backed `login_attempts` table
- Protected endpoints reject unauthenticated requests with `401`
- Stale admin writes are rejected with `409`

## API surface

- `GET /api/phrases` — public, returns current shared phrase list
- `POST /api/admin/login` — public, rate-limited
- `GET /api/admin/phrases` — admin-only, returns config
- `PUT /api/admin/phrases` — admin-only, validates and writes new list
- `POST /api/admin/logout` — admin-only, clears session cookie

All phrase and protected-admin responses should use `Cache-Control: no-store`.

## Game logic

Keep all game logic in pure TypeScript so it can be unit-tested without the UI.

Recommended module layout:

- `src/lib/bingo.ts`
  - `generateCard(phrases)`
  - `findWinningLines(marked)`
  - toggle logic
  - normalization helpers

Rules:

- 25 total cells
- Free space fixed at index 12
- Unique phrases only
- Winning lines include all 5 rows, 5 columns, and 2 diagonals
- Winning state is derived from marked squares

## Data flow

1. Public page loads
2. Fetch phrase list from `/api/phrases`
3. Generate a new randomized card from the shared list
4. Player marks squares in browser state
5. Board recomputes win state after each toggle
6. Admin updates shared phrases in Supabase
7. New cards use the latest approved list

## Environment variables

Required server-side variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`

Keep all secret values out of the client bundle and never commit local `.env` files.

## Recommended project structure

```text
bingo-app/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   └── login/page.tsx
│   │   └── api/
│   │       ├── phrases/route.ts
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
│   │   ├── auth.ts
│   │   ├── phrases.ts
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
├── README.md
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Implementation phases

1. Scaffold Next.js app and basic layout
2. Implement pure bingo logic and tests
3. Build player UI and board interactions
4. Add Supabase integration for shared phrase list
5. Build admin authentication and protected endpoints
6. Add phrase editor and validation
7. Run integration tests and browser smoke tests
8. Deploy on Vercel

## Success criteria

The app is successful when:

- Players can generate and play a valid bingo card without logging in
- Admin password protection works on protected endpoints
- Shared phrase updates persist and affect newly generated boards
- Validation rejects invalid phrase lists
- Automated tests cover gameplay and auth flows
- Production deployment works cleanly on Vercel
