# Finanzas App

Bootstrap inicial del proyecto basado en `ARCHITECTURE.md` y los ADR aprobados.

## Avance inicial

- Monorepo con workspaces para apps y paquetes compartidos.
- Paquetes implementados: `domain`, `application`, `data`, `sync`.
- Casos de uso actuales:
  - Cuentas: `AddAccount`, `UpdateAccount`, `DeleteAccount` (tombstones), `ListAccounts`.
  - Categorias: `AddCategory`, `UpdateCategory`, `DeleteCategory` (tombstones), `ListCategories`.
  - Transacciones: `AddTransaction`, `UpdateTransaction`, `DeleteTransaction` (tombstones), `ListTransactions`.
- Motor inicial `SyncNow` con flujo `push/pull`, estados de outbox, cursor incremental y aplicacion de cambios remotos en cuentas/categorias/transacciones.
- Adaptadores in-memory para validar flujo offline-first en desarrollo y pruebas.
- Estrategia de IDs por proposito para evitar strings genericos (`account`, `category`, `transaction`, `outbox-op`), con generacion ULID para ejecucion normal y secuencial deterministica para pruebas.
- Utilidades compartidas para evitar duplicacion entre hosts: `createUlidIdGenerator` en `@finanzas/data` y `createInMemorySyncApiClient` en `@finanzas/sync`.
- Bootstrap/context in-memory compartidos en `@finanzas/platform-shared` para `web`, `desktop` y `mobile`.
- Contextos por host (`createWebContext`, `createDesktopContext`, `createMobileContext`) con separacion de `commands` y `queries` para facilitar composicion de UI.
- Pruebas unitarias iniciales con Vitest.

## Comandos

```bash
npm install
npm run typecheck
npm run lint
npm run test
```

## Git hooks

- El hook `pre-commit` ejecuta `npm run lint:staged`.
- El hook `pre-push` ejecuta `npm run typecheck && npm run test`.
- `lint-staged` corre ESLint sobre archivos `*.ts` staged antes del commit.

## UX v1

- Flujos y lineamientos UI mobile-first: `docs/ui-v1-flows.md`.
