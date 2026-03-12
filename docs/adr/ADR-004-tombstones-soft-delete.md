# ADR-004: Tombstones for Deletes in Synchronization

Status: Accepted  
Date: 2026-03-02

## Context

In a multi-device, eventually consistent setup, physically deleting a record can resurrect stale data when another device still holds an older version.

## Decision

Adopt logical deletion with tombstones:

- Entities include `deletedAt`.
- A `delete` operation marks the record instead of physically removing it immediately.
- The deleted state is synchronized as a normal change through the outbox/change log.
- Physical deletion (GC) is handled by a retention policy.

## Consequences

Positive:

- Prevents data resurrection during synchronization.
- Preserves change traceability for audit and debugging.
- Simplifies delete-vs-update conflict handling.

Trade-offs:

- More complex queries (`deletedAt` filtering).
- Data growth until GC runs.

## Alternatives Considered

1. Immediate hard delete: rejected because it risks sync inconsistency.
2. Separate deleted-records table: discarded due to extra MVP complexity.

## Acceptance Criteria

- All synchronizable entities support `deletedAt`.
- Pull/push propagates deletes as change events.
- A compaction and retention policy exists.
