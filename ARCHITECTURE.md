# Personal Finance App Architecture

Status: Approved  
Version: 1.0  
Date: 2026-03-02

## 1. Purpose and Scope

This document defines the target architecture for a personal finance app with a web-core, local-first approach, and cloud synchronization.

System goals:

- Multi-platform: Web, Mobile, and Desktop from a single codebase.
- Offline-first: full CRUD operations without connectivity.
- Multi-device synchronization with eventual convergence.
- Platform-specific security (app lock and secrets in secure stores).
- Host evolution without lock-in (Capacitor, Electron, or Tauri can be swapped).

Out of scope for this phase:

- Automated banking integration (open banking).
- Advanced collaborative multi-user budgeting.
- Full E2EE encryption (left as a future extension point).

## 2. Non-Functional Requirements

| ID | Requirement | Target criterion |
| --- | --- | --- |
| NFR-01 | Startup performance | First meaningful render under 2s on a mid-range device, with an immediate skeleton |
| NFR-02 | Offline support | Financial CRUD available without network |
| NFR-03 | Sync | Eventual convergence, with detectable and resolvable conflicts |
| NFR-04 | Security | Optional lock, secrets in secure storage, no plaintext tokens |
| NFR-05 | Observability | Structured logging and sync/error traces across all platforms |

## 3. High-Level Architecture

### 3.1 Architectural style

Hexagonal / Clean architecture is applied to the frontend:

- **Domain**: pure entities and rules (`Money`, `Transaction`, `Budget`, invariants).
- **Application**: use cases (`AddTransaction`, `SetBudget`, `SyncNow`, `UnlockApp`).
- **Ports**: interfaces required by the application (repositories, secrets, network, clock, notifications).
- **Adapters**: concrete implementations for persistence, remote sync, and platform services.

Main rule: the UI consumes `Application`; it does not talk directly to plugins, HTTP clients, or host SDKs.

### 3.2 Logical layer view

```text
UI
 -> Application (use cases)
    -> Domain (rules)
    -> Ports (interfaces)
       -> Adapters
          -> Local DB (IndexedDB/SQLite)
          -> Remote Sync API (push/pull)
          -> Platform services (web/mobile/desktop)
```

### 3.3 Multi-platform hosts

| Platform | Host | Role |
| --- | --- | --- |
| Web | SPA/PWA | Web delivery and browser APIs |
| Mobile | Capacitor | WebView + native plugins |
| Desktop | Electron or Tauri | Desktop shell + OS integrations |

The host is treated as infrastructure. Business logic lives in shared packages.

## 4. Repository Structure (Monorepo)

```text
apps/
  web/
  mobile/
  desktop/
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
  telemetry/
docs/
  adr/
```

Rule: `apps/*` should only compose dependencies, configure adapters, and bootstrap the platform.

See `docs/project-structure.md` for location, naming, and import conventions.

## 5. Domain and Data Model

### 5.1 Main entities

```text
Money {
  amountMinor: int64
  currency: string
}

Account {
  id, name, type, currency
}

Transaction {
  id, accountId, amount: Money, date, categoryId, note?, tags[]
}

Category {
  id, name, type: income|expense
}

Budget {
  month, categoryId, limit: Money
}

RecurringRule {
  id, schedule, templateTransactionId
}
```

### 5.2 Invariants

- `amount != 0`.
- Every transaction references an existing account.
- Currency must match the account (or require explicit conversion).
- A budget is unique per `(month, categoryId)`.

## 6. Local Persistence (Source of Truth)

### 6.1 Engine per platform

- Web: IndexedDB.
- Mobile/Desktop: SQLite.

### 6.2 Minimum conceptual schema

- `accounts`
- `transactions`
- `categories`
- `budgets`
- `recurring_rules`
- `outbox_ops`
- `sync_state`

Base fields per entity:

- `id`
- `createdAt`, `updatedAt`
- `deletedAt` (tombstone recommended)
- `version` (server version when available)

## 7. Cloud Synchronization

### 7.1 Principles

- Local-first with eventual convergence.
- Every user action persists locally and produces an outbox operation.
- The sync engine attempts `push` when connectivity is available.
- The client performs incremental `pull` by cursor.

### 7.2 Model

Recommended model: per-user server-side change log with opaque cursors.

Flow:

1. The client sends idempotent operations (`push`).
2. The server validates, applies them, and writes changes to the log.
3. The client requests changes since `cursor` (`pull`).
4. The client applies the changes and updates `nextCursor`.

### 7.3 Outbox operation

```text
OutboxOp {
  opId: UUID
  deviceId: string
  entityType: string
  entityId: string
  opType: create|update|delete
  payload: json
  baseVersion?: string|number
  createdAt: datetime
  status: pending|sent|acked|failed
  attemptCount: number
  lastError?: string
}
```

### 7.4 Synchronization API

`POST /sync/push`

```json
{
  "deviceId": "string",
  "ops": []
}
```

```json
{
  "ackedOpIds": [],
  "conflicts": [],
  "serverTime": "datetime"
}
```

`POST /sync/pull`

```json
{
  "deviceId": "string",
  "cursor": "opaque-token"
}
```

```json
{
  "nextCursor": "opaque-token",
  "changes": []
}
```

Typical change DTO:

```text
ChangeDTO {
  changeId,
  entityType,
  entityId,
  opType,
  entitySnapshot|delta,
  serverVersion,
  serverTimestamp
}
```

### 7.5 Conflicts

Baseline policy:

- `Transaction`: conflict when `baseVersion != currentVersion`.
- Metadata (categories, notes): LWW with tie-breaker `(serverTimestamp, deviceId)`.

UX resolution:

- Notify the user when a conflict is detected.
- Show a simple local-vs-remote diff.
- Offer: keep local, keep remote, or duplicate as new.

## 8. Security

### 8.1 Authentication

- JWT access/refresh or server-side sessions.
- Mobile: secrets in Keychain/Keystore.
- Desktop: OS vault or equivalent encryption layer.
- Web: prefer httpOnly cookies when the backend allows it.

### 8.2 App lock

Use cases:

- `EnableLock(PIN|Biometric)`
- `Unlock(challenge)`
- `AutoLockAfter(duration)`

Policy:

- Never store the PIN in plaintext.
- Store a derived hash (KDF) + salt.
- Keep sensitive material only in the platform secret store.

## 9. User Experience and Performance

### 9.1 Cold start

- Native host splash.
- Immediate UI skeleton.
- Minimal initial home: total balance and last 10-20 transactions.
- Lazy-load heavier features: reports, settings, import/export.

### 9.2 Visual scaling

- Virtualization for large transaction lists.
- Route-based code splitting to avoid oversized bundles.
- Avoid expensive CSS effects on mobile.

## 10. Observability

Cross-cutting `telemetry` package:

- Structured logging across all layers.
- Sync metrics: push/pull duration, retries, conflicts.
- UI error boundary and correlation-id-based tracing.
- Combined JS + native logs on mobile/desktop.

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Frequent conflicts | Poor UX, loss of trust | Reduce concurrent editing and provide a clear conflict-resolution UI |
| Sync complexity growth | Technical debt and bugs | Start with LWW + strong `Transaction` conflict handling; iterate in phases |
| Token exposure in web SPA | Security risk | Prefer httpOnly cookies and reduce token surface area |
| Mobile performance issues | Slowness and churn | Enforce bundle discipline, early skeletons, and virtualization |

## 12. Decision Record (ADR)

This document is complemented by formal ADRs:

- `docs/adr/ADR-001-local-first-outbox-sync.md`
- `docs/adr/ADR-002-ports-adapters-platform-abstraction.md`
- `docs/adr/ADR-003-money-minor-units-int64.md`
- `docs/adr/ADR-004-tombstones-soft-delete.md`
