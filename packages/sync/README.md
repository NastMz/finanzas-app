# Package Sync

Motor de sincronizacion push/pull con estrategia local-first:

- Toma operaciones `pending` del outbox local.
- Ejecuta `push` idempotente al backend.
- Marca operaciones `acked` o `failed`.
- Ejecuta `pull` incremental por cursor.
- Persiste `nextCursor` local para la siguiente corrida.
- Aplica cambios remotos sobre repositorios locales mediante `SyncChangeApplier`.
- Permite componer appliers por entidad con `createCompositeSyncChangeApplier`.

Appliers iniciales:

- `createTransactionSyncChangeApplier`
- `createAccountSyncChangeApplier`

El caso de uso principal es `syncNow`.
