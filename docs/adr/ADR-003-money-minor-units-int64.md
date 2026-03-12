# ADR-003: `Money` Representation in Minor Units as int64

Status: Accepted  
Date: 2026-03-02

## Context

The system handles financial amounts for balances, budgets, and transactions. Using `float` introduces precision and rounding issues that are incompatible with reliable accounting.

## Decision

Represent `Money` with integer minor units:

- `amountMinor: int64`
- `currency: string` (for example: COP, USD)

All arithmetic is performed on integers. Decimal conversion is limited to presentation.

## Consequences

Positive:

- Deterministic precision in financial operations.
- Simpler, more auditable business rules.
- Lower risk of cross-platform discrepancies.

Trade-offs:

- Need for formatting/parsing utilities per currency.
- Extra care in conversions involving rates or prorations.

## Alternatives Considered

1. `float` / `double`: rejected due to binary imprecision.
2. Arbitrary-precision decimal everywhere: postponed due to library and serialization cost for the MVP.

## Acceptance Criteria

- No financial entity uses `float` for persistence or logic.
- Currency validation is consistent per account.
- Amount formatting is decoupled from domain rules.
