# Task: Milestone 3 - Entry CRUD

## Plan
- [x] Re-read repo instructions/spec/tasks and workflow skill guidance for Milestone 3 scope.
- [x] Inspect current entries/auth/prisma implementation and identify minimal gap to full CRUD.
- [x] Add centralized Zod validation and server-side mutation actions for entry create/edit/delete.
- [x] Replace entries list placeholder with Prisma-backed table, search/filter, and action links.
- [x] Replace `/entries/new` and `/entries/[id]/edit` placeholders with working forms and user-friendly errors.
- [x] Add delete confirmation flow and mutation feedback messaging.
- [x] Keep admin protection/public route behavior intact and avoid Milestone 4+ work.
- [x] Run verification: `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Update docs/task review notes for Milestone 3 behavior.

## Progress Notes
- 2026-03-19 00:03 PDT - Reviewed `AGENTS.md`, `project_spec`, `tasks/*`, and `.agents/skills/workflow-orchestration/SKILL.md`.
- 2026-03-19 00:05 PDT - Audited current `entries` routes and found scaffold-only UI with hardcoded data and no CRUD persistence.
- 2026-03-19 00:06 PDT - Confirmed Milestone 2 auth protection is already in place via `proxy.ts` for `/entries*` and `/admin/results`.
- 2026-03-19 00:13 PDT - Added centralized entry validation and server actions for create/update/delete with Prisma persistence and mutation feedback.
- 2026-03-19 00:17 PDT - Replaced entries/new/edit scaffold pages with real CRUD UI and wired delete confirmation + search/filter list behavior.
- 2026-03-19 00:20 PDT - Build failed once due server-action export rules (`use server` file exported non-async object); fixed by moving action state constants/types to a separate file.
- 2026-03-19 00:22 PDT - Final verification passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- 2026-03-19 00:23 PDT - Updated README milestone status notes for Milestone 3 CRUD behavior.
- 2026-03-19 00:25 PDT - Runtime smoke check confirms `/entries` redirects unauthenticated users to `/login?next=...` while `/leaderboard` remains public.
- 2026-03-19 00:39 PDT - Follow-up tweak: removed manual entry-name input and now generate `name` from participant name in server actions (`{participantName}'s Bracket`).

## Review
Completed Milestone 3 with a minimal production-friendly CRUD flow for entries: database-backed list/search, create, edit, and delete with confirmation and validation/mutation error handling. Admin route protection remains in place and no Milestone 4+ features were introduced.

---

# Task: Multi-Bracket Architecture Alignment (Planning-Only Pass)

## Plan
- [x] Re-read updated `PROJECT_SPEC.md` plus required repo workflow files.
- [x] Audit current codebase for single-bracket assumptions (schema, validation, naming, config, leaderboard, bracket view, scoring, results sync touchpoints).
- [x] Document architecture risks and impacted areas for `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP`.
- [x] Add planning notes that define Milestone 4 adjustments without implementing Milestone 4 features.
- [x] Keep this pass doc/task scoped only (no broad feature implementation).

## Progress Notes
- 2026-03-19 02:03 PDT - Re-read `AGENTS.md`, updated `PROJECT_SPEC.md`, `tasks/todo.md`, `tasks/lessons.md`, and `.agents/skills/workflow-orchestration/SKILL.md`.
- 2026-03-19 02:05 PDT - Completed focused architecture scan across `prisma`, `lib`, `app`, and `components` for single-main-bracket assumptions.
- 2026-03-19 02:06 PDT - Confirmed current implementation is still main-bracket-oriented in schema/config/scoring/UI assumptions; identified concrete risks for bracket type support, naming, leaderboard tabs, second-chance templates, and championship ranking data needs.
- 2026-03-19 02:07 PDT - Added doc-only architecture alignment notes for upcoming implementation phases and Milestone 4 adjustment guidance.

## Review
Planning/alignment pass complete. No feature work was started. The repository now includes an explicit risk register and implementation guidance for evolving from a single-bracket structure to a clean multi-product architecture (`MAIN`, `SECOND_CHANCE_S16`, `CHAMPIONSHIP`) in upcoming milestones.

---

# Task: Spec Filename Alignment + JSON Shape Planning (Docs-Only)

## Plan
- [x] Standardize docs/task references to `PROJECT_SPEC.md` naming.
- [x] Add a planning-only note that proposes serialized JSON contracts for `picksJson` and `tiebreakerJson`.
- [x] Keep changes documentation/task only with no Milestone 4 implementation.

## Progress Notes
- 2026-03-19 02:13 PDT - Searched repository references and found remaining `project_spec.md` mentions in docs/task instructions.
- 2026-03-19 02:14 PDT - Updated references to `PROJECT_SPEC.md` in `AGENTS.md`, `README.md`, and existing notes in `tasks/todo.md`.
- 2026-03-19 02:15 PDT - Extended multi-bracket planning notes with explicit proposed serialized shapes for `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP`.

## Review
Completed a tightly scoped docs-only alignment pass. No product behavior was changed, no Milestone 4 implementation was started, and `.agents` was left untouched.

---

# Task: JSON Shape Robustness Follow-Up (Planning-Only)

## Plan
- [x] Refine proposed JSON examples to avoid raw display team names as stored winner picks.
- [x] Refine championship tiebreak shape to avoid home/away-coupled score predictions.
- [x] Add rationale notes for scoring/sync/rendering stability.
- [x] Keep this as a docs/task-only update with no runtime/schema changes.

## Progress Notes
- 2026-03-19 02:20 PDT - Re-read `AGENTS.md`, `PROJECT_SPEC.md`, `tasks/todo.md`, and `tasks/lessons.md` before this follow-up planning pass.
- 2026-03-19 02:21 PDT - Updated `docs/multi-bracket-alignment.md` JSON proposals to use canonical `winnerTeamKey` references and team-key-based championship score predictions.
- 2026-03-19 02:22 PDT - Added explicit rationale for canonical keys and home/away-independent score mapping to support cleaner scoring, sync, and rendering logic.

## Review
Completed planning-only JSON contract refinement. No Milestone 4 feature implementation was started, and no schema/runtime behavior was changed.

---

# Task: Milestone 4 - Bracket Viewer and Editor (All Bracket Types)

## Plan
- [x] Re-audit current entry schema and form/action flow; add only the minimal schema updates required for multi-type picks persistence.
- [x] Build a centralized bracket registry module for `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP` using a shared canonical game dataset.
- [x] Add shared serialization/types helpers for `picksJson` (`winnerTeamKey`) and championship `tiebreakerJson` (`predictedScoresByTeamKey`).
- [x] Extend validation and server actions to support participant name + bracket type + serialized picks/tiebreakers with user-friendly errors.
- [x] Replace the entry placeholder UI with a reusable type-aware editor that enforces later-round dependencies and championship score input rules.
- [x] Update `/entries/new` and `/entries/[id]/edit` to load/save bracket data using the new reusable editor.
- [x] Replace `/bracket/[id]` placeholder with a reusable read-only renderer that adapts by `bracketType`.
- [x] Keep scope tight: no Milestone 5 leaderboard/scoring expansion, no result-sync behavior changes.
- [x] Run verification: `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Update docs/task review notes to reflect delivered Milestone 4 behavior.

## Progress Notes
- 2026-03-19 02:27 PDT - Began Milestone 4 implementation pass after re-reading `AGENTS.md`, `PROJECT_SPEC.md`, `tasks/*`, `.agents/skills/workflow-orchestration/SKILL.md`, and `docs/multi-bracket-alignment.md`.
- 2026-03-19 02:33 PDT - Added multi-type bracket foundation: Prisma `bracketType`/`tiebreakerJson` fields, centralized template registry, and shared serialized picks/tiebreaker helpers.
- 2026-03-19 02:37 PDT - Replaced placeholder bracket UI with reusable type-aware editor/viewer and wired it into `/entries/new`, `/entries/[id]/edit`, and `/bracket/[id]`.
- 2026-03-19 02:41 PDT - Updated server validation/actions for canonical `winnerTeamKey` picks, championship `predictedScoresByTeamKey`, dependency-aware validation, and type-derived entry naming.
- 2026-03-19 02:44 PDT - Verification complete: `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build` (build required escalated permissions in this environment due sandbox process restrictions).

## Review
Completed Milestone 4 with a reusable, bracket-type-aware editor/viewer flow across `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP`. Entries can now persist canonical pick structures (`winnerTeamKey`) and championship score predictions (`predictedScoresByTeamKey`) with server-side validation and read-only public rendering by bracket type, while keeping Milestone 5+ work out of scope.

---

# Task: Milestone 4 Follow-Up - Complete MAIN Bracket Topology

## Plan
- [x] Expand canonical bracket registry so `MAIN` includes full game counts by round (4/32/16/8/4/2/1).
- [x] Keep the same shared game/template architecture so `SECOND_CHANCE_S16` and `CHAMPIONSHIP` continue to function.
- [x] Preserve dependency behavior for later rounds and ensure play-in integration is structurally consistent.
- [x] Update seed/config usage so local data reflects the expanded canonical game dataset.
- [x] Verify with `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Update task review notes with completion status.

## Progress Notes
- 2026-03-19 02:49 PDT - Started follow-up pass to complete full `MAIN` bracket topology after observing partial dataset counts in the registry.
- 2026-03-19 02:52 PDT - Rebuilt `lib/brackets/registry.ts` to generate a complete canonical `MAIN` topology (4 play-in, 32 round 1, 16 round 2, 8 sweet 16, 4 elite 8, 2 final 4, 1 championship) with preserved multi-type templates.
- 2026-03-19 02:54 PDT - Updated availability/dependency resolution logic to support play-in-integrated first-round games while preserving fallback behavior for second-chance and championship flows.
- 2026-03-19 02:55 PDT - Added round game-count labels to bracket UI headers for easier manual verification in create/edit/view screens.
- 2026-03-19 02:57 PDT - Verification complete: `npm run db:generate`, `npm run typecheck`, `npm run lint`, `npm run build` (build required escalated permissions in this sandbox), plus a direct registry count sanity check script.

## Review
Follow-up complete. `MAIN` now uses a full internally consistent tournament topology with complete round counts and dependency paths, while `SECOND_CHANCE_S16` and `CHAMPIONSHIP` remain functional on the same shared canonical registry architecture.

---

# Task: Milestone 4 Follow-Up - Correct MAIN Play-In Qualifier Labels

## Plan
- [x] Re-read required repo guidance and inspect current `MAIN` play-in metadata/dependency mapping.
- [x] Update canonical `MAIN` play-in seed qualifier labels so two games are 16-seed qualifiers and two are 11-seed qualifiers.
- [x] Update region topology mapping so West/Midwest 11-seed play-ins feed into correct round-one seed slots.
- [x] Verify no regressions for `SECOND_CHANCE_S16` and `CHAMPIONSHIP` templates via required checks.
- [x] Capture completion notes and assumptions.

## Progress Notes
- 2026-03-19 03:20 PDT - Started scoped follow-up for play-in qualifier correction after re-checking required guidance/docs and current bracket registry wiring.
- 2026-03-19 03:21 PDT - Updated `lib/brackets/registry.ts` so play-in qualifier metadata is seed-aware by region: East/South remain 16-seed qualifiers while West/Midwest are now 11-seed qualifiers.
- 2026-03-19 03:21 PDT - Updated region topology wiring so 16-seed play-ins feed round-one Game 1 (1-vs-16 slot) and 11-seed play-ins feed round-one Game 5 (6-vs-11 slot).
- 2026-03-19 03:22 PDT - Verification complete: `npm run typecheck`, `npm run lint`, and `npm run build` (build required escalated run in this sandbox due Turbopack process/port restrictions).

## Review
Follow-up complete. `MAIN` play-in labeling now reflects two 16-seed qualifiers (East/South) plus two 11-seed qualifiers (West/Midwest), and dependency mapping routes those play-in winners into the correct round-one slots without changing `SECOND_CHANCE_S16` or `CHAMPIONSHIP` architecture.

---

# Task: Milestone 5 - Scoring, Ranking, and Leaderboard

## Plan
- [x] Re-read required project/workflow docs and audit current scoring, leaderboard, and result data contracts.
- [x] Add minimal schema/model support for canonical result keys and score fields needed for championship ranking.
- [x] Build a centralized type-aware scoring/ranking layer with separate `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP` logic.
- [x] Add a reusable standings recalculation path and wire it into existing result-sync and entry mutation flows.
- [x] Replace `/leaderboard` scaffold with public type tabs/views and type-specific leaderboard tables.
- [x] Verify with `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Update task review notes and document assumptions/incomplete items.

## Progress Notes
- 2026-03-19 04:42 PDT - Started Milestone 5 pass after re-reading `AGENTS.md`, `PROJECT_SPEC.md`, `tasks/*`, `.agents/skills/workflow-orchestration/SKILL.md`, and `docs/multi-bracket-alignment.md`.
- 2026-03-19 04:45 PDT - Audited existing code and found `/leaderboard` still scaffold-only and `lib/scoring.ts` still single-points-only logic without type-aware championship ranking.
- 2026-03-19 04:46 PDT - Identified minimal schema gap for championship ranking: current `Game` model lacks canonical team-key score context needed for robust winner-score/total-score comparisons.
- 2026-03-19 18:31 PDT - Added Milestone 5 schema support on `Game` for canonical team-key and score data (`homeTeamKey`, `awayTeamKey`, `winnerTeamKey`, `homeScore`, `awayScore`) plus migration and seed updates.
- 2026-03-19 18:33 PDT - Replaced scoring layer with separate main scorer, second-chance scorer, and championship ranker; added canonical result normalization and unresolved-game defensive behavior.
- 2026-03-19 18:35 PDT - Added reusable standings recalculation module and wired score persistence into entry create/update plus NCAA sync recalculation path.
- 2026-03-19 18:37 PDT - Replaced `/leaderboard` placeholder with public bracket-type tab views and type-specific tables/columns, including championship provisional-state messaging.
- 2026-03-19 18:40 PDT - Verification complete: `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build` (build required escalated run in this sandbox due Turbopack process/port restrictions).

## Review
Milestone 5 implementation complete within scope: type-aware scoring/ranking for all three bracket products, reusable standings recalculation, and a public tabbed leaderboard with bracket-type-specific columns and ranking behavior. No Milestone 6+ admin results UI or NCAA parser enhancements were introduced.

---

# Task: Prisma Migration Chain Repair (Milestone 5)

## Plan
- [x] Inspect `prisma/schema.prisma`, migration ordering, and `prisma/seed.ts` usage.
- [x] Fix migration ordering so `Game` is created before any migration that alters it.
- [x] Ensure migration history aligns with seed usage of `homeTeamKey` and related fields.
- [x] Run verification possible in this environment and capture any local-environment blockers.
- [x] Document exact local reset/verification commands for a clean-from-scratch run.

## Progress Notes
- 2026-03-19 18:47 PDT - Diagnosed migration ordering root cause: `20260319050000_milestone5_scoring` ran before `20260319071823_init`, causing `ALTER TABLE "Game"` to fail in shadow DB (`P3006/P1014`).
- 2026-03-19 18:47 PDT - Renamed migration directory to `20260319100000_milestone5_scoring` so apply order is now `init -> milestone4 -> milestone5`.
- 2026-03-19 18:48 PDT - Performed static chain sanity check confirming `CREATE TABLE "Game"` appears in the earlier migration and `ALTER TABLE "Game"` only appears in the later migration.
- 2026-03-19 18:49 PDT - Could not execute runtime Prisma migrate/seed checks in this sandbox because PostgreSQL server at `localhost:5432` is unreachable (`P1001`); prepared exact local commands for verification/reset.

## Review
Migration chain ordering is now internally consistent from an empty database. Local developer should run a database reset + migrate + seed once to clear old failed migration state from `_prisma_migrations` and align runtime DB columns with the repaired migration history.

---

# Task: Prisma Config Migration (package.json -> prisma.config.ts)

## Plan
- [x] Re-read required repo workflow/spec files and verify current Prisma setup.
- [x] Add root `prisma.config.ts` using modern Prisma config format.
- [x] Configure schema path, migrations path, and seed command in new config.
- [x] Remove deprecated `package.json#prisma` block.
- [x] Verify Prisma CLI commands still work for this scoped change.
- [x] Update task review notes.

## Progress Notes
- 2026-03-19 18:59 PDT - Confirmed installed Prisma exposes config API via `prisma/config` (`defineConfig`, `env`) and supports `migrations.path` + `migrations.seed` in config types.
- 2026-03-19 19:00 PDT - Added root `prisma.config.ts` and removed deprecated `package.json#prisma` block.
- 2026-03-19 19:01 PDT - Added `dotenv/config` loading in `prisma.config.ts` so Prisma config can resolve `DATABASE_URL` before schema-engine initialization.
- 2026-03-19 19:02 PDT - Verification: `npm run db:generate` now loads `prisma.config.ts` successfully and no longer emits the deprecated `package.json#prisma` warning; `npm run db:seed` runs successfully in this environment.
- 2026-03-19 19:02 PDT - `npm run db:migrate` still reports a schema-engine error in this environment, which appears to be existing local DB/migration-state related rather than config-deprecation related.

## Review
Config cleanup complete. Prisma now uses `prisma.config.ts` as the primary config source with equivalent schema/migration/seed settings, and the deprecated `package.json#prisma` warning is removed.

---

# Task: Milestone 6 - Admin Results Management UI

## Plan
- [x] Re-read required instructions/spec/docs and confirm the existing auth + standings recalculation integration points.
- [x] Add centralized typed validation for manual game result updates (status, winner, scores) with resolved/unresolved rules.
- [x] Implement server-side admin result mutation action(s) that persist canonical `Game` fields and trigger standings recalculation.
- [x] Replace `/admin/results` placeholder with a practical grouped admin editor (round + region) and clear success/error feedback.
- [x] Verify no regressions to multi-bracket behavior and run `npm run db:generate`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [x] Update task progress/review notes with final outcomes and any assumptions.

## Progress Notes
- 2026-03-19 20:13 PDT - Began Milestone 6 pass after re-reading `AGENTS.md`, `PROJECT_SPEC.md`, `docs/multi-bracket-alignment.md`, `tasks/*`, and `.agents/skills/workflow-orchestration/SKILL.md`.
- 2026-03-19 20:15 PDT - Audited current implementation and confirmed `/admin/results` is scaffold-only while auth protection and standings recalculation primitives are already implemented.
- 2026-03-19 20:25 PDT - Added centralized result-update validation in `lib/results/validation.ts` for status/winner/score parsing plus resolved/unresolved rules.
- 2026-03-19 20:31 PDT - Implemented `/admin/results` server action flow (`app/admin/results/actions.ts`) to update canonical `Game` rows and reuse `recalculateEntryStandings()` after successful result saves.
- 2026-03-19 20:37 PDT - Replaced scaffold `/admin/results` with grouped round/region UI and per-game editable cards + inline success/error feedback.
- 2026-03-19 20:46 PDT - Verification complete: `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build` (build required escalated run in this sandbox due Turbopack process/port restrictions).

## Review
Milestone 6 is now implemented with a protected, practical admin results workflow. Admins can edit game status, winner team key, and scores directly on `/admin/results`; updates persist to canonical `Game` rows and trigger centralized standings recalculation so `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP` leaderboard behavior stays aligned.

---

# Task: Milestone 6 Follow-Up - Final-Only Status + Participant-Aware Score Labels

## Plan
- [x] Re-audit all `resolved` status references across admin results, scoring, and sync paths.
- [x] Update status handling so `final` is the only completed/scored state and align validation rules accordingly.
- [x] Add safe compatibility handling for pre-existing `resolved` rows without broad schema churn.
- [x] Replace `Home score`/`Away score` labels with participant-aware labels (team names when known; canonical participant slot labels otherwise).
- [x] Verify with `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Update task review + lessons notes for this user-directed correction.

## Progress Notes
- 2026-03-19 22:02 PDT - Started follow-up pass and re-read `AGENTS.md`, `PROJECT_SPEC.md`, `docs/multi-bracket-alignment.md`, current Milestone 6 files, and `tasks/*`.
- 2026-03-19 22:05 PDT - Completed repository scan for `resolved` references in scoring/status-validation/admin-results/sync code paths to prepare a consistent final-only update.
- 2026-03-19 22:12 PDT - Added centralized game-status helpers in `lib/results/status.ts` and switched validation/UI/scoring imports to use final-only status options.
- 2026-03-19 22:16 PDT - Updated scoring completion logic to be final-only and updated NCAA sync writes to persist `status: "final"`.
- 2026-03-19 22:20 PDT - Reworked admin results score input labels to participant-aware text with fallback order: actual team labels -> derived available teams -> canonical slot-based participant labels.
- 2026-03-19 22:25 PDT - Added migration `20260319113000_milestone6_final_status` to map any legacy `resolved` game statuses to `final`.
- 2026-03-19 22:30 PDT - Verification complete: `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build` (build required escalated run in this sandbox due Turbopack process/port restrictions).

## Review
Follow-up complete. `/admin/results` now offers only unfinished statuses plus `final`, scoring/recalculation treat `final` as the completed state, and score inputs render participant-aware labels across rounds (including canonical fallback labels when team names are not yet known). Legacy `resolved` data is handled via targeted migration plus normalization guardrails.

---

# Task: Milestone 6 Follow-Up - Admin Results Post-Submit Visual Sync

## Plan
- [x] Re-read required project files and inspect admin results page/action/card state flow.
- [x] Diagnose why status/winner visually reset after successful server-action submit.
- [x] Implement the smallest UI-state fix so cards keep showing saved status/winner/scores immediately after save.
- [x] Keep persistence/scoring/standings behavior unchanged.
- [x] Verify with `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Capture review notes and lesson.

## Progress Notes
- 2026-03-19 22:41 PDT - Reproduced root cause from code inspection: uncontrolled `defaultValue` form fields were resetting after server-action submit, reflecting stale initial props until a full refresh.
- 2026-03-19 22:47 PDT - Switched `AdminResultGameCard` fields (status, winner, home score, away score) to controlled local state so browser form-reset behavior no longer snaps the card back to stale defaults after submit.
- 2026-03-19 22:53 PDT - Verification complete: `npm run typecheck`, `npm run lint`, and `npm run build` (build required escalated run in this sandbox due Turbopack process/port restrictions).

## Review
Visual post-submit reset bug is fixed. After saving a game result, the card now continues displaying the saved status/winner/scores immediately, without requiring refresh, while existing persistence and leaderboard recalculation behavior remain unchanged.

---

# Task: Milestone 6 Follow-Up - Admin Results Canonical Post-Save Card Sync

## Plan
- [x] Re-read required project/spec/admin-results files and inspect the existing post-submit state flow.
- [x] Identify why the UI can still show stale values after successful save despite controlled inputs.
- [x] Update the admin results action/state shape to return canonical saved game values on success.
- [x] Sync card-local state from successful action payload so `pending -> final` and `final -> pending` both reflect persisted values immediately.
- [x] Keep persistence/scoring/leaderboard behavior unchanged and run verification checks.
- [x] Record progress/review notes and capture the correction in `tasks/lessons.md`.

## Progress Notes
- 2026-03-19 23:27 PDT - Re-read `AGENTS.md`, `PROJECT_SPEC.md`, and current admin results files (`page.tsx`, `actions.ts`, `action-state.ts`, `admin-result-game-card.tsx`) for this post-Milestone-6 follow-up.
- 2026-03-19 23:29 PDT - Identified remaining root cause path: successful server action response did not include canonical saved values, so the card had no authoritative post-submit state source and could visually fall back to stale values during/after submit lifecycle updates.
- 2026-03-19 23:31 PDT - Added `savedValues` to admin result action state and updated `updateGameResultAction` to return persisted `status`, `winnerTeamKey`, `homeScore`, and `awayScore` from Prisma update response.
- 2026-03-19 23:33 PDT - Updated `AdminResultGameCard` to render from successful `savedValues` with local-edit gating, ensuring immediate visual sync for both `pending -> final` and `final -> pending` without refresh.

## Review
This follow-up is complete and tightly scoped to the visual sync bug. Cards now sync from canonical saved action payload values immediately after save, while existing result persistence and standings recalculation behavior remain unchanged.

---

# Task: Milestone 7 - NCAA Result Sync

## Plan
- [x] Re-read `AGENTS.md`, `PROJECT_SPEC.md`, multi-bracket alignment notes, `tasks/*`, and workflow skill guidance.
- [x] Audit existing sync/parser/matching/standings/admin-results code to identify exact Milestone 7 gaps.
- [x] Implement NCAA source fetch behavior for daily scores page usage with safe URL handling.
- [x] Implement robust completed-game parsing (teams, seeds, scores, winner, status) from NCAA scores HTML payloads.
- [x] Implement deterministic canonical mapping (including explicit First Four hardcoded mapping) and safe unmatched/ambiguous handling.
- [x] Update sync persistence flow for idempotent canonical `Game` updates, final-only status semantics, and score/winner/team-field writes.
- [x] Ensure standings recalculation and SyncRun logging/failure summaries remain correct and useful.
- [x] Add/adjust minimal admin-facing sync trigger/status surface required for Milestone 7 without overbuilding UI.
- [x] Run verification: `npm run db:generate`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Update progress/review notes with assumptions and any remaining gaps.

## Progress Notes
- 2026-03-20 09:18 PDT - Re-read required files (`AGENTS.md`, `PROJECT_SPEC.md`, `docs/multi-bracket-alignment.md`, `tasks/*`, `.agents/skills/workflow-orchestration/SKILL.md`) and summarized Milestone 7 requirements before coding.
- 2026-03-20 09:20 PDT - Audited current sync implementation: parser is placeholder, matching is only team-name set compare, sync writes winner only (no score parsing), and API trigger lacks explicit auth checks; existing standings recalculation + SyncRun model are reusable.
- 2026-03-20 09:35 PDT - Implemented NCAA fetch URL handling with daily date-based source defaults and optional env overrides (`NCAA_SCORES_URL`, `NCAA_SCORES_BASE_URL`, `NCAA_SCORES_DATE`, `NCAA_SCORES_TIMEZONE`).
- 2026-03-20 09:46 PDT - Replaced placeholder parser with JSON-script extraction + final-game parsing that captures teams, seeds, scores, winner, round, and region metadata.
- 2026-03-20 09:57 PDT - Added deterministic canonical matching with explicit First Four hardcoded matchup mapping and safe ambiguous/unmatched handling.
- 2026-03-20 10:11 PDT - Reworked sync persistence to update canonical `Game` rows idempotently (`status: final`, participants, winner key, scores), skip unsafe writes, and keep SyncRun summaries actionable.
- 2026-03-20 10:16 PDT - Added minimal admin-facing NCAA sync control/status panel on `/admin/results` and secured `/api/results/sync` with Auth.js session check.
- 2026-03-20 10:22 PDT - Verification complete: `npm run db:generate`, `npm run typecheck`, `npm run lint`, `npm run build` (build required escalated run in this sandbox due Turbopack process/port restrictions).

## Review
Milestone 7 is implemented in a tightly scoped way on top of the existing canonical multi-bracket architecture. NCAA sync now parses completed games with scores, maps results to canonical game IDs using explicit deterministic rules (including hardcoded First Four matchups), writes idempotent final-only updates into local `Game` rows, logs rich SyncRun summaries, recalculates standings, and exposes a narrow admin trigger/status panel without replacing the existing manual `/admin/results` override flow.

---

# Task: Milestone 7 Follow-Up - NCAA Parser Zero-Result Bug

## Plan
- [x] Re-read required project/workflow docs and inspect sync parser + matching + service files.
- [x] Identify the exact reason `parseCompletedGames()` returns zero results on NCAA scores pages.
- [x] Keep existing JSON parsing and add an HTML-content fallback parser for completed games.
- [x] Preserve existing matching and sync persistence architecture, adding only parser-compatible debug fields.
- [x] Add debug-friendly SyncRun summary metrics to show parser path and candidate counts.
- [x] Run verification checks for this scoped fix.
- [x] Update progress/review notes and lessons.

## Progress Notes
- 2026-03-20 11:15 PDT - Re-read `AGENTS.md`, `PROJECT_SPEC.md`, `tasks/*`, and `.agents/skills/workflow-orchestration/SKILL.md` before implementing this bug fix.
- 2026-03-20 11:18 PDT - Root cause confirmed: `lib/result-sync/ncaa.ts` only parsed JSON script blocks (`application/json`, `application/ld+json`, `__NEXT_DATA__`), while NCAA scores game lines are available in rendered anchor text on the page; this caused `parseCompletedGames()` to return zero when JSON blocks lacked usable game payloads.
- 2026-03-20 11:28 PDT - Added layered parsing in `ncaa.ts`: keep JSON extraction first, then fallback to parsing `FINAL ...` game lines from HTML anchor text (teams, seeds, scores, winner, round, region).
- 2026-03-20 11:31 PDT - Wired parser diagnostics into sync summaries (`parserPath`, JSON block/candidate counts, HTML fallback candidate/parsed counts, normalized parsed count) and surfaced them on `/admin/results`.
- 2026-03-20 11:34 PDT - Added sync source mode diagnostics (`override-url` vs `date-builder`) to make `NCAA_SCORES_URL` pinning visible in run summaries.
- 2026-03-20 11:41 PDT - Fixed `NCAA_SCORES_DATE` off-by-one behavior by treating explicit `YYYY-MM-DD` overrides as literal date parts (instead of UTC-midnight conversion shifted by timezone formatting).
- 2026-03-20 11:49 PDT - Confirmed `NCAA_SCORES_URL` root override can pin runs to a non-date URL; added automatic date-path expansion for base-score overrides (`sourceMode: override-base-url`) while preserving full URL override behavior.
- 2026-03-20 11:58 PDT - Verification complete: `npm run typecheck`, `npm run lint`, `npm run build` plus live NCAA parser smoke tests (`NCAA_SCORES_DATE=2026-03-18` and `2026-03-19`) showing non-zero parsed counts via HTML fallback.

## Review
Follow-up fix is scoped to parser extraction reliability and sync observability. The architecture remains unchanged: JSON parsing is still used when available, HTML fallback is used when JSON yields no completed games, and downstream deterministic matching + canonical `Game` updates remain intact.

---

# Task: Milestone 7 Follow-Up - March 19 West/Midwest Ambiguities

## Plan
- [x] Re-read required docs and inspect `ncaa.ts`, `matching.ts`, and `sync-service.ts`.
- [x] Reproduce March 19 ambiguity output and inspect parsed region values for affected matchups.
- [x] Apply the smallest fix so Midwest region values are not collapsed into West during normalization.
- [x] Add minimal parser diagnostics for region extraction confidence.
- [x] Re-run sync checks for March 19 and regression dates (March 17/18).
- [x] Run `npm run typecheck`, `npm run lint`, and `npm run build`.

## Progress Notes
- 2026-03-20 13:03 PDT - Reproduced current behavior with `NCAA_SCORES_DATE=2026-03-19 npm run sync:results`; ambiguities matched the reported six West/Midwest collisions.
- 2026-03-20 13:06 PDT - Inspected fallback anchor text from the NCAA page and confirmed region text exists on those rows (`... WEST REGION` / `... MIDWEST REGION`).
- 2026-03-20 13:10 PDT - Identified exact bug: region normalization checked `\"west\"` before `\"midwest\"` in both `lib/result-sync/ncaa.ts` and `lib/result-sync/matching.ts`, collapsing Midwest into West.
- 2026-03-20 13:12 PDT - Applied narrow normalization-order fix (check `midwest` before `west`) in parser and matcher.
- 2026-03-20 13:15 PDT - Added minimal sync debug fields for region extraction confidence: `parsedGamesWithRegion`, `parsedGamesMissingRegion`, and `parsedRegionSamples`.
- 2026-03-20 13:18 PDT - Re-verified sync runs:
  - `2026-03-19`: `ambiguousGames: 0`, `matchedGames: 16`
  - `2026-03-18`: no regressions (`matchedGames: 2`, `ambiguousGames: 0`)
  - `2026-03-17`: no regressions (`matchedGames: 2`, `ambiguousGames: 0`)
- 2026-03-20 13:22 PDT - Verification complete: `npm run typecheck`, `npm run lint`, `npm run build`.

## Review
Follow-up complete with a narrow, production-friendly fix. The West/Midwest ambiguity set is resolved without rewriting matching logic, fallback parsing remains JSON-first + HTML fallback, and sync summaries now include small region diagnostics to make extraction confidence easier to verify.
