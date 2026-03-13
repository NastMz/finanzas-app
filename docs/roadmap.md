# Implementation Roadmap

Living document used to track what is implemented and what remains pending in the project.

## Status Convention

- `[x]` Implemented
- `[~]` In progress or partial
- `[ ]` Pending

## Phase 1. Monorepo Foundations

### Goal

Establish the technical base of the project so it can grow without mixing responsibilities between apps, packages, and documentation.

### Overall status

`[x]` Completed

### Implemented

- `[x]` Monorepo with workspaces for `apps/*`, `packages/*`, and `packages/platform/*`
- `[x]` Initial separation between `domain`, `application`, `data`, `sync`, `ui`, and `platform-shared`
- `[x]` Base ADRs for architecture, local-first sync, ports/adapters, minor units, and tombstones
- `[x]` Structure reorganization to reduce flat folders in `apps/web`, `apps/mobile`, `apps/desktop`, and `packages/ui`
- `[x]` Base development, test, and typecheck commands documented
- `[x]` Git hooks for pre-commit and pre-push validation
- `[x]` Naming and module-location conventions documented
- `[x]` Import rules between layers documented
- `[x]` Short folder-structure onboarding guide documented

## Phase 2. Local-First Finance Core

### Goal

Cover the core domain and the operational use cases for daily money management.

### Overall status

`[x]` Completed

### Implemented

- `[x]` Core domain entities for accounts, categories, transactions, and money
- `[x]` Account CRUD use cases
- `[x]` Category/period budgets
- `[x]` Category CRUD use cases
- `[x]` Recurring rules and transaction templates
- `[x]` Transaction CRUD use cases
- `[x]` Bulk-edit or quick-action use cases for transactions
- `[x]` Data import and export
- `[x]` Account summary by period with totals, top categories, and recent items
- `[x]` Additional validation for multi-currency scenarios
- `[x]` Soft delete with tombstones
- `[x]` Purpose-specific typed IDs and generators for runtime and tests
- `[x]` In-memory adapters for development and testing

## Phase 3. Sync and Real Persistence

### Goal

Move from a flow validated in memory to a robust local persistence and synchronization base that is useful in real scenarios.

### Overall status

`[~]` Initial core implemented

### Implemented

- `[x]` Local outbox with `pending`, `sent`, `acked`, and `failed` states
- `[x]` `SyncNow` use case
- `[x]` `GetSyncStatus` for UI
- `[x]` Incremental push/pull with cursor
- `[x]` Remote change application for accounts, categories, budgets, templates, recurring rules, and transactions
- `[x]` In-memory sync client for tests
- `[x]` Real web persistence on IndexedDB
- `[x]` Real mobile and desktop persistence on SQLite
- `[x]` Versioned migration mechanism for IndexedDB and SQLite from a shared schema manifest

### Pending

- `[ ]` Initial deployable sync backend shipped alongside the web host on Vercel
- `[ ]` More complete retry and backoff policy for sync
- `[ ]` Explicit conflict handling strategy per entity
- `[ ]` Conflict-resolution UI
- `[ ]` Automatic synchronization when connectivity returns
- `[ ]` Per-operation tracing and debugging for sync failures

## Phase 4. Shared UI Layer

### Goal

Consolidate a reusable headless UI layer across hosts and a coherent design-system base.

### Overall status

`[~]` Base implemented

### Implemented

- `[x]` `createFinanzasUiService` in `@finanzas/ui`
- `[x]` View models for `Home`, `Movements`, `Register`, and `Account`
- `[x]` Host wrappers consuming the headless UI
- `[x]` Shared design tokens
- `[x]` Initial web visual system and main layout refactor
- `[x]` Web v1 screens in React for dashboard, movements, register, and account

### Pending

- `[ ]` Consolidate reusable shared components across views
- `[ ]` Document the design system and its core decisions
- `[ ]` Define empty, loading, and error states consistently
- `[ ]` Add accessibility as an explicit checklist per component
- `[ ]` Add stories or an isolated preview environment for components

## Phase 5. Web Product Experience

### Goal

Take the web experience from preview mode to an operable end-to-end application, including the prerequisites for real transaction capture.

### Overall status

`[~]` In progress

### Implemented

- `[x]` Main navigation shell for the preview
- `[x]` Clearer visual hierarchy for daily money management
- `[x]` Responsive desktop and mobile preview views
- `[x]` HTML screen rendering from the UI layer
- `[x]` Real quick-add and basic edit/delete flows for `Register` and `Movements` in the web host, with local-first feedback states
- `[x]` Canonical category management in `Account`, with explicit per-type coverage (`empty | partial | ready`) and creation for missing `expense` or `income` kinds
- `[x]` Onboarding and guarded recovery in `Register` and `Movements`, so blocked flows can recover without pretending those tabs own category management

### Pending

- `[ ]` Migrate `apps/web` from Vite to Next.js while keeping the finance app as a client-side SPA
- `[ ]` Expose initial backend endpoints from the web host for monolithic deployment on Vercel
- `[ ]` Keep the web host as a transport/delivery layer without moving domain logic or use cases out of `packages/*`
- `[~]` Real transaction capture and edit forms
- `[ ]` Real filters in `Movements`
- `[ ]` Search, sorting, and segmentation by account/category/date
- `[ ]` Sync actions from the UI
- `[~]` Loading, saving, and error feedback for user actions
- `[ ]` Real application navigation beyond the development preview
- `[ ]` PWA support

## Phase 6. Mobile and Desktop Hosts

### Goal

Extend the shared core to real per-platform experiences without duplicating logic.

### Overall status

`[~]` Base bootstrap implemented

### Implemented

- `[x]` Shared bootstrap/context on top of `platform-shared`
- `[x]` Base wrappers for web, mobile, and desktop
- `[x]` Host bootstrap smoke tests

### Pending

- `[ ]` Real mobile UI
- `[ ]` Real desktop UI
- `[ ]` Secure storage integration per platform
- `[ ]` Integration of relevant native capabilities
- `[ ]` Packaging and distribution strategy per host

## Phase 7. Security and User Account

### Goal

Close the remaining pieces needed to handle financial data responsibly.

### Overall status

`[ ]` Pending

### Pending

- `[ ]` Authentication model
- `[ ]` Secure token/session handling per host
- `[ ]` App lock with PIN or biometrics
- `[ ]` Secret policies per platform
- `[ ]` Hardening of sync and security validations

## Phase 8. Observability, Quality, and Operations

### Goal

Provide diagnostic, monitoring, and continuous quality control capabilities.

### Overall status

`[~]` Partial base

### Implemented

- `[x]` Unit test suite with Vitest
- `[x]` Typecheck as a required validation

### Pending

- `[ ]` Stable lint as part of the daily workflow
- `[ ]` Define per-workspace scripts (`build`, `dev`, `lint`, `test`, `typecheck`) as an orchestration prerequisite
- `[ ]` Adopt `Turborepo` for incremental execution and local/remote cache in the monorepo
- `[ ]` Cross-cutting structured telemetry
- `[ ]` Test coverage for complex sync scenarios
- `[ ]` End-to-end tests for critical flows
- `[ ]` Performance measurement for startup and large lists
- `[ ]` Regression checklist before releases

## Phase 9. Future Product Capabilities

### Goal

Track what is not a priority now but should remain visible.

### Overall status

`[ ]` Pending

### Pending

- `[ ]` Visual budgets and alerts
- `[ ]` Reports and trends
- `[ ]` Automations and rules
- `[ ]` Banking integrations
- `[ ]` Multi-user / collaboration
- `[ ]` E2EE as a future extension

## Roadmap Maintenance Rules

- Every meaningful architecture, domain, or UI change should update this document.
- When a phase advances, move items from pending to implemented in the same PR.
- If a new workstream appears, add it as a phase or sub-phase instead of leaving it only in conversations.
