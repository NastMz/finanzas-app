---
name: finanzas-feature-slice
description: Implement or update a product slice in finanzas-app across the clean-architecture layers. Use when adding or modifying business rules, use cases, sync-aware mutations, headless UI queries or commands, or web screens and feature modules in this monorepo.
---

# Finanzas Feature Slice

## Workflow

1. Map the request to the right layer before editing.

- `packages/domain`: entities, value objects, invariants.
- `packages/application`: use cases, ports, canonical surface factories, and explicit application surface contracts.
- `packages/data`: repositories, ids, clocks, IndexedDB, SQLite, schema manifest.
- `packages/sync`: sync ports, `SyncNow`, `GetSyncStatus`, change appliers.
- `packages/ui`: headless view models and `createFinanzasUiService`.
- `apps/*`: host wiring and rendering, mainly `apps/web`.

2. Implement from inside out.

- Change the innermost necessary layer first and then expose it outward.
- Skip untouched layers. Not every task needs UI, sync, or persistence updates.
- Keep `apps/*` thin. Do not move business logic into hosts.

3. Respect the repo conventions while wiring the slice.

- Use `@finanzas/*` aliases across package boundaries.
- Use relative imports only inside the same package or app.
- Use `kebab-case` for files and colocated `.spec.ts` or `.spec.tsx` tests.
- Keep the public entrypoints in sync when adding new exports.

4. Use the canonical surfaces and preserve only real orchestrators.

- Route business operations through `createFinanzasApplicationSurface` and the exported application surface types.
- Route sync status/actions through `createFinanzasSyncSurface` and the exported sync surface types.
- Route tab/view-model logic through `createFinanzasUiService`.
- Compose platform bootstrap contracts from explicit surface contracts, not from removed legacy wrapper classes.
- Keep `packages/ui/src/service/create-finanzas-ui-service/finanzas-ui-service-facade.ts` as a valid exception because it adds real orchestration.
- Treat `apps/web/src/app/bootstrap.ts` and `apps/web/src/app/main.ts` as the current web composition root.

5. Check project docs only where they add task-specific context.

- Read `docs/ui-v1-flows.md` before changing tab behavior, copy, or UX expectations.
- Read `docs/roadmap.md` before implementing work that may already be pending or partially done.
- Read `docs/project-structure.md` for naming/import rules and the current `app` + `features` + `ui` + `dev` layout in `apps/web`.

6. Update the nearest tests and docs.

- Add or update the closest spec file for each touched layer.
- Update `README.md`, `docs/roadmap.md`, or `ARCHITECTURE.md` when the behavior or structure changes in a lasting way.
- After changing architecture, repo workflow, or reusable agent context, explicitly decide whether to update `AGENTS.md`, update an existing skill, or recommend a new skill.

## Slice checklists

### New mutation or command

- Validate the domain rule or invariant first.
- Add or update the application use case.
- Consider outbox payloads if the entity is synchronized.
- Update persistence adapters if new fields must be stored.
- Expose the action through headless UI and the host only if the user flow needs it.

### New read model or screen

- Start from application query data, not from UI-only state.
- Map the result into `packages/ui` contracts if it belongs to a shared tab flow.
- Render it in `apps/web/src/features/<feature>` and keep host-level wiring in `apps/web/src/app`.
