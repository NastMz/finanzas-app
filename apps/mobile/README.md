# App Mobile

Bootstrap inicial de la app mobile (Capacitor) con las mismas
capacidades base que web/desktop para validar la logica compartida:

- `createMobileBootstrap` con CRUD de cuentas/categorias/transacciones.
- `createMobileContext` para separar `commands` y `queries` al componer la UI.
- `syncNow` sobre backend in-memory para pruebas locales.
- Estrategia de IDs por proposito con ULID por defecto.
- Inyeccion opcional de `IdGenerator` y `SyncApiClient` para pruebas.
