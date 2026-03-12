---
name: finanzas-repo-checks
description: Run and interpret validation for the finanzas-app monorepo. Use when a task in this repository asks to run tests, lint, typecheck, pre-push checks, or to decide the smallest useful verification set after touching files in apps/* or packages/*.
---

# Finanzas Repo Checks

## Workflow

1. Classify the change.

- Docs-only changes usually do not need code checks unless the user asks for them.
- Single-module changes should start with the nearest spec file.
- Cross-layer changes, shared facades, config files, or package entrypoints usually need full repo validation.

2. Run the smallest useful command first.

- Run one spec file with `npm run test -- <path-to-spec>`.
- Run the whole test suite with `npm run test`.
- Run type safety with `npm run typecheck`.
- Run lint with `npm run lint`.
- Run the web preview with `npm run web:dev` when the task needs interactive verification.

3. Escalate when the blast radius grows.

- If a change touches exported types, aliases, package manifests, repo config, or shared services such as `application`, `sync`, `ui`, or `platform-shared`, run at least `npm run typecheck` plus the relevant tests.
- If a change spans multiple layers or affects runtime wiring, finish with `npm run lint`, `npm run typecheck`, and `npm run test`.

4. Align with hooks before calling the task validated.

- Expect `pre-commit` to run `npm run lint:staged`.
- Expect `pre-push` to run `npm run typecheck && npm run test`.
- Do not claim validation parity with the repo if those commands were not considered after meaningful code edits.
- When docs, structure, scripts, hooks, or reusable workflows changed, explicitly assess whether `AGENTS.md` or a local skill should be updated.

## Repo-specific notes

- Vitest includes `packages/**/*.spec.ts(x)` and `apps/**/*.spec.ts(x)`.
- The root TypeScript config covers all `packages/**/*` and `apps/**/*`.
- There are no stable per-workspace `lint`, `test`, or `typecheck` scripts yet; prefer root commands.
- Ignore `node_modules/` and `output/` when choosing validation targets.
- If the task changes repository guidance and no update is needed in `AGENTS.md` or a skill, say so explicitly in the final response.

## Common targets

- Domain and application logic: `packages/<name>/src/**/*.spec.ts`
- Persistence and migrations: `packages/data/src/**/*.spec.ts`
- Sync and outbox: `packages/sync/src/**/*.spec.ts`
- Web features: `apps/web/src/**/*.spec.tsx` and `apps/web/src/**/*.spec.ts`
