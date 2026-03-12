# Desktop App

Initial desktop app bootstrap (Electron/Tauri) with the same base capabilities as web in order to validate shared logic:

- `createDesktopBootstrap` with CRUD for accounts, categories, and transactions.
- `main.ts` exposes `desktopApp`, `desktopCommands`, and `desktopQueries` without extra context wrappers.
- `syncNow` against an in-memory backend for local tests.
- Purpose-specific ID strategy with ULID by default.
- Optional injection of `IdGenerator` and `SyncApiClient` for tests.
