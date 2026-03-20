# AGENTS.md

## Repository purpose

This repository powers a company March Madness bracket challenge with:

- a public leaderboard
- public read-only bracket pages
- a password-protected admin area for entry CRUD
- automated NCAA result syncing plus manual result override
- a bracket layout that matches the uploaded 2026 NCAA bracket format

## First files to read for any non-trivial task

1. `PROJECT_SPEC.md`
2. `tasks/todo.md`
3. `tasks/lessons.md`

## Working style

For any task that is 3 or more steps, involves architecture, or changes behavior across multiple files:

1. enter planning mode first
2. update `tasks/todo.md` with a concrete checklist
3. implement in small verifiable steps
4. update the checklist as progress is made
5. verify before claiming completion
6. capture any repeated mistake or user correction in `tasks/lessons.md`

Use the vendored workflow reference in `.claude/skills/workflow-orchestration/` as the planning template.

## Project constraints

- Keep the public leaderboard and bracket viewing routes public.
- Keep `/entries`, `/entries/new`, `/entries/[id]/edit`, and `/admin/results` admin-only.
- Use Prisma models as the source of persistence.
- Keep the local database as the source of truth for game results.
- NCAA syncing is an importer into the local `Game` table, not the canonical source of truth.
- Preserve the ability for an admin to override synced results manually.
- Prefer clear TypeScript types and isolated utility functions.
- Prefer minimal, maintainable changes over over-engineering.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Prisma generate: `npm run db:generate`
- Prisma migrate dev: `npm run db:migrate`
- Prisma seed: `npm run db:seed`
- Manual NCAA sync: `npm run sync:results`

## Definition of done

Before finishing a task:

- run the most relevant checks
- confirm the affected route or behavior works
- make sure docs stay aligned with reality
- update `tasks/todo.md` review notes if the task was non-trivial

## Code organization

- `app/` - routes and route handlers
- `components/` - reusable UI
- `lib/` - domain logic, data helpers, auth helpers, score calculation, sync logic
- `prisma/` - schema and seed logic
- `tasks/` - planning and lessons
- `docs/` - implementation notes that humans and agents can both follow
