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
- `createCategorySyncChangeApplier`

Estructura recomendada:

- `change-appliers/*`: factories por entidad
- `change-appliers/parsers/*`: parseo de snapshots por entidad
- `change-appliers/shared/*`: utilidades compartidas de payload
- `use-cases/*`: orquestacion de sincronizacion

Casos de uso:

- `syncNow`: ejecuta el ciclo push/pull y aplica cambios remotos.
- `getSyncStatus`: resume estado visual de sync (`synced`, `pending`, `error`) para UI.
