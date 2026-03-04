# Package UI

Capa de presentacion compartida (headless) para hosts web/mobile/desktop.

Incluye:

- `createFinanzasUiService`: orquesta tabs `Inicio`, `Movimientos`, `Registrar`, `Cuenta`.
- View-models tipados para listas, resumen, sugerencias y estado de sync.
- Dependencia solo en contratos `commands`/`queries` de aplicacion/sync.
- Sistema de diseño compartido:
  - Tokens cross-platform en `@finanzas/ui` (`designTokens`).
  - Variables CSS para web en `@finanzas/ui/design-system/tokens.css`.
