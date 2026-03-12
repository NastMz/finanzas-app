# Project Structure and Conventions

Status: Active  
Scope: Entire monorepo

## 1. Goal

Define a stable monorepo structure, avoid flat folders, reduce ambiguous imports, and simplify onboarding.

This document closes Phase 1 of the roadmap and serves as the default reference for any new module.

## 2. Principles

- Every folder should represent a concrete responsibility.
- Shared logic belongs in `packages/`; hosts only compose and adapt.
- Cross-package imports use `@finanzas/*` aliases.
- Relative imports are only used inside the same package or app.
- If a folder starts mixing responsibilities, split it before it grows further.
- Orchestration modules with shared dependencies should live in classes or facades; free functions should remain for pure, local transformations.

## 3. Current Expected Structure

```text
apps/
  web/
    src/
      app/
      dev/
      features/
      ui/
  mobile/
    src/
      app/
  desktop/
    src/
      app/
packages/
  domain/
  application/
  data/
  sync/
  platform/
    platform-shared/
    platform-web/
    platform-mobile/
    platform-desktop/
  ui/
    src/
      models/
      service/
      design-system/
docs/
  adr/
```

## 4. What Goes Where

### `apps/web/src/app`

Web host entry points, bootstrap, context, and wiring.

Put here:

- `main.ts`
- `bootstrap.ts`
- `bootstrap.spec.ts`

Do not put here:

- screen UI implementation
- visual components
- domain business logic

### `apps/web/src/dev`

Local preview and visual-development-only tooling.

Put here:

- `dev-main.tsx`
- preview shells
- preview-only styles

Do not put here:

- production entry points
- use cases
- shared business-facing components

### `apps/web/src/features/<feature>`

Concrete implementation of each visual feature.

Recommended structure:

```text
features/<feature>/
  components/
  lib/
  <feature>-screen.tsx
  <feature>-screen.module.css
  <feature>-screen.spec.ts
```

Put here:

- screen components and feature-level render/load helpers
- feature-specific components
- feature-local helpers
- feature styles

Do not put here:

- host bootstrap
- global tokens

### `apps/web/src/ui`

Shared visual foundation for the web host.

Put here:

- generic components
- global foundations
- pure UI utilities

Do not put here:

- components tightly bound to a business feature

### `apps/mobile/src/app` and `apps/desktop/src/app`

Host bootstrap and composition.

Put here:

- `main.ts`
- `bootstrap.ts`
- `bootstrap.spec.ts`

Do not put here:

- concrete business features
- domain rules

### `packages/domain/src`

Pure domain model and invariants.

Put here:

- entities
- value objects
- domain errors

It must not import:

- `application`
- `data`
- `sync`
- `ui`
- `apps/*`

### `packages/application/src`

Use cases and system ports.

Put here:

- `use-cases/`
- application services that group use cases by context when a module needs an object-oriented API
- `ports.ts`
- application errors

Do not put here:

- concrete adapters
- visual components

### `packages/data/src`

Persistence implementations and data infrastructure utilities.

Put here:

- repositories
- ID generators
- in-memory or persistent adapters

### `packages/sync/src`

Everything related to synchronization.

Put here:

- sync adapters
- change appliers
- sync services that encapsulate local state and collaboration with remote APIs
- sync use cases
- sync contracts

### `packages/ui/src/models`

Shared contracts and view models for the headless UI layer.

Put here:

- tab types
- view models
- UI interaction types

### `packages/ui/src/service`

Headless shared UI orchestration.

Put here:

- `createFinanzasUiService`
- service facades that group commands, queries, and shared runtime state
- mappings from queries/commands to view models

### `packages/ui/src/design-system`

Tokens, primitives, and base assets for the shared visual system.

## 5. Naming Conventions

### Files

- Use `kebab-case` for TypeScript files and CSS Modules.
- File names should describe the exported module or primary responsibility.
- Keep tests next to the module with `.spec.ts` or `.spec.tsx`.
- React component styles should use the same basename: `component.tsx` + `component.module.css`.
- Barrels should only be named `index.ts`.

### Folders

- Use short, responsibility-based names: `app`, `dev`, `features`, `ui`, `components`, `lib`, `models`, `service`.
- Create a new folder when a group has a clear identity and more than one related file.
- Do not create `misc`, `utils`, or `shared` folders without a clear scope.

### Exports

- A module should have one primary responsibility.
- Use `index.ts` only at clear folder boundaries, not to hide confusing structures.
- If an export is only used inside one folder, keep it local instead of promoting it to a wider barrel.
- Reserve `create-*` names for composition roots or factories; orchestration logic should live inside the class or facade instantiated by those factories.

## 6. Import Rules Between Layers

### General rule

Imports should point inward in the architecture, not outward.

### Allowed

- `apps/*` -> `packages/*`
- `apps/web/src/app` -> `apps/web/src/features` and `apps/web/src/ui`
- `apps/web/src/features` -> `apps/web/src/ui`
- `packages/application` -> `packages/domain`
- `packages/data` -> `packages/application` and `packages/domain`
- `packages/sync` -> `packages/application` and `packages/domain`
- `packages/ui/src/service` -> `packages/application`, `packages/domain`, `packages/sync`

### Not allowed

- `packages/domain` importing any upper layer
- `packages/application` importing `data`, `sync`, visual `ui`, or `apps/*`
- `packages/ui` importing `apps/*`
- one host importing code from another host
- relative imports crossing between `apps/` and `packages/`

### Practical rule

- Inside the same package or app: use relative imports.
- Across packages: use `@finanzas/*` aliases.
- Between folders in the same host: use short, direct relative imports.

## 7. Quick Guide for New Modules

### If you add a use case

Location:

`packages/application/src/use-cases`

Checklist:

- create the use case file
- create a colocated spec
- export it from the package `index.ts` when appropriate

### If you add a new data adapter

Location:

`packages/data/src/<group>`

Checklist:

- keep dependencies pointing toward `application` and `domain`
- do not leak infrastructure details upward

### If you add a new sync capability

Location:

`packages/sync/src/<group>`

Checklist:

- separate `use-cases`, `adapters`, and `change-appliers` when appropriate
- add happy-path and error-path tests

### If you add a new web screen

Location:

- full implementation: `apps/web/src/features/<feature>`

Checklist:

- create `*-screen.tsx`
- create the matching `*.module.css`
- create a colocated `*.spec.ts`
- define `render*Screen` and/or `load*ScreenHtml` in the same feature when the tab needs it
- wire the loader from `app/main.ts` when applicable

### If you add shared visual components

Location:

- `apps/web/src/ui` if they are shared only in web
- `packages/ui` if they are shared headless contracts or design-system assets

## 8. Quick Folder Guide for Onboarding

| Path | Role |
| --- | --- |
| `apps/web/src/app` | bootstrap and wiring for the web host |
| `apps/web/src/dev` | local preview and visual development tooling |
| `apps/web/src/features` | feature implementation, screen renderers, and loaders |
| `apps/web/src/ui` | shared visual base for the web host |
| `apps/mobile/src/app` | bootstrap for the mobile host |
| `apps/desktop/src/app` | bootstrap for the desktop host |
| `packages/domain/src` | pure domain rules |
| `packages/application/src` | use cases and ports |
| `packages/data/src` | persistence and data utilities |
| `packages/sync/src` | synchronization and outbox |
| `packages/ui/src/models` | UI types and view models |
| `packages/ui/src/service` | headless UI service |
| `packages/ui/src/design-system` | tokens and visual system |
| `docs/adr` | architecture decisions |

## 9. Structural Review Checklist

Before adding a new folder or file, check:

- whether a folder with that responsibility already exists
- whether the name clearly describes its role
- whether the module depends only on allowed layers
- whether it needs a colocated test
- whether it should be exported through `index.ts` or remain local

## 10. Maintenance

- Update this document whenever the base repository structure changes.
- If a new convention becomes recurring, add it here before copying it elsewhere.
- If a structural rule needs automatic enforcement, the next step is to encode it in ESLint or another repository-level guard.
- Keep this document in English.
