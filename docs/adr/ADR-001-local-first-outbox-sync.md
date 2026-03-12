# ADR-001: Local-First with Outbox Sync

Status: Accepted  
Date: 2026-03-02

## Context

The app must provide a full experience without connectivity, support multiple devices per user, and maintain reasonable consistency without blocking local editing.

Synchronization models based on direct backend queries on every action do not satisfy the offline-first requirement and degrade UX in unstable network scenarios.

## Decision

Adopt a local-first model with an outbox and push/pull synchronization:

- The local database is the source of truth for the UI.
- Every action persists locally and appends an operation to `outbox_ops`.
- The client performs idempotent `push` requests to the server when connectivity is available.
- The server applies changes and publishes a per-user change log.
- The client performs incremental `pull` by cursor to converge.

## Consequences

Positive:

- Consistent UX without connectivity dependency.
- Better tolerance for high latency and intermittent connections.
- Scales well for multi-device scenarios with eventual convergence.

Trade-offs:

- Higher sync-engine complexity and conflict-resolution complexity.
- Need for fine-grained state tracking (`pending/sent/acked/failed`).
- Requires retry strategy and failed-operation handling.

## Alternatives Considered

1. Online-first with local cache: rejected due to poor offline experience.
2. Full CRDT-style replication: postponed due to MVP complexity.
3. Polling full snapshots: rejected due to cost and low granularity.

## Acceptance Criteria

- CRUD works without network.
- Automatic retry when connectivity returns.
- Idempotency by `opId`.
- Eventual convergence between at least two devices per user.
