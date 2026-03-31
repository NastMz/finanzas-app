# AGENTS.md

Local guide for agents working in `finanzas-app`. Read this file before exploring the repository broadly.

## Goal

Reduce unnecessary exploration and provide enough context to complete common tasks without re-discovering the architecture every time.

## Documentation Language

- Keep `AGENTS.md`, `README.md`, `docs/`, ADRs, and local skill docs in English.
- If a task changes repository documentation, keep the affected document fully in English instead of mixing languages.
- If a task adds a new feature or changes an existing one, update or create the relevant documentation.

## UI Language

- Only use neutral language in UI strings, don't use colloquial expressions or regionalisms.
- The texts must be user-friendly and clear, but not necessarily concise. It's better to be slightly verbose than to risk confusion.
- Never include technical terms or internal concepts in the UI. If a technical term is necessary, consider adding a user-friendly explanation or tooltip.

## Project Snapshot

- TypeScript monorepo with `npm workspaces`.
- Product: personal finance app with a local-first / offline-first model.
- Main host today: `apps/web` with Vite + React.
- `apps/mobile` and `apps/desktop` already depend on the shared core, but their real UI is still pending.
- Implemented capabilities include CRUD for accounts, categories, budgets, recurring rules, transaction templates, and transactions; import/export; account summary; outbox-based sync with cursor; IndexedDB and SQLite persistence; and shared headless UI.

## Read Only What You Need

Open these documents only when the task needs them:

- `README.md`: root commands, hooks, and current project summary.
- `ARCHITECTURE.md`: target architecture and high-level decisions.
- `docs/project-structure.md`: folder rules, imports, and naming conventions.
- `docs/ui-v1-flows.md`: UX flows and current tab expectations.
- `docs/roadmap.md`: what already exists and what is still pending.

## Quick Architecture Map

- `packages/domain`: pure entities and invariants.
- `packages/application`: use cases, ports, canonical surface factories, and public application surface types.
- `packages/data`: in-memory / IndexedDB / SQLite repositories, clocks, IDs, and the persistence schema manifest.
- `packages/sync`: canonical sync surface factories, `SyncNow`, `GetSyncStatus`, ports, and change appliers.
- `packages/platform/platform-shared`: shared bootstrap and context utilities across hosts.
- `packages/ui`: headless contracts / view models, `createFinanzasUiService`, and design tokens.
- `apps/web`: current visual host; `src/app/bootstrap.ts` and `src/app/main.ts` are the real composition roots.
- `apps/mobile` and `apps/desktop`: host wrappers around the shared core.

## Useful Entry Points

- `packages/application/src/create-finanzas-application-surface.ts`
- `packages/sync/src/create-finanzas-sync-surface.ts`
- `packages/platform/platform-shared/src/in-memory-bootstrap/compose-in-memory-bootstrap.ts`
- `packages/data/src/persistence/persistence-schema.ts`
- `packages/ui/src/service/create-finanzas-ui-service.ts`
- `apps/web/src/app/bootstrap.ts`
- `apps/web/src/app/main.ts`

## Hard Conventions

- Keep business logic in `packages/*`; `apps/*` should only compose adapters and render.
- Use `@finanzas/*` aliases across package boundaries. Use relative imports only inside the same package or app.
- Use `kebab-case` for TypeScript files and CSS Modules.
- Keep tests next to the module with `.spec.ts` or `.spec.tsx`.
- Treat local persistence as the source of truth. If a mutation affects synchronized entities, review outbox and sync implications.
- If the persisted schema changes, keep `packages/data/src/persistence`, IndexedDB, and SQLite aligned.
- Treat `packages/ui/src/service/create-finanzas-ui-service/finanzas-ui-service-facade.ts` as an intentional orchestrator, not a passive-wrapper cleanup candidate.
- Ignore `node_modules/` and `output/` unless the task is specifically about tooling or build output.

## Current Web Layout

- `apps/web/src/app`: bootstrap and host entry points.
- `apps/web/src/features`: tab/feature implementation, including `*-screen.tsx`, render/load helpers, and specs.
- `apps/web/src/ui`: shared web-host primitives and layout components.
- `apps/web/src/dev`: local preview and visual tooling.

## Validation Workflow

- Install dependencies: `npm install`
- Global lint: `npm run lint`
- Global typecheck: `npm run typecheck`
- Global test: `npm run test`
- Web preview: `npm run web:dev`
- `pre-commit` hook: `npm run lint:staged`
- `pre-push` hook: `npm run typecheck && npm run test`

Vitest resolves the root aliases and picks up `packages/**/*.spec.ts(x)` and `apps/**/*.spec.ts(x)`.

## Context Maintenance Decision

Before closing a task, explicitly assess whether repository guidance should change.

Update `AGENTS.md` when the task changes:

- architecture or package responsibilities
- repository structure or entry points
- root scripts, hooks, or workflow conventions
- long-lived validation expectations
- repository-wide documentation policy

Update an existing local skill when the task changes a reusable procedure that the skill already documents.

Recommend a new skill when the task introduces a non-obvious, repeatable workflow that is likely to recur and would save future exploration.

If no update is needed, say so briefly in the final response instead of staying silent.

## Commit Convention

Recent history uses conventional commits with scopes, for example:

- `feat(data): ...`
- `refactor(structure): ...`

Common scopes: `web`, `ui`, `data`, `sync`, `platform`, `application`, `domain`, `docs`, `structure`.

## Local Skills

These skills live in `.codex/skills` and are intended for recurring repository tasks:

- `finanzas-repo-checks`: choose and run the smallest useful validation set. File: `.codex/skills/finanzas-repo-checks/SKILL.md`
- `finanzas-feature-slice`: implement end-to-end changes without breaking the layer boundaries. File: `.codex/skills/finanzas-feature-slice/SKILL.md`
- `finanzas-sync-persistence`: work on sync, outbox, IndexedDB, or SQLite. File: `.codex/skills/finanzas-sync-persistence/SKILL.md`
- `finanzas-commit-workflow`: prepare commits that fit the repo hooks and conventions. File: `.codex/skills/finanzas-commit-workflow/SKILL.md`

## Skill Usage

- If a task names a skill or clearly matches one, open its `SKILL.md` first.
- Use the smallest set of skills that covers the task.
- Prefer these documents and entry points before broad recursive exploration.
- If a convention changes, update `AGENTS.md` and the affected skill in the same change whenever practical.
