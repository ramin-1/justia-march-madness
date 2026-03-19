# Task: Next.js 16.2 Compatibility Pass

## Plan
- [x] Re-read repo instructions/spec/tasks and workflow skill guidance before compatibility edits.
- [x] Run baseline validation (`npm install`, `typecheck`, `lint`, `build`) to identify real Next 16.2 breakages.
- [x] Migrate linting from deprecated `next lint` usage to ESLint CLI with Next 16-compatible config.
- [x] Verify Next 16 config/types behavior changes and keep only required updates.
- [x] Re-run `npm run typecheck`, `npm run lint`, and `npm run build`.
- [x] Validate `npm run dev` behavior in this environment and record constraints if sandbox-limited.
- [x] Update docs minimally for any command/config changes required by Next 16.2.

## Progress Notes
- 2026-03-18 23:03 PDT - Reviewed `AGENTS.md`, `project_spec`, `tasks/*`, and `.agents/skills/workflow-orchestration/SKILL.md`.
- 2026-03-18 23:04 PDT - Baseline check: `npm run typecheck` passed; `npm run lint` failed because `next lint` is no longer valid in Next 16 (`Invalid project directory .../lint`).
- 2026-03-18 23:05 PDT - `npm run build` succeeded outside sandbox restrictions; failure inside sandbox was environment-related (Turbopack process binding permissions).
- 2026-03-18 23:09 PDT - Migrated lint flow to ESLint CLI (`eslint .`) with new flat `eslint.config.mjs`; removed legacy `.eslintrc.json`.
- 2026-03-18 23:11 PDT - Fixed lint-blocking `no-explicit-any` in sync service by narrowing rounds with a type guard; cleaned two warning-level lint issues.
- 2026-03-18 23:13 PDT - Final verification passed: `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run dev` (dev/build required non-sandbox execution for port/process permissions in this environment).

## Review
Completed focused Next.js 16.2 compatibility pass without adding new product features. Main fix was replacing deprecated `next lint` usage with ESLint CLI + flat config, plus minimal lint/type safety updates needed for clean validation.
