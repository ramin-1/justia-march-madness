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

## 2026-03-23 - Admin Sync Must Backfill, Not Only Single-Date

**Mistake**: Wired the admin NCAA sync button directly to the single-date sync path, so each click only processed one effective date.
**Pattern**: Reusing a low-level daily sync primitive for an admin catch-up workflow without adding orchestration.
**Rule**: Keep the single-date sync pipeline as a reusable primitive, and add a separate orchestration layer for admin backfill/catch-up behavior.
**Applied**: Added `syncNcaaResultsBackfill()` to run bounded sequential date syncs (`2026-03-17` through effective target date) and switched the admin button action to call that wrapper with aggregated messaging.

## 2026-03-23 - Matching Must Use Derived Participants For Later Rounds

**Mistake**: Built sync matcher candidates from persisted `homeTeam/awayTeam` only, which left round-2+ games unmatched when those fields were still null.
**Pattern**: Assuming future-round participant names are always already persisted instead of deriving them from upstream winners in current run state.
**Rule**: For deterministic bracket sync matching beyond round 1, derive candidate participants from current winner picks (`gamesById`) and canonical dependencies before attempting exact team-name matching.
**Applied**: Added derived local candidate generation in sync service via `getAvailableTeamsForGame()` + current key-to-name mappings so second-round games can match during the same backfill run.

## 2026-03-23 - Keep Canonical Play-In Slot Semantics Aligned With Hardcoded Sync IDs

**Mistake**: Left `PLAYIN_G1` labeled/wired as East 16 qualifier while sync hardcoded `Howard vs UMBC -> PLAYIN_G1`, causing canonical topology mismatch.
**Pattern**: Updating sync mapping independently from canonical bracket registry semantics.
**Rule**: When a sync path hardcodes matchup-to-game IDs, canonical registry labels and downstream feed assignments for those IDs must stay in lockstep.
**Applied**: Corrected play-in topology so `PLAYIN_G1` is Midwest 16 qualifier, removed East 16 play-in dependency, and kept First Four hardcoded map consistent with canonical IDs.

## 2026-03-23 - Use Dedicated apply_patch Tool for File Patches

**Mistake**: Attempted an `apply_patch` style edit through `exec_command`, which triggered tooling warnings.
**Pattern**: Mixing shell patching and dedicated patch tooling in the same workflow.
**Rule**: For patch-style file edits, always use the dedicated `apply_patch` tool directly rather than running patch payloads through shell execution.
**Applied**: Switched subsequent file edits/deletes in this task to the `apply_patch` tool path only.

## 2026-03-23 - Navigation Should Reflect Auth State, Not Only Route Protection

**Mistake**: Left admin navigation links visible to logged-out users even though route protection existed in proxy/auth.
**Pattern**: Treating access control and navigation visibility as the same concern and implementing only the protection layer.
**Rule**: Whenever routes are role-protected, make nav visibility session-aware so users only see destinations appropriate to their auth state.
**Applied**: Updated `SiteNav` to read `auth()` server-side and render `Admin Login` when logged out vs full admin links when logged in.

## 2026-03-23 - Remove Scaffold Messaging From Production-Facing Auth Pages

**Mistake**: Kept `/login` wrapped in a generic scaffold component that injected a yellow “Scaffold Route” banner after milestone completion.
**Pattern**: Reusing scaffolding wrappers on finalized user-facing routes without re-evaluating whether placeholder messaging still belongs.
**Rule**: Once a route is production-usable, render with standard page shell/components and remove scaffold-only callouts unless explicitly needed.
**Applied**: Switched `/login` from `ScaffoldPage` to `PageShell`, preserving form/auth behavior while removing the scaffold banner.

## 2026-03-23 - Bracket Board UX Needs Width + Composition, Not Just Column Rendering

**Mistake**: Delivered an initial traditional bracket layout that still relied on internal `min-w`/scroll wrappers and default page max-width constraints, leaving the board cramped with wasted side gutters.
**Pattern**: Translating round columns without rebalancing overall board composition and container width for the target screen.
**Rule**: For ESPN-like bracket UX, treat layout as one composed canvas (quadrants + centered finals) and audit page/container constraints so desktop width is actually utilized before adding overflow fallbacks.
**Applied**: Added bracket-specific wide `PageShell` mode and refactored desktop board into quadrant composition without internal forced-width scrolling.

## 2026-03-23 - Avoid Mounting Duplicate Radio Trees Behind CSS Visibility Toggles

**Mistake**: Mounted desktop and mobile bracket trees at the same time and relied on CSS (`hidden`/breakpoints) to toggle visibility, while both trees reused identical radio `name` groups.
**Pattern**: Treating CSS-hidden interactive forms as harmless duplicates even when browser-level radio grouping still applies across the full DOM.
**Rule**: For interactive form controls (especially radio groups), only mount one active layout tree at a time or namespace groups uniquely; do not keep duplicate same-name radios mounted concurrently.
**Applied**: Added viewport-gated conditional rendering so only one interactive bracket tree is mounted, restoring stable pick selection.

## 2026-03-23 - Keep Final Four Pairing Semantics in Canonical Source Mapping

**Mistake**: Left canonical Final Four source mapping wired as East/West and South/Midwest after UI refactors, causing wrong semifinal compositions everywhere.
**Pattern**: Assuming display composition controls semifinal pairings when participant derivation is actually sourced from canonical `sourceGameIds`.
**Rule**: Treat canonical game dependency mapping as the single source of truth for matchup composition and validate semifinal pairings explicitly (`EAST+SOUTH`, `WEST+MIDWEST`) after topology/UI updates.
**Applied**: Corrected `FINAL4_G1` and `FINAL4_G2` `sourceGameIds` in `lib/brackets/registry.ts` so all flows inherit the right pairings.

## 2026-03-23 - Bracket Tree UX Requires Source-Relative Placement, Not Column-Top Stacks

**Mistake**: Rendered later rounds as simple per-column stacks, so Round 2+ cards started near the top of each column instead of vertically centering relative to feeder games.
**Pattern**: Treating bracket rounds as independent lists rather than as a dependency tree with positional relationships.
**Rule**: For bracket-board UIs, compute later-round vertical offsets from upstream source indices and route connectors from feeder games; avoid independent list stacking for downstream rounds.
**Applied**: Added shared tree layout math (`buildTreeLayout`) in `BracketEditor` and switched region/finals rendering to absolute source-relative placement with SVG connector paths.

## 2026-03-23 - Complete Refactors by Removing All Stale Symbol References

**Mistake**: A partial bracket-layout refactor left runtime references to a removed constant (`ROUND_COLUMN_GAP_CLASSES`) in one render path.
**Pattern**: Updating layout strategy/constants without fully removing legacy usage points before runtime verification.
**Rule**: After UI refactors that replace core layout primitives, run a symbol search for removed constants and perform a full dev/runtime smoke check so stale references cannot ship.
**Applied**: Verified `BracketEditor` no longer references `ROUND_COLUMN_GAP_CLASSES`, confirmed fresh build health, and captured stale-dev-bundle signal as a cache artifact rather than active source.

## 2026-03-23 - Do Not Mix Conflicting Position Utilities on Tree-Positioned Wrappers

**Mistake**: Tree-positioned game cards received both `relative` and `absolute` utility classes on the same wrapper.
**Pattern**: Reusing a generic card wrapper class (`relative`) in an absolute-coordinate layout without guarding for positioning mode.
**Rule**: In coordinate-based board layouts, wrapper position must be explicit and singular; never combine conflicting `position` utilities on the same element.
**Applied**: Updated `BracketEditor` card wrapper logic to skip forced `relative` when an `absolute` class is supplied, restoring card/connector coordinate alignment.

## 2026-03-23 - Avoid Exact-Fit Tree Container Heights For Dense Bracket Boards

**Mistake**: Tree layout height was computed as an exact mathematical fit (`lastTop + cardHeight`) with no render buffer.
**Pattern**: Using strict theoretical dimensions in a UI where borders/shadows/content variability can push the last card beyond the visible container.
**Rule**: Bracket tree containers should include a small bottom padding buffer and be based on actual positioned card bottoms, not only theoretical round-depth formulas.
**Applied**: Updated `buildTreeLayout` to use max rendered card bottom plus shared bottom padding, preventing bottom-row region card spillover.

## 2026-03-23 - Finals Composition Must Match Intended Horizontal Semifinal/Final Relationship

**Mistake**: Reused a generic two-round tree (`final4 -> championship`) for center finals, which positioned both semifinals in one column and final in a side column.
**Pattern**: Applying generic round-column layout where a specific visual composition is required.
**Rule**: When product expects `Semifinal 1 | Final | Semifinal 2`, use a dedicated finals coordinate layout and draw connectors from both semifinals into the centered final.
**Applied**: Replaced center finals rendering with explicit three-slot absolute coordinates and matching connector paths.

## 2026-03-23 - Center Zone Should Not Compete With Region Tracks In Dense Bracket Boards

**Mistake**: Kept center finals inside the same desktop grid track layout as region quadrants, forcing East/West/South/Midwest to share width with finals and creating persistent crowding/overflow.
**Pattern**: Treating center finals as a peer grid column when the intended composition is four quadrants plus a dedicated center lane.
**Rule**: For ESPN-style boards, render region quadrants in a 2x2 grid and place finals in a dedicated centered overlay/lane with enough vertical separation between top and bottom quadrants.
**Applied**: Reworked desktop board to East/West top + South/Midwest bottom with increased row gap, and moved center finals into an absolute centered zone with pointer-safe layering.

## 2026-03-23 - Vertical Readability Depends on Card Height + Stride Together

**Mistake**: Attempted crowding fixes primarily through board composition changes while leaving regional card height/vertical step too small, which kept Round 1 rows visually compressed.
**Pattern**: Adjusting container placement without proportionally adjusting internal tree geometry constants.
**Rule**: For bracket readability, tune card height, vertical stride, and center-band gap as a coordinated set; changing only one dimension often leaves crowding unresolved.
**Applied**: Increased shared region card height/stride constants and enlarged top-vs-bottom quadrant gap, while preserving connector/tree alignment logic.

## 2026-03-23 - Region Containers Should Fit Tree Geometry (Or Center It), Not Stretch Arbitrarily

**Mistake**: Left region containers stretched to full grid cell width while tree geometry had fixed absolute width anchored at left.
**Pattern**: Mixing fixed-width tree coordinates with full-width parent containers, producing obvious unused interior whitespace on one side.
**Rule**: For fixed-coordinate bracket trees, either center the tree within the container or make the container width fit the tree so internal width is used efficiently.
**Applied**: Switched region boxes to fit-content and centered tree rendering (`w-fit`, `mx-auto`, centered grid items), reducing wasted side space while preserving connector alignment.

## 2026-03-23 - Dense Bracket Cards Should Prioritize High-Value Information

**Mistake**: Continued rendering low-value metadata (`Region • GAME_ID`) inside compact desktop cards where vertical space is tight.
**Pattern**: Treating debug/internal identifiers as equal to primary bracket-reading information in constrained UI components.
**Rule**: In compact bracket cards, prioritize matchup title, team options, and winner outcome text; remove/minimize metadata that does not directly help pick/view decisions.
**Applied**: Hid metadata lines for compact tree cards and reallocated space to essential card content with taller shared card geometry.

## 2026-03-23 - Leave Explicit Bottom Breathing Room for Outcome Text in Fixed-Height Cards

**Mistake**: Even after major geometry improvements, compact fixed-height cards still left the `Winner:` line visually tight to the bottom edge.
**Pattern**: Optimizing for total content fit but not reserving explicit bottom rhythm for optional outcome copy.
**Rule**: In fixed-height bracket cards, reserve a small explicit margin/padding budget for conditional bottom text (like winner outcomes), not just the core team rows.
**Applied**: Added a subtle card-height/padding increase and extra top spacing before `Winner:` in compact cards.

## 2026-03-23 - Tiny Polish Requests Often Need Margin Rebalancing, Not More Height

**Mistake**: Kept solving winner-line readability through repeated card height increases when the final ask was simply to move the line slightly higher.
**Pattern**: Reaching for global geometry first when the UX request targets local rhythm inside an already-balanced component.
**Rule**: For micro-polish adjustments, prefer the smallest local spacing change (for example `mt`/`mb`) before altering shared geometry constants.
**Applied**: Moved compact `Winner:` text upward with a one-step margin reduction while leaving the broader layout intact.

## 2026-03-23 - Template Availability Should Accept Canonical Winners For External Source Games

**Mistake**: Limited downstream team availability to in-form picks only, so `SECOND_CHANCE_S16` Sweet Sixteen games fell back to `Team A/B` placeholders even when Round-of-32 results were already final.
**Pattern**: Treating template boundaries as data boundaries and ignoring canonical winners from source games outside the active bracket template.
**Rule**: For multi-template brackets, downstream participant resolution must support canonical final winners for source games outside the active template, while still requiring user picks for in-template dependencies.
**Applied**: Added optional `sourceWinnerTeamKeyByGameId` support to availability/sanitization + server validation and wired it through create/edit/view flows.

## 2026-03-24 - Server-Action Validation Errors Must Return Rehydration Values

**Mistake**: Returned only `message` and `fieldErrors` from failed entry server actions, which left client forms without the submitted participant/pick values after action rerender/reset.
**Pattern**: Treating validation errors as purely messaging concerns and not as full form-state restoration events.
**Rule**: For mutation forms with many fields, failed server-action responses must include submitted values (or equivalent canonical form snapshot) so the UI can rehydrate and preserve user progress.
**Applied**: Added `values` to `EntryFormState`, returned submitted participant/bracket/picks in create/update error paths, and rehydrated `EntryForm`/`BracketEditor` from that state.

## 2026-03-24 - Preserve Bracket Type via Derived State, Not Initial Local Default

**Mistake**: Left bracket type select primarily anchored to local initial state, which could fall back to `MAIN` in failed-submit rerender/remount paths.
**Pattern**: Initializing critical form state from defaults without consistently deriving from preserved server-action values.
**Rule**: For failed-submit recovery, derive current field values from preserved action-state first, then use local user overrides; avoid hard defaulting when recovery data exists.
**Applied**: Updated `EntryForm` bracket type selection to derive from `state.values.bracketType` when no active override is present and updated action fallback to reuse `previousState` bracket type before `MAIN`.

## 2026-03-24 - Use One Canonical Form Field Path for Critical Values

**Mistake**: Create and edit flows used different posted field paths for `bracketType` (select name vs hidden input), increasing chances of payload/state mismatch during failed-submit recovery.
**Pattern**: Allowing parallel input sources for one critical field across flow variants.
**Rule**: For critical form values that drive layout/validation, submit exactly one canonical field source in all modes; avoid duplicate or mode-specific field-name paths.
**Applied**: Switched `EntryForm` to always submit hidden canonical `bracketType` and removed create-select `name` to eliminate ambiguous payloads.

## 2026-03-24 - Preserve Recovery State With One Client Owner, Not Tri-Source Derivation

**Mistake**: Kept bracket type as a derived value across three potential owners (local override, server-action values, default props), which left room for fallback snaps after failed submits.
**Pattern**: Multi-owner field derivation in interactive forms where both draft edits and server validation recovery are involved.
**Rule**: Use one canonical client-owned value for interactive fields, then explicitly hand off to server-action recovery state after submit failures without creating competing owner precedence chains.
**Applied**: Refactored `EntryForm` bracket type flow to a single client-selected value plus explicit submit-time draft handoff, keeping select display, hidden payload, and bracket editor variant aligned after failed create submits.

## 2026-03-24 - Create Mode Should Submit Critical Fields From Visible Inputs

**Mistake**: Relied on hidden `bracketType` submit indirection in create mode while also rendering a visible bracket-type select, which complicated render ownership and made recovery/debugging brittle.
**Pattern**: Hidden-input indirection for fields that users actively edit.
**Rule**: In create flows, submit critical editable fields directly from their visible controls (`name` on the actual input/select). Reserve hidden mirrors for non-editable modes only.
**Applied**: Restored create-mode `name=\"bracketType\"` on the visible select, kept hidden bracket type only for edit mode, and aligned select/editor/payload to the same reducer-owned value.

## 2026-03-24 - Prevent Select First-Option Fallback With Explicit Value Normalization

**Mistake**: Assumed compile-time enum types alone guaranteed runtime select value/option equality in all failed-submit rerender paths.
**Pattern**: Relying on type annotations instead of runtime normalization for UI controls that can visually fall back to the first option.
**Rule**: For critical select controls, normalize runtime value against canonical option values before rendering; then use that normalized value consistently for UI, dependent rendering, and payload fields.
**Applied**: Added `normalizeBracketType(...)` in `EntryForm` and switched select value, editor bracket type, editor key, and edit hidden bracket-type field to a single normalized `effectiveBracketType`.

## 2026-03-24 - Avoid Copy/Rehydrate Local State When Render-Time Derivation Is Enough

**Mistake**: Used reducer/effect copy-rehydration for bracket type in create mode, even though failed-submit state can be read directly during render.
**Pattern**: Introducing local state synchronization layers that can drift from source-of-truth values.
**Rule**: When server action state already carries the needed value, prefer render-time canonical derivation (`draft -> preserved -> default`) over effect-driven copying into another local owner.
**Applied**: Replaced create-mode bracket-type reducer/effect copy flow with render-time `effectiveBracketType` derivation and bound select/editor/payload to that one value.

## 2026-03-24 - Use Shared Validation Logic For Client Pre-Submit Guards

**Mistake**: Let complex bracket forms rely on server-action failure for first-pass missing-pick feedback, forcing avoidable rerenders and state-recovery edge cases.
**Pattern**: Duplicating or deferring validation instead of reusing existing canonical rules in a client pre-submit guard.
**Rule**: When server validation logic is pure and reusable, call it client-side pre-submit to block invalid mutations early while keeping server validation as the safety net.
**Applied**: Wired `EntryForm` submit interception to `parseEntryFormData(...)`, blocking invalid submits and rendering inline pick errors without losing in-progress selections.

## 2026-03-24 - Validate Cross-Field Championship Consistency, Not Just Per-Field Scores

**Mistake**: Championship validation checked each score field independently but did not enforce that the selected winner's predicted score actually beats the opponent.
**Pattern**: Missing cross-field consistency checks in forms with interdependent inputs.
**Rule**: For winner + score forms, add cross-field validation rules after individual field parsing so the selected winner and predicted scores cannot contradict each other.
**Applied**: Added `CHAMPIONSHIP` rule in shared parser: selected winner score must be strictly greater than losing team score; surfaced section-level `championshipScore` error in bracket UI.

## 2026-03-25 - Keep Read-Path Pick Sanitization Context-Aligned With Write Validation

**Mistake**: Normalized saved picks on view/edit without passing `sourceWinnerTeamKeyByGameId`, even though create/update validation used that context for `SECOND_CHANCE_S16`.
**Pattern**: Re-validating persisted multi-template picks with less context on read than was used on write.
**Rule**: Any read-path normalization that re-sanitizes picks must receive the same dependency context (for example final source winners) used during write-path validation, especially for templates that depend on external source games.
**Applied**: Extended `normalizeEntryPicksJson()` with optional source-winner context and wired `/bracket/[id]` + `/entries/[id]/edit` to pass `getFinalWinnerTeamKeyByGameId()` before rendering.

## 2026-03-29 - Seed Constraints Must Be Scoped To Rounds With Canonical Seed Models

**Mistake**: Applied scraped-seed filtering in fallback matching without checking whether candidate canonical rounds actually had a defined seed-pair model.
**Pattern**: Reusing early-round disambiguation constraints in later rounds where those constraints are undefined.
**Rule**: Only apply seed-pair filtering to candidates with explicit canonical seed-pair support (play-in/round1); keep later rounds seed-agnostic unless a deterministic seed model exists.
**Applied**: Updated sync matcher to filter only seed-model candidates and expanded round normalization for NCAA regional/national labels to avoid misclassifying regional semifinal/final games.

## 2026-03-29 - Sync Matcher Inputs Must Prefer Derived Participants Over Seeded Placeholders

**Mistake**: Local matching candidates for future rounds preferred persisted DB `homeTeam`/`awayTeam` values even when derived upstream participants were available.
**Pattern**: Treating seeded placeholder labels as authoritative in sync matching inputs for rounds whose participants are dependency-derived.
**Rule**: For sync matching beyond early rounds, use derived participant names first and only fall back to stored values when derivation is unavailable.
**Applied**: Updated `buildLocalGamesForMatching()` to prefer derived home/away names and enhanced ambiguous diagnostics to include candidate local names for fast triage.
