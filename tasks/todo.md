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
