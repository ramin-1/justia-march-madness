# March Madness Company Challenge — Project Specification

## 1. Project Overview

Build a web application to manage a company-wide March Madness bracket challenge.

The application must support **three bracket products**:

1. **Main Bracket**
2. **Second Chance Sweet Sixteen Bracket**
3. **Championship Bracket**

The app will allow an admin to create and manage participant entries, track picks, record actual tournament results, automatically calculate standings, and present public leaderboards.

The app should be built in a clean, maintainable way so future enhancements can be added without reworking the core architecture.

---

## 2. Core Product Goals

The final product must:

- support multiple participant entries across the company
- allow the admin to create, edit, and delete entries
- support three bracket types:
  - Main
  - Second Chance Sweet Sixteen
  - Championship
- store bracket picks in the database
- provide public leaderboard views
- provide protected admin-only management pages
- support manual result entry by the admin
- support automated NCAA result syncing
- calculate standings correctly for all bracket types
- render saved brackets in a clear read-only format
- support editable bracket entry flows for the admin

---

## 3. Bracket Types

### 3.1 Main Bracket

The Main Bracket covers the full NCAA tournament structure.

It includes:

- Play-In / First Four
- First Round
- Second Round
- Sweet Sixteen
- Elite Eight
- Final Four
- Championship

#### Main Bracket scoring
- Play-In wins = 1 point
- First Round wins = 2 points
- Second Round wins = 4 points
- Sweet Sixteen wins = 8 points
- Elite Eight wins = 16 points
- Final Four wins = 32 points
- Championship win = 64 points

#### Main Bracket leaderboard fields
- Rank
- Entry Name
- Participant Name
- Score
- Correct Picks Count
- Optional Max Remaining Points

---

### 3.2 Second Chance Sweet Sixteen Bracket

The Second Chance Sweet Sixteen Bracket becomes available once the tournament field has been narrowed to 16 teams.

It includes only:
- Sweet Sixteen games
- Elite Eight games
- Final Four games
- Championship game

It must **not** include earlier tournament rounds.

#### Second Chance scoring
- Sweet Sixteen wins = 1 point
- Elite Eight wins = 2 points
- Final Four wins = 4 points
- Championship win = 8 points

#### Second Chance leaderboard fields
- Rank
- Entry Name
- Participant Name
- Score

---

### 3.3 Championship Bracket

The Championship Bracket becomes available when only two teams remain.

It includes:
- the championship game winner pick
- a predicted score for each team

#### Championship ranking rules
Participants are ranked using the following criteria, in order:

1. Correctly picked the winning team
2. Closest to the winning team’s score (either above or below)
3. Closest to the combined total score of both teams (either above or below)

This bracket should be treated as a **ranking/tiebreaker-based product**, not as a standard full bracket points product.

#### Championship leaderboard fields
- Rank
- Entry Name
- Participant Name
- Picked Winner
- Predicted Final Score
- Ranking determined by championship criteria

---

## 4. Entry Naming Rules

Entry names must be generated automatically from the participant name and bracket type.

The admin should **not** manually enter the entry name.

### Naming conventions
- `"{Participant Name}'s Main Bracket"`
- `"{Participant Name}'s Second Chance Bracket"`
- `"{Participant Name}'s Championship Bracket"`

### Examples
- `Colin Murphy's Main Bracket`
- `Colin Murphy's Second Chance Bracket`
- `Colin Murphy's Championship Bracket`

Entry name generation must happen in **server-side create/update logic**, not only in the client.

---

## 5. User Roles

### Public user
A public user can:
- view leaderboards
- click into saved read-only bracket entries

### Admin user
An authenticated admin can:
- log in
- create entries
- edit entries
- delete entries
- record actual game results
- manage result sync status
- manage entries across all bracket types

The admin flow uses a **single-admin credentials-based login** for the initial version.

---

## 6. Pages and Routes

### Public routes
- `/leaderboard`
- `/bracket/[id]`

### Protected admin routes
- `/login`
- `/entries`
- `/entries/new`
- `/entries/[id]/edit`
- `/admin/results`

---

## 7. Page Requirements

### 7.1 Leaderboard Page
Route: `/leaderboard`

Requirements:
- public page
- includes tabs or tab-like filters for:
  - Main
  - Second Chance
  - Championship
- each tab shows only entries for that bracket type
- entry names are clickable and open `/bracket/[id]`
- main leaderboard includes a Correct Picks Count column
- second chance leaderboard shows score standings
- championship leaderboard shows ranking details appropriate to the championship game bracket

Recommended URL behavior:
- `/leaderboard?type=main`
- `/leaderboard?type=second-chance`
- `/leaderboard?type=championship`

---

### 7.2 Bracket View Page
Route: `/bracket/[id]`

Requirements:
- public page
- read-only view of a saved entry
- renders different bracket layouts depending on entry `bracketType`
- supports:
  - full main bracket layout
  - Sweet Sixteen-only bracket layout
  - championship-game-only layout with predicted scores

---

### 7.3 Entries Page
Route: `/entries`

Requirements:
- protected admin page
- list of entries
- “Add Bracket” button at the top
- searchable/filterable by:
  - participant name
  - entry name
  - bracket type
- each row should show:
  - entry name
  - participant name
  - bracket type
  - score
  - updated date
  - actions
- actions:
  - view
  - edit
  - delete

---

### 7.4 New Entry Page
Route: `/entries/new`

Requirements:
- protected admin page
- admin enters:
  - participant name
  - bracket type
  - bracket picks
- entry name is generated automatically
- bracket UI should change based on selected bracket type

---

### 7.5 Edit Entry Page
Route: `/entries/[id]/edit`

Requirements:
- protected admin page
- loads an existing entry
- allows editing:
  - participant name
  - bracket picks
  - championship score guesses where applicable
- if participant name changes, entry name should be regenerated automatically
- bracket type editing may be allowed only if it does not create integrity issues; otherwise keep type immutable after creation

---

### 7.6 Admin Results Page
Route: `/admin/results`

Requirements:
- protected admin page
- allows the admin to record actual NCAA tournament outcomes
- supports:
  - winner entry for games
  - game status
  - actual team scores
- grouped by round and region where appropriate
- supports enough data entry to correctly resolve:
  - main bracket scoring
  - second chance scoring
  - championship ranking

---

## 8. Core Architecture Decisions

### 8.1 Bracket Type is a first-class domain concept
The system must explicitly understand bracket type as part of the data model and UI behavior.

This affects:
- entry creation
- naming
- rendering
- scoring
- leaderboard display
- validation

### 8.2 One NCAA game dataset, multiple bracket templates
The system should use one canonical NCAA `Game` dataset.

The three bracket products should reuse the same underlying real game records:
- Main uses the full tournament path
- Second Chance uses Sweet Sixteen onward
- Championship uses only the championship game

Do **not** duplicate separate tournament game tables per bracket type.

### 8.3 Bracket templates should be config-driven
Bracket structure, included game IDs, round definitions, and display metadata should be stored in a dedicated config/module rather than scattered through page logic.

### 8.4 Entry naming should be derived, not user-entered
Entry names should always be derived from participant name + bracket type in server logic.

### 8.5 Championship-specific score guess logic should be isolated
Championship score prediction behavior should not be mixed into generic full-bracket logic.

---

## 9. Recommended Technology Stack

- **Next.js** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Prisma**
- **PostgreSQL**
- **Auth.js** credentials auth
- **Zod**
- **Vercel** for deployment

---

## 10. Data Model Requirements

### 10.1 Entry

Each entry should include at minimum:

- `id`
- `name`
- `participantName`
- `bracketType`
- `picksJson`
- `totalScore`
- `correctPicks`
- `maxPossibleScore` (optional but recommended)
- `tiebreakerJson` or equivalent nullable field for championship score guesses
- `createdAt`
- `updatedAt`

#### Entry notes
- `name` is derived automatically
- `bracketType` should be an enum-like value
- `picksJson` should be keyed by canonical game IDs
- `tiebreakerJson` should support championship score predictions cleanly

Recommended bracket type values:
- `MAIN`
- `SECOND_CHANCE_S16`
- `CHAMPIONSHIP`

---

### 10.2 Game

Each actual NCAA game should include at minimum:

- `id`
- `round`
- `region`
- `slotLabel` (optional but recommended)
- `homeTeam`
- `awayTeam`
- `winnerTeam`
- `homeScore`
- `awayScore`
- `status`
- `scheduledDate` (optional)
- `syncSource` (optional)
- `lastSyncedAt` (optional)

#### Game notes
- `homeScore` and `awayScore` are required for championship bracket ranking support
- the Game table is the source of truth for actual results

---

### 10.3 Optional Sync Tracking

Recommended:
- `SyncRun`
  - `id`
  - `startedAt`
  - `completedAt`
  - `status`
  - `message`
  - `sourceUrl`

This is useful for NCAA result sync visibility and debugging.

---

## 11. Bracket UI Requirements

### 11.1 Main Bracket UI
Must support:
- full traditional NCAA bracket structure
- play-in section
- four regions
- all rounds through the championship

### 11.2 Second Chance Bracket UI
Must support:
- only Sweet Sixteen onward
- clean reduced layout
- obvious distinction from the full bracket

### 11.3 Championship Bracket UI
Must support:
- championship game winner pick
- score input for both teams
- clear score-prediction presentation in view mode

### 11.4 Component Design
Bracket UI should be built as reusable components with type-aware templates:
- `MAIN`
- `SECOND_CHANCE_S16`
- `CHAMPIONSHIP`

Do **not** hardcode the app around only the main bracket.

---

## 12. Validation Requirements

Use Zod validation for forms and mutations.

Validation expectations:
- participant name must be required and trimmed
- bracket type must be valid
- picks must match allowed game IDs for the selected bracket type
- later-round picks must depend on earlier selections where applicable
- championship score guesses must be numeric and valid
- generated entry name must not be user-editable

---

## 13. Result Sync Requirements

The app should support automated syncing from the NCAA scores page.

Current source:
- `https://www.ncaa.com/march-madness-live/scores`

### Sync requirements
- fetch public NCAA scores page
- parse completed games
- extract:
  - teams
  - winner
  - final scores
  - status
- match results to canonical internal game IDs
- update Game records
- recalculate standings for all bracket types
- store sync timestamps/logging

### Important note
The NCAA page is a public website, not a formal stable API.
Result syncing must be defensive and best-effort, with manual admin override available.

---

## 14. Scoring and Ranking Requirements

### 14.1 Main Bracket
Use round-based points as defined above.

Also calculate:
- total score
- correct picks count
- optional max possible remaining score

### 14.2 Second Chance Bracket
Use Sweet Sixteen onward point values as defined above.

### 14.3 Championship Bracket
Rank entries using:
1. correct winner
2. closeness to winner’s score
3. closeness to combined score

If needed internally, the app may compute helper ranking metrics, but public behavior should follow the ranking rules above.

---

## 15. Milestones

### Milestone 1 — App Shell and Route Scaffolding
Goal:
- create the base app shell
- scaffold the required routes
- build shared layout and placeholder pages

Delivered scope:
- public pages
- admin placeholders
- route structure
- shared navigation

---

### Milestone 2 — Authentication and Persistence Foundation
Goal:
- add Prisma and PostgreSQL
- add Auth.js credentials auth
- protect admin routes

Delivered scope:
- admin login
- protected admin pages
- database-backed persistence foundation

---

### Milestone 3 — Entry Management CRUD
Goal:
- implement database-backed entry management

Required scope:
- list entries
- create entries
- edit entries
- delete entries
- search/filter entries
- support bracket type selection
- auto-generate entry names from participant name + bracket type
- show bracket type in entries list

---

### Milestone 4 — Bracket Viewer and Editor
Goal:
- implement reusable bracket rendering/editing system

Required scope:
- editable bracket UI for admin entry creation/editing
- read-only bracket view page
- support bracket templates for:
  - Main
  - Second Chance Sweet Sixteen
  - Championship
- store picks in `picksJson`
- support championship score guess entry

Important:
Do not build Milestone 4 as a main-bracket-only architecture.

---

### Milestone 5 — Scoring Engine and Leaderboard
Goal:
- calculate and display standings correctly

Required scope:
- main bracket scoring
- second chance scoring
- championship ranking logic
- leaderboard tabs by bracket type
- correct picks count on main leaderboard only

---

### Milestone 6 — Admin Results Management
Goal:
- allow admin to record actual game outcomes manually

Required scope:
- winner selection
- game status
- actual final score entry
- enough functionality to resolve all bracket types correctly

---

### Milestone 7 — NCAA Result Sync
Goal:
- automate result updates from NCAA

Required scope:
- sync actual winners and final scores
- update Game records
- recalculate standings
- support all bracket types
- log sync runs/failures
- retain manual override flow

---

### Milestone 8 — Polish and Deployment
Goal:
- prepare the app for real company use

Recommended scope:
- responsive cleanup
- print-friendly bracket views
- empty/loading/error states
- README and env docs
- deployment hardening

---

## 16. Guardrails and Non-Goals

### Guardrails
- do not hardcode a single-bracket-only architecture
- keep bracket-type metadata centralized
- keep entry naming derived and server-side
- keep championship score guess logic isolated and explicit
- preserve clean milestone boundaries
- avoid unnecessary schema churn

### Non-goals for early milestones
- public self-service user accounts
- participant self-submission
- broad social or sharing features
- advanced analytics beyond leaderboard/stat tracking
- live websocket updates

---

## 17. Recommended Implementation Notes

- Use a dedicated bracket config module as the source of truth for:
  - canonical game IDs
  - rounds
  - regions
  - bracket templates
  - point systems
- Prefer reusable bracket components over one-off page logic
- Keep the leaderboard route stable and filter by bracket type
- Keep the admin results system flexible enough to support final score entry
- Prefer minimal, maintainable implementations milestone by milestone

---

## 18. Definition of Final Product Success

The final product is successful when:

- an admin can create and manage entries for all three bracket types
- the app stores bracket picks and championship score predictions correctly
- public users can view type-specific leaderboards
- public users can open saved read-only brackets
- standings are calculated correctly for main, second chance, and championship brackets
- actual NCAA results can be entered manually and synced automatically
- the architecture cleanly supports all three bracket products without major rework