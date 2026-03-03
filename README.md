# Finanzas App

Bootstrap inicial del proyecto basado en `ARCHITECTURE.md` y los ADR aprobados.

## Avance inicial

- Monorepo con workspaces para apps y paquetes compartidos.
- Paquetes implementados: `domain`, `application`, `data`.
- Primer caso de uso vertical: `AddTransaction` (persistencia local + outbox).
- Adaptadores in-memory para validar flujo offline-first en desarrollo y pruebas.
- Pruebas unitarias iniciales con Vitest.

## Comandos

```bash
npm install
npm run typecheck
npm run test
```
