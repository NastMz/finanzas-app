# Mobile App

Initial mobile app bootstrap (Capacitor) with the same base capabilities as web/desktop in order to validate shared logic:

- `createMobileBootstrap` with CRUD for accounts, categories, and transactions.
- `main.ts` exposes `mobileApp`, `mobileCommands`, `mobileQueries`, and `mobileUi` with explicit composition on top of `@finanzas/ui`.
- `syncNow` against an in-memory backend for local tests.
- Purpose-specific ID strategy with ULID by default.
- Optional injection of `IdGenerator` and `SyncApiClient` for tests.
