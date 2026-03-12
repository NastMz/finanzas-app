---
name: finanzas-sync-persistence
description: Change offline-first persistence or sync behavior in finanzas-app. Use when touching IndexedDB or SQLite repositories, the persistence schema manifest, outbox ops, sync cursors, change appliers, SyncNow, GetSyncStatus, or host bootstrap logic that chooses storage backends.
---

# Finanzas Sync Persistence

## Workflow

1. Start from the source-of-truth files for the task.

- `packages/data/src/persistence/persistence-schema.ts`
- `packages/data/src/indexeddb/*`
- `packages/data/src/sqlite/*`
- `packages/sync/src/use-cases/*`
- `packages/sync/src/change-appliers/*`
- `packages/platform/platform-shared/src/*`
- `apps/web/src/app/bootstrap.ts`

2. Preserve the offline-first model.

- Local persistence is the source of truth.
- Mutations persist locally and usually enqueue outbox operations.
- Sync uses push/pull with an opaque cursor.
- Remote changes land through entity-specific change appliers.
- Web falls back to in-memory only when `indexedDB` is unavailable.
- Mobile and desktop are expected to use SQLite-backed contexts.

3. Change schema and storage in lockstep.

- Update the shared schema manifest first.
- Keep IndexedDB and SQLite implementations aligned.
- Preserve seed/default assumptions such as account `acc-main` and cursor `"0"` unless the change intentionally updates all consumers and tests.

4. Keep sync semantics consistent across layers.

- Keep entity type names aligned between outbox payloads, sync DTOs, and change appliers.
- Update both happy-path and error/conflict tests when changing `SyncNow` or `GetSyncStatus`.
- If adding a synchronized entity, add its repository wiring and change applier.

5. Validate in the right order.

- Run targeted data/sync specs first.
- Run `npm run typecheck` whenever ports, DTOs, aliases, or exported types change.
- Run `npm run test` after cross-cutting persistence or sync changes.
- If the change alters sync architecture, storage responsibilities, or reusable troubleshooting steps, explicitly assess whether `AGENTS.md` or a local skill needs an update.

## Watchpoints

- `packages/application` owns mutation semantics; do not duplicate that logic in sync adapters.
- `packages/ui` should translate sync status into view models, not hold protocol details.
- If a change affects import/export or recurring rules, inspect `packages/application/src/use-cases/shared` as well.
