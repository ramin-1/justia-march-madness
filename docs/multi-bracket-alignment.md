# Multi-Bracket Architecture Alignment Notes (Planning Pass)

## Purpose

This is a planning-only alignment note after the product spec update that requires three bracket products:

- `MAIN`
- `SECOND_CHANCE_S16`
- `CHAMPIONSHIP`

No milestone feature implementation is included in this pass.

## Current Single-Bracket Assumptions and Risks

### 1) Bracket type support
- Current `Entry` model has no `bracketType` field.
- Current validation and forms accept only `participantName`.
- Current list/filter pages do not support filtering by bracket type.

Risk:
- Future behavior may be bolted on inconsistently unless bracket type becomes a first-class field across schema, validation, routes, and UI state.

### 2) Type-specific entry naming
- Current server naming helper generates only `"{participantName}'s Bracket"`.

Risk:
- Naming cannot meet spec-required type-derived names:
  - `"{Participant Name}'s Main Bracket"`
  - `"{Participant Name}'s Second Chance Bracket"`
  - `"{Participant Name}'s Championship Bracket"`

### 3) Multiple leaderboard tabs
- Current `/leaderboard` is a static placeholder table with no tab/filter behavior.

Risk:
- Leaderboard APIs and rendering contracts may become fragmented if tabs/filter semantics are not defined centrally (`?type=...`).

### 4) Second Chance bracket templates
- Current bracket config (`lib/bracket-config.ts`) exposes one flat `BRACKET_GAMES` list.
- Current bracket placeholder UI assumes a full-region bracket shape.

Risk:
- Second Chance (Sweet Sixteen onward only) can be incorrectly coupled to the full bracket layout and validation rules.

### 5) Championship score-guess support
- Current `Entry` model does not include a dedicated championship tiebreak/score guess field.
- Current forms and validation have no score-guess inputs.

Risk:
- Championship predictions may be forced into ad hoc `picksJson` shapes, making ranking and validation brittle.

### 6) Score-based championship ranking
- Current scoring utility (`lib/scoring.ts`) is points-per-round only.
- No ranking comparator exists for championship winner/score-closeness rules.

Risk:
- Attempting to reuse points scoring for championship ranking would violate spec behavior.

## Codebase Areas Likely to Need Changes

- `prisma/schema.prisma`
  - Add `bracketType` enum/value support on `Entry`.
  - Add `correctPicks` and championship tiebreak prediction storage (per spec).
  - Add `homeScore`/`awayScore` on `Game` if missing for championship ranking inputs.
- `lib/entries/validation.ts`
  - Add bracket-type validation and type-aware naming helper.
  - Add championship score guess validation.
- `app/entries/actions.ts`
  - Persist `bracketType` and generate type-specific entry names server-side.
- `components/entry-form.tsx` and entries pages
  - Add bracket type selection and type-aware form sections.
- `app/entries/page.tsx`
  - Add bracket type column/filter.
- `app/leaderboard/page.tsx`
  - Add bracket-type tabs/filters and type-specific columns/logic.
- `app/bracket/[id]/page.tsx` + bracket components
  - Route rendering by `entry.bracketType` with template-specific read-only views.
- `lib/bracket-config.ts`
  - Convert from single list to type-aware bracket templates/config.
- `lib/scoring.ts`
  - Split main/second-chance points scoring from championship ranking logic.
- `prisma/seed.ts`
  - Seed canonical games usable by all templates; avoid per-type duplicate game tables.

## Milestone 4 Adjustment Recommendations

1. Treat bracket type as a required input/output contract for bracket editor/viewer components.
2. Introduce a centralized bracket template registry keyed by `bracketType`.
3. Keep one canonical NCAA game dataset; templates select subsets of game IDs.
4. Keep championship score-guess logic isolated from generic bracket pick logic.
5. Keep entry naming derived server-side from `(participantName, bracketType)`.
6. Define stable serialized shapes for `picksJson` and championship tiebreak data before UI expansion.
7. Build viewer/editor component interfaces that are type-aware from day one (avoid main-only props).
8. Keep Milestone 4 focused on bracket UI/editing + persistence shape compatibility, not full scoring/ranking rollout.

## Proposed Serialized JSON Shapes (Planning Only)

These are proposed persistence contracts for Milestone 4+ implementation. They are intentionally planning-oriented and are not implemented in this pass.

### Shared conventions
- `picksJson` always stores bracket picks.
- `tiebreakerJson` stores extra ranking/tiebreak data when needed; otherwise `null`.
- Both objects include `schemaVersion` for forward compatibility.
- Picks should store canonical winner references as `winnerTeamKey` (not display names).
- `winnerTeamKey` should come from a stable internal team identifier contract that scoring/sync/rendering can share.
- Championship predicted scores should be keyed by team key (`predictedScoresByTeamKey`) so storage does not depend on home/away labeling.

### `MAIN`

`picksJson`:

```json
{
  "schemaVersion": 1,
  "bracketType": "MAIN",
  "picksByGameId": {
    "PLAYIN_G1": { "winnerTeamKey": "TEAM_A" },
    "EAST_R1_G1": { "winnerTeamKey": "TEAM_B" },
    "CHAMPIONSHIP_G1": { "winnerTeamKey": "TEAM_Z" }
  }
}
```

`tiebreakerJson`:

```json
null
```

### `SECOND_CHANCE_S16`

`picksJson`:

```json
{
  "schemaVersion": 1,
  "bracketType": "SECOND_CHANCE_S16",
  "picksByGameId": {
    "S16_EAST_G1": { "winnerTeamKey": "TEAM_A" },
    "ELITE8_WEST_G1": { "winnerTeamKey": "TEAM_B" },
    "CHAMPIONSHIP_G1": { "winnerTeamKey": "TEAM_Z" }
  }
}
```

`tiebreakerJson`:

```json
null
```

### `CHAMPIONSHIP`

`picksJson`:

```json
{
  "schemaVersion": 1,
  "bracketType": "CHAMPIONSHIP",
  "picksByGameId": {
    "CHAMPIONSHIP_G1": { "winnerTeamKey": "TEAM_Z" }
  }
}
```

`tiebreakerJson`:

```json
{
  "schemaVersion": 1,
  "championship": {
    "championshipGameId": "CHAMPIONSHIP_G1",
    "predictedScoresByTeamKey": {
      "TEAM_X": 72,
      "TEAM_Z": 68
    }
  }
}
```

Notes:
- Predicted scores should be integers validated server-side.
- Ranking logic can derive helper metrics (winner-score delta, total-score delta) at read/compute time instead of storing them in JSON.
- `CHAMPIONSHIP` keeps winner pick in `picksJson` and score guesses in `tiebreakerJson` to keep concerns separated.
- Canonical team keys avoid brittle name-string comparisons and reduce sync/display normalization risk.
- Team-key score mapping avoids home/away inversion bugs when provider labels or bracket rendering orientation differ.

## Guardrail for Future Work

Do not hardcode a single main-bracket-only architecture. Any new bracket-related interfaces, config modules, and persistence contracts should support `MAIN`, `SECOND_CHANCE_S16`, and `CHAMPIONSHIP` explicitly.
