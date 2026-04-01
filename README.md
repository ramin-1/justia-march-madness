# march-madness-tracker

Company March Madness bracket challenge app with:

- public leaderboard
- public read-only bracket pages
- protected admin entry management
- manual results management + NCAA sync
- multi-bracket support: `MAIN`, `SECOND_CHANCE_S16`, `CHAMPIONSHIP`

## Current scope (Milestones 1–8)

- Route shell + shared nav
- Admin auth (Auth.js credentials)
- Prisma/PostgreSQL persistence
- Entry CRUD with bracket-type-aware naming and duplicate prevention per participant/type
- Bracket editor + public bracket viewer for all three bracket products
- Scoring + leaderboard tabs/views for all bracket products
- Admin results management (final-only completion model)
- NCAA sync into canonical `Game` rows
- Manual team-slot override management
- UX polish: responsive cleanup, print-friendly bracket view, loading/error/not-found states

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Auth.js credentials
- Zod

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template and fill values:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

4. Seed canonical game + sample data (optional but recommended for local testing):

```bash
npm run db:seed
```

5. Start dev server:

```bash
npm run dev
```

## Environment variables

See `.env.example` for the full list. Required for normal local usage:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`

Recommended:

- `AUTH_TRUST_HOST=true` (especially in hosted environments)

NCAA sync optional overrides:

- `NCAA_SCORES_URL`
- `NCAA_SCORES_BASE_URL`
- `NCAA_SCORES_DATE`
- `NCAA_SCORES_TIMEZONE`
- `NCAA_SCORES_FETCH_TIMEOUT_MS` (default `15000`)

### `ADMIN_PASSWORD_HASH` format

`ADMIN_PASSWORD_HASH` must be a bcrypt hash in `.env`.

Next.js expands `$` in `.env` values, so escape literal dollar signs as `\$`.

Example:

```env
ADMIN_PASSWORD_HASH="\$2b\$10\$..."
```

## Commands

- `npm run dev` - local dev server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run sync:results` - manual NCAA sync CLI run

## Core routes

Public:

- `/leaderboard`
- `/bracket/[id]`

Protected admin:

- `/login`
- `/entries`
- `/entries/new`
- `/entries/[id]/edit`
- `/admin/results`
- `/admin/team-slots`

## Operational workflows

### Admin entry management

1. Log in at `/login`
2. Use `/entries` for list/search/delete
3. Use `/entries/new` to create entries
4. Use `/entries/[id]/edit` to update existing entries

Duplicate protection:

- A participant can only have one entry per bracket type.
- Valid combination remains one each of `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP`.

### Results management

- `/admin/results` is the canonical admin workflow for manual winner/status/score entry.
- Completion status semantics are final-only:
  - unfinished: `pending`, `in_progress`
  - completed/scored: `final`

### NCAA sync

- Sync writes into canonical `Game` rows (importer model), then recalculates standings.
- Manual admin results remain the fallback/override path.
- Trigger via:
  - CLI: `npm run sync:results`
  - UI: `/admin/results` -> `Sync NCAA Results`

## Print-friendly bracket views

Open `/bracket/[id]` and use `Print Bracket` (or browser print). Print styling hides app chrome and keeps matchup/pick/result cards readable.

## Deployment notes

Before launching:

1. Set production env vars (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, optionally sync overrides).
2. Run migrations against production DB:
   - `npm run db:generate`
   - `npm run db:migrate`
3. Verify admin login works.
4. Verify `/leaderboard`, `/bracket/[id]`, `/entries`, `/admin/results`, and `/admin/team-slots`.
5. Run sync once and confirm `SyncRun` + leaderboard updates.
6. Confirm printing a bracket page from `/bracket/[id]`.

## Important project docs

- `PROJECT_SPEC.md` - milestone scope + product requirements
- `AGENTS.md` - repo-level implementation rules
- `docs/multi-bracket-alignment.md` - architecture alignment notes
- `tasks/todo.md` - non-trivial task execution log
- `tasks/lessons.md` - recurring mistake guardrails
