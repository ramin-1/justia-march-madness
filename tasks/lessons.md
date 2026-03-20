# Lessons Learned

## Patterns to preserve

- Keep the local database as the source of truth even when external syncing is available.
- Add manual override paths whenever external parsing could fail.
- Put stable agent instructions in `AGENTS.md` and keep long-form context in linked docs instead of bloating one file.

## Template for future entries

### Date
YYYY-MM-DD

### What went wrong
- ...

### Prevention rule
- ...

### Concrete change made
- ...

---

## 2026-03-18 - Communication

**Mistake**: Proposed and kept temporary cookie-based middleware protection during Milestone 1 planning.
**Pattern**: Added scope that belongs to a later milestone instead of honoring milestone boundaries strictly.
**Rule**: For milestone-scoped scaffold tasks, avoid temporary auth or behavior hacks unless they are explicitly requested or required for build health.
**Applied**: Removed `middleware.ts` gating and kept admin routes as clearly labeled placeholders until Milestone 2.

## 2026-03-19 - Bracket Topology Accuracy

**Mistake**: Assumed all four `MAIN` play-in games were 16-seed qualifiers when expanding the full topology.
**Pattern**: Applied a uniform region template without encoding seed-slot differences for play-in integration.
**Rule**: Treat play-in seed qualifier type as explicit metadata (`16` vs `11`) and map dependencies to the correct round-one slot (`R1_G1` for 16-seed qualifiers, `R1_G5` for 11-seed qualifiers).
**Applied**: Updated `lib/brackets/registry.ts` with seed-aware play-in metadata and region topology wiring so East/South are 16-seed qualifiers and West/Midwest are 11-seed qualifiers.

## 2026-03-19 - Migration Ordering Discipline

**Mistake**: Added a new Prisma migration with a timestamped folder name that sorted before `init`, causing `ALTER TABLE \"Game\"` to run before `Game` existed.
**Pattern**: Manually naming migration directories without validating lexicographic apply order.
**Rule**: Any migration that alters existing tables must sort after all table-creation migrations; always sanity-check `find prisma/migrations -name migration.sql | sort` before finalizing.
**Applied**: Renamed milestone-5 migration directory to sort after `init` and confirmed create-before-alter ordering for `Game`.

## 2026-03-19 - Final-Only Game Completion Semantics

**Mistake**: Left both `resolved` and `final` as completed game statuses after Milestone 6, which created unnecessary dual-status behavior.
**Pattern**: Introducing parallel status meanings instead of enforcing one canonical completed state.
**Rule**: For tournament result workflows, keep one canonical completed status (`final`) and provide explicit migration/compatibility handling for any legacy aliases.
**Applied**: Removed `resolved` from admin status options/validation, moved completion checks to final-only helpers, switched sync writes to `final`, and added a migration that maps legacy `resolved` rows to `final`.

## 2026-03-19 - Server Action Form Reset UX

**Mistake**: Used uncontrolled form fields (`defaultValue`) in `AdminResultGameCard` with a server action, causing visual field reset to stale initial props after submit.
**Pattern**: Assuming successful server action submit will automatically keep client form controls in sync with persisted values.
**Rule**: For mutation-heavy admin forms, use controlled local state when immediate post-submit visual consistency is required.
**Applied**: Converted admin result card inputs (status/winner/scores) to controlled state and handled non-final status transitions by clearing dependent fields in the client state.

## 2026-03-19 - Canonical Post-Save Action Payload for UI Sync

**Mistake**: Stopped at controlled inputs only and did not return/apply canonical saved values from the server action, so cards could still visually drift back to stale values after submit.
**Pattern**: Relying on local form state alone without an authoritative post-mutation payload to reconcile UI state after server action lifecycle updates.
**Rule**: For server-action mutation UIs where immediate post-save accuracy matters, return canonical persisted fields from the action and sync the client state from that success payload.
**Applied**: Extended admin result action-state with `savedValues`, returned persisted game fields from `updateGameResultAction`, and synced card state from successful action responses.

## 2026-03-20 - NCAA Sync Parsing Layer Choice

**Mistake**: Implemented the NCAA parser to rely primarily on JSON script payload extraction without confirming the scores page consistently exposes completed games there.
**Pattern**: Parsing an assumed data layer instead of validating the real rendered content source used in production pages.
**Rule**: For website scraping sync jobs, use layered extraction (structured payload first, rendered HTML fallback) and add parser-path diagnostics to SyncRun summaries so zero-parse failures are immediately diagnosable.
**Applied**: Added HTML anchor-text fallback parsing for `FINAL` score lines, retained JSON-first parsing, and logged parser-path/candidate counts in sync run summaries.

## 2026-03-20 - Region Normalization Substring Collision

**Mistake**: Region normalization checked `"west"` before `"midwest"`, causing `Midwest` values to be normalized incorrectly as `West`.
**Pattern**: Using `includes()` checks with overlapping substrings in the wrong order.
**Rule**: In normalization functions with overlapping tokens, always match the more specific token first (for example `midwest` before `west`) and keep parser + matcher normalization behavior aligned.
**Applied**: Reordered region normalization checks in both NCAA parsing and canonical matching code, then verified March 19 West/Midwest ambiguities dropped to zero.

## 2026-03-20 - Team Label Override Coverage + Route Revalidation Scope

**Mistake**: Wired manual/synced label overrides into some bracket display paths but left `initialTeams`/`fixedTeams` branches returning raw placeholder labels; also revalidated only a subset of affected routes after slot assignment writes.
**Pattern**: Applying centralized display logic only on dependency-derived winners and forgetting static/fallback option branches and dynamic-route cache invalidation.
**Rule**: When adding a centralized label override resolver, apply it to every return path that emits team options, and revalidate all consuming route patterns (including dynamic pages) after admin writes.
**Applied**: Updated `getAvailableTeamsForGame()` to resolve labels across all branches and expanded `/admin/team-slots` revalidation to include `/entries` layout, `/entries/[id]/edit`, and `/bracket/[id]`.

## 2026-03-20 - Bracket View Pick vs Actual Result Semantics

**Mistake**: Reused selected-pick presentation semantics in read-only bracket view, causing selected teams to appear as winners (green + `Winner:` text) even when actual game results differed or were still pending.
**Pattern**: Coupling view-state styling/text to user picks without comparing canonical game outcome status + actual winner.
**Rule**: In read-only bracket views, derive outcome styling and winner display from canonical final game results; treat picks as predictions that can be correct, incorrect, or pending.
**Applied**: Added final-status-aware outcome comparison in `BracketEditor` view mode and changed `Winner:` to render only actual final winners from canonical `Game` data.
