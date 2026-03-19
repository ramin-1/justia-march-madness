# justia-march-madness

A scaffolded Next.js + TypeScript repository for building a company-wide March Madness bracket challenge.

## Product goals

- Public leaderboard with clickable entry names
- Public read-only bracket pages for each entry
- Password-protected admin entry management
- Daily NCAA result syncing with manual admin override
- Bracket UI that follows the uploaded 2026 NCAA bracket format

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Auth.js credentials login
- Zod validation

## Quick start

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Important project files

- `project_spec.md` - product scope, milestones, architecture, and sync plan
- `AGENTS.md` - Codex instructions for working in this repository
- `tasks/todo.md` - active execution plan for non-trivial work
- `tasks/lessons.md` - recurring mistakes and guardrails
- `.agents/skills/workflow-orchestration/` - vendored workflow skill reference used as the planning pattern

## Core routes

- Public: `/leaderboard`, `/bracket/[id]`
- Admin scaffolds: `/login`, `/entries`, `/entries/new`, `/entries/[id]/edit`, `/admin/results`

## Milestone 2 status

- Shared app shell and navigation are in place for all scaffold routes.
- Admin routes are now protected by Auth.js credentials login.
- Prisma is wired to PostgreSQL via `DATABASE_URL` in environment config.

## Admin auth setup

- Set `AUTH_SECRET` in `.env`.
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` in `.env`.
- `ADMIN_PASSWORD_HASH` should be a bcrypt hash stored in `.env`.
- Next.js expands `$` values in `.env`, so escape literal dollar signs in bcrypt hashes as `\$`.
- Example:

```env
ADMIN_PASSWORD_HASH="\$2b\$10\$..."
```

- After starting the app, use `/login` and sign in to access `/entries*` and `/admin/results`.

## Notes on result syncing

Automated result syncing should be treated as an importer into the local `Game` table, not the source of truth itself. The admin results page remains the fallback whenever parsing or matching fails.
