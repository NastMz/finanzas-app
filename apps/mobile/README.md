# App Mobile

Bootstrap inicial de la app mobile (Capacitor) con las mismas
capacidades base que web/desktop para validar la logica compartida:

- `createMobileBootstrap` con CRUD de cuentas/categorias/transacciones.
- `createMobileContext` para separar `commands` y `queries` al componer la UI.
- `createMobileUi` como wrapper sobre `@finanzas/ui` (`createFinanzasUiService`) para orquestar los 4 tabs (`Inicio`, `Movimientos`, `Registrar`, `Cuenta`) con view-models listos para render.
- `syncNow` sobre backend in-memory para pruebas locales.
- Estrategia de IDs por proposito con ULID por defecto.
- Inyeccion opcional de `IdGenerator` y `SyncApiClient` para pruebas.
