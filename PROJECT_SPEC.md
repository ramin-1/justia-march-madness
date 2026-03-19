# Project Specification - March Madness Company Challenge

## Goal

Build a company March Madness bracket challenge website with a public leaderboard, public read-only bracket viewing, and a password-protected admin area for managing multiple entries.

## Core product requirements

### Public pages
- **Leaderboard** showing:
  - rank
  - entry name
  - participant name
  - current score
  - optional max remaining points
- Entry names must be clickable and open the corresponding read-only bracket view.
- Individual bracket pages must render in the same general single-page NCAA bracket structure as the uploaded 2026 bracket PDF.

### Admin pages
- **Entries**
  - list all entries
  - clickable names
  - add bracket button
  - edit entry
  - delete entry
- Access to admin pages must be password-protected.
- Admin must have a **Results** page to manually set actual winners and correct sync mistakes.

## Scoring rules

- Play-In wins = 1 point
- First Round wins = 2 points
- Second Round wins = 4 points
- Sweet Sixteen wins = 8 points
- Elite Eight wins = 16 points
- Final Four wins = 32 points
- Championship win = 64 points

## Recommended stack

- **Frontend / full-stack app:** Next.js App Router + TypeScript
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui as needed
- **Database:** PostgreSQL
- **ORM / data access:** Prisma
- **Authentication:** Auth.js credentials provider
- **Validation:** Zod
- **Hosting:** Vercel
- **Scheduled sync jobs:** Vercel Cron or a similar scheduled runner

## Architecture

### Public surface
- `/leaderboard`
- `/bracket/[id]`

### Protected admin surface
- `/login`
- `/entries`
- `/entries/new`
- `/entries/[id]/edit`
- `/admin/results`

### Core data model

#### Entry
- `id`
- `name`
- `participantName`
- `picksJson`
- `totalScore`
- `maxPossibleScore`
- `createdAt`
- `updatedAt`

#### Game
- `id`
- `round`
- `region`
- `slotLabel`
- `homeTeam`
- `awayTeam`
- `winnerTeam`
- `status`
- `scheduledDate`
- `syncSource`
- `lastSyncedAt`

#### SyncRun
- `id`
- `source`
- `startedAt`
- `finishedAt`
- `status`
- `summaryJson`

### Core design decisions

1. **Database is the source of truth**
   - The app stores all bracket entries and game outcomes locally.
   - External sync imports update local rows instead of bypassing them.

2. **Picks are keyed by canonical game IDs**
   - Example IDs:
     - `PLAYIN_G1`
     - `EAST_R1_G1`
     - `WEST_S16_G1`
     - `FINAL4_G1`
     - `CHAMPIONSHIP_G1`
   - This keeps scoring deterministic.

3. **Bracket UI is fixed-layout**
   - Use a bracket configuration file and a deterministic layout component.
   - Do not rely on a generic bracket tree widget.

4. **Admin override remains mandatory**
   - Automated syncing should never be the only way to set winners.

## Automated result syncing plan

### Source
Use the public NCAA March Madness scores page as a best-effort sync source.

### Sync strategy
- Scheduled job fetches the scores page.
- Parse completed games and extract:
  - team names
  - final score
  - completion status
  - game date when available
- Match parsed games to internal canonical `Game` records.
- Update `winnerTeam`, `status`, and `lastSyncedAt`.
- Recalculate all entry scores after updates.
- Record each sync attempt in `SyncRun`.

### Matching rules
- Normalize team names before matching.
- Maintain a manual alias map for known naming mismatches.
- Match on:
  - normalized team names
  - round
  - date when available
  - region or slot if inferable

### Reliability rules
- Sync must be idempotent.
- If parsing or matching is ambiguous, skip the update and flag it for admin review.
- Never overwrite a manual admin correction without an explicit rule allowing it.
- Expose `last synced at` and sync status in the admin UI.

### Update cadence
- During active tournament windows: poll more frequently.
- Otherwise: run once daily.
- Manual admin result entry always remains available.

## Milestones

### Milestone 1 - Project setup and app shell
Deliver:
- Next.js + TypeScript scaffold
- Tailwind setup
- route skeletons
- shared layout and nav

Done when:
- app boots locally
- base routes render

### Milestone 2 - Database and admin authentication
Deliver:
- Prisma schema
- PostgreSQL connection
- Auth.js credentials login
- route protection for admin pages

Done when:
- admin pages are protected
- core tables exist

### Milestone 3 - Entry CRUD
Deliver:
- entries list
- add bracket flow
- edit bracket flow
- delete bracket flow
- validation

Done when:
- entries can be created, edited, deleted, and persisted

### Milestone 4 - Bracket renderer / editor
Deliver:
- fixed-layout bracket component
- read-only mode
- edit mode
- canonical bracket config

Done when:
- bracket resembles the uploaded NCAA layout
- picks can be viewed and edited

### Milestone 5 - Scoring engine and leaderboard
Deliver:
- score calculation utility
- ranking logic
- leaderboard page
- max remaining points logic

Done when:
- leaderboard accurately reflects local game outcomes

### Milestone 6 - Admin results page
Deliver:
- grouped game management UI
- manual winner selection
- score recalculation trigger

Done when:
- admin can fully manage results without touching the database directly

### Milestone 7 - NCAA result syncing
Deliver:
- parser for NCAA public scores page
- team alias normalization
- sync logging
- manual trigger endpoint
- scheduled sync support
- admin sync status display

Done when:
- completed game results can be imported safely into the local database
- failures are visible and recoverable through admin tooling

### Milestone 8 - Polish and deployment
Deliver:
- responsive leaderboard
- print-friendly bracket page
- loading / empty / error states
- README and deployment docs
- production deploy configuration

Done when:
- the app is usable for a real company challenge

## Initial Codex execution sequence

1. Scaffold app shell
2. Add Prisma and auth
3. Build entry CRUD
4. Build bracket layout
5. Build scoring
6. Build admin results page
7. Add NCAA sync
8. Polish and deploy

## Guardrails for implementation

- Keep business logic in `lib/`, not inside page components.
- Separate UI layout from score logic and sync logic.
- Keep sync parsing defensive.
- Prefer explicit config files over implicit string matching scattered across the app.
- Add tests around score calculation and result matching.
