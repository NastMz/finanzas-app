# App Desktop

Bootstrap inicial de la app desktop (Electron/Tauri) con las mismas
capacidades base que web para validar la logica compartida:

- `createDesktopBootstrap` con CRUD de cuentas/categorias/transacciones.
- `main.ts` expone `desktopApp`, `desktopCommands` y `desktopQueries` sin wrappers de contexto adicionales.
- `syncNow` sobre backend in-memory para pruebas locales.
- Estrategia de IDs por proposito con ULID por defecto.
- Inyeccion opcional de `IdGenerator` y `SyncApiClient` para pruebas.
