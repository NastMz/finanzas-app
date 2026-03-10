# Finanzas App

Bootstrap inicial del proyecto basado en `ARCHITECTURE.md` y los ADR aprobados.

## Avance inicial

- Monorepo con workspaces para apps y paquetes compartidos.
- Paquetes implementados: `domain`, `application`, `data`, `sync`, `ui` y `platform-shared`.
- Casos de uso actuales:
  - Cuentas: `AddAccount`, `UpdateAccount`, `DeleteAccount` (tombstones), `ListAccounts`.
  - Categorias: `AddCategory`, `UpdateCategory`, `DeleteCategory` (tombstones), `ListCategories`.
  - Transacciones: `AddTransaction`, `UpdateTransaction`, `DeleteTransaction` (tombstones), `ListTransactions`, `GetAccountSummary` (totales + top categorias + recientes por rango).
- Motor inicial `SyncNow` con flujo `push/pull`, estados de outbox, cursor incremental y aplicacion de cambios remotos en cuentas/categorias/transacciones.
- Query de sincronizacion `GetSyncStatus` para estado UI (`synced`, `pending`, `error`) con conteos por estado de outbox y cursor actual.
- Adaptadores in-memory para validar flujo offline-first en desarrollo y pruebas.
- Estrategia de IDs por proposito para evitar strings genericos (`account`, `category`, `transaction`, `outbox-op`), con generacion ULID para ejecucion normal y secuencial deterministica para pruebas.
- Utilidades compartidas para evitar duplicacion entre hosts: `createUlidIdGenerator` en `@finanzas/data` y `createInMemorySyncApiClient` en `@finanzas/sync`.
- Bootstrap/context in-memory compartidos en `@finanzas/platform-shared` para `web`, `desktop` y `mobile`.
- Contextos por host (`createWebContext`, `createDesktopContext`, `createMobileContext`) con separacion de `commands` y `queries` para facilitar composicion de UI.
- Capa UI headless compartida en `@finanzas/ui` (`createFinanzasUiService`) y wrappers por host (`createWebUi`, `createMobileUi`) para materializar tabs v1 de forma web-first y reutilizable.
- Sistema de diseño inicial compartido (tokens de color/espaciado/tipografia en `@finanzas/ui`) + reset global web, y Home en React refactorizada con componentes atómicos/reutilizables para un dashboard financiero consistente entre hosts.
- Pruebas unitarias iniciales con Vitest.

## Comandos

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run web:dev
```

## Git hooks

- El hook `pre-commit` ejecuta `npm run lint:staged`.
- El hook `pre-push` ejecuta `npm run typecheck && npm run test`.
- `lint-staged` corre ESLint sobre archivos `*.ts` staged antes del commit.

## UX v1

- Flujos y lineamientos UI mobile-first: `docs/ui-v1-flows.md`.
- Roadmap de fases, avance y pendientes: `docs/roadmap.md`.
