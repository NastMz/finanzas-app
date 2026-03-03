# Platform Shared Adapter

Utilidades compartidas entre hosts (`web`, `desktop`, `mobile`) para evitar
duplicacion en wiring local-first:

- `createInMemoryAppContext`
- `createInMemoryBootstrap`

Incluye bootstrap in-memory con CRUD + sync y soporte de inyeccion para pruebas
(`SyncApiClient`, `IdGenerator`, `deviceId`).
