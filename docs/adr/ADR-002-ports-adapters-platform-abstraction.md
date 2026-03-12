# ADR-002: Ports and Adapters for Platform Abstraction

Status: Accepted  
Date: 2026-03-02

## Context

The application must run on Web, Mobile, and Desktop, while keeping the option to change the host (Capacitor, Electron, Tauri) without rewriting business logic.

Coupling the UI or use cases to concrete host APIs creates lock-in and makes testing, migration, and maintenance harder.

## Decision

Define a ports-and-adapters architecture:

- `packages/domain` and `packages/application` do not know platform details.
- Interfaces (ports) model required capabilities: secrets, network, notifications, clock, storage.
- Concrete implementations (adapters) are organized per platform: web/mobile/desktop.
- `apps/*` only composes adapters and configures bootstrap.

## Consequences

Positive:

- Lower host lock-in.
- Better testability (mocks/fakes per port).
- Incremental evolution of native capabilities.

Trade-offs:

- More upfront work to design contracts.
- Need to keep adapters consistent.

## Alternatives Considered

1. Direct plugin access from the UI: rejected due to tight coupling.
2. Global service locator without clear contracts: rejected due to ambiguity and technical debt.

## Acceptance Criteria

- No use case imports host SDKs.
- Every platform capability has a defined port.
- Host changes do not affect domain logic or business rules.
