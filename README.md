# Finanzas App

Bootstrap inicial del proyecto basado en `ARCHITECTURE.md` y los ADR aprobados.

## Avance inicial

- Monorepo con workspaces para apps y paquetes compartidos.
- Paquetes implementados: `domain`, `application`, `data`, `sync`.
- Casos de uso actuales:
  - Cuentas: `AddAccount`, `UpdateAccount`, `DeleteAccount` (tombstones).
  - Categorias: `AddCategory`, `UpdateCategory`, `DeleteCategory` (tombstones).
  - Transacciones: `AddTransaction`, `UpdateTransaction`, `DeleteTransaction` (tombstones), `ListTransactions`.
- Motor inicial `SyncNow` con flujo `push/pull`, estados de outbox, cursor incremental y aplicacion de cambios remotos en cuentas/categorias/transacciones.
- Adaptadores in-memory para validar flujo offline-first en desarrollo y pruebas.
- Estrategia de IDs por proposito para evitar strings genericos (`account`, `category`, `transaction`, `outbox-op`), con generacion ULID para ejecucion normal y secuencial deterministica para pruebas.
- Utilidades compartidas para evitar duplicacion entre hosts: `createUlidIdGenerator` en `@finanzas/data` y `createInMemorySyncApiClient` en `@finanzas/sync`.
- Bootstrap/context in-memory compartidos en `@finanzas/platform-shared` para `web` y `desktop`.
- Pruebas unitarias iniciales con Vitest.

## Comandos

```bash
npm install
npm run typecheck
npm run lint
npm run test
```
