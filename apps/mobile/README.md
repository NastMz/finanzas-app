# App Mobile

Bootstrap inicial de la app mobile (Capacitor) con las mismas
capacidades base que web/desktop para validar la logica compartida:

- `createMobileBootstrap` con CRUD de cuentas/categorias/transacciones.
- `main.ts` expone `mobileApp`, `mobileCommands`, `mobileQueries` y `mobileUi` con composicion explicita sobre `@finanzas/ui`.
- `syncNow` sobre backend in-memory para pruebas locales.
- Estrategia de IDs por proposito con ULID por defecto.
- Inyeccion opcional de `IdGenerator` y `SyncApiClient` para pruebas.
