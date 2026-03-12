# Platform Shared Adapter

Shared utilities across hosts (`web`, `desktop`, `mobile`) to avoid duplication in local-first wiring:

- `createInMemoryAppContext`
- `createInMemoryBootstrap`

Includes in-memory bootstrap with CRUD + sync and dependency injection support for tests (`SyncApiClient`, `IdGenerator`, `deviceId`).
