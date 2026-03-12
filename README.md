# Finanzas App

Initial project bootstrap based on `ARCHITECTURE.md` and the approved ADRs.

## Current Snapshot

- Monorepo with shared apps and packages.
- Implemented packages: `domain`, `application`, `data`, `sync`, `ui`, and `platform-shared`.
- Current use cases:
  - Accounts: `AddAccount`, `UpdateAccount`, `DeleteAccount` (tombstones), `ListAccounts`.
  - Categories: `AddCategory`, `UpdateCategory`, `DeleteCategory` (tombstones), `ListCategories`.
  - Transactions: `AddTransaction`, `UpdateTransaction`, `DeleteTransaction` (tombstones), `ListTransactions`, `GetAccountSummary` (totals + top categories + recent items by range).
- Initial `SyncNow` engine with push/pull flow, outbox states, incremental cursor handling, and remote change application for accounts, categories, and transactions.
- `GetSyncStatus` query for UI state (`synced`, `pending`, `error`) with outbox counts by status and the current cursor.
- In-memory adapters to validate the offline-first flow during development and tests.
- Real web persistence on IndexedDB to preserve entities, outbox state, and cursor data across browser sessions.
- Real mobile and desktop persistence on SQLite with host-configurable paths.
- Versioned persistence migrations for IndexedDB and SQLite from a shared schema manifest, including legacy schema upgrades with version metadata and applied-history tracking.
- Purpose-specific ID strategy to avoid generic strings (`account`, `category`, `transaction`, `outbox-op`), with ULID generation for normal runtime and deterministic sequence generation for tests.
- Shared utilities to avoid host duplication: `createUlidIdGenerator` in `@finanzas/data` and `createInMemorySyncApiClient` in `@finanzas/sync`.
- Shared in-memory bootstrap/context in `@finanzas/platform-shared` for `web`, `desktop`, and `mobile`.
- Host entry points expose `app`, `commands`, and `queries` declaratively from `main.ts`, without extra context wrapper layers.
- Shared headless UI layer in `@finanzas/ui` (`createFinanzasUiService`) with explicit dependency selection per host to materialize the v1 tabs in a web-first, reusable way.
- Initial shared design system (color/spacing/typography tokens in `@finanzas/ui`) plus the web global reset, and a refactored React home screen with atomic, reusable components for a consistent financial dashboard across hosts.
- Initial unit test suite with Vitest.

## Commands

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run web:dev
```

## Git Hooks

- The `pre-commit` hook runs `npm run lint:staged`.
- The `pre-push` hook runs `npm run typecheck && npm run test`.
- `lint-staged` runs ESLint on staged `*.ts` files before commit.

## Working Docs

- Mobile-first UI flows and guidelines: `docs/ui-v1-flows.md`
- Phase roadmap, progress, and pending work: `docs/roadmap.md`
- Monorepo structure, conventions, and import rules: `docs/project-structure.md`

## Documentation Policy

- Keep repository documentation in English.
- When a task changes architecture, workflow, or reusable conventions, update the relevant docs in the same change.
