# NCAA Result Sync Notes

## Principles

- Import into local `Game` rows.
- Never trust scraping as the only update path.
- Keep sync idempotent.
- Skip ambiguous matches instead of guessing.

## Planned flow

1. Fetch NCAA scores HTML.
2. Parse completed games only.
3. Normalize team names.
4. Match against local `Game` rows.
5. Update winners and timestamps.
6. Recalculate entry scores.
7. Write a `SyncRun` record.

## Admin expectations

- Show the latest sync time.
- Show any unmatched or ambiguous games.
- Allow manual correction from `/admin/results`.
