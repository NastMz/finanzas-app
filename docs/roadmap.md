# Roadmap de Implementacion

Documento vivo para llevar control de lo implementado y lo pendiente en el proyecto.

## Convencion de estado

- `[x]` Implementado
- `[~]` En progreso o parcial
- `[ ]` Pendiente

## Fase 1. Fundaciones del monorepo

### Objetivo

Dejar lista la base tecnica del proyecto para crecer sin mezclar responsabilidades entre apps, paquetes y documentacion.

### Estado general

`[x]` Completada

### Implementado

- `[x]` Monorepo con workspaces para `apps/*`, `packages/*` y `packages/platform/*`
- `[x]` Separacion inicial entre `domain`, `application`, `data`, `sync`, `ui` y `platform-shared`
- `[x]` ADRs base de arquitectura, sync local-first, ports/adapters, minor units y tombstones
- `[x]` Reorganizacion de estructura para reducir carpetas planas en `apps/web`, `apps/mobile`, `apps/desktop` y `packages/ui`
- `[x]` Comandos base de desarrollo, pruebas y typecheck documentados
- `[x]` Hooks de git para validacion antes de commit y push
- `[x]` Convencion de nombres y ubicacion de modulos documentada
- `[x]` Reglas de importacion entre capas documentadas
- `[x]` Guia corta de estructura por carpeta para onboarding

## Fase 2. Core financiero local-first

### Objetivo

Cubrir el dominio base y los casos de uso operativos del manejo diario del dinero.

### Estado general

`[~]` Base implementada

### Implementado

- `[x]` Entidades base de dominio para cuentas, categorias, transacciones y dinero
- `[x]` Casos de uso CRUD para cuentas
- `[x]` Presupuestos por categoria y periodo
- `[x]` Casos de uso CRUD para categorias
- `[x]` Casos de uso CRUD para transacciones
- `[x]` Resumen de cuenta por periodo con totales, top categorias y recientes
- `[x]` Soft delete con tombstones
- `[x]` IDs tipados por proposito y generadores para runtime y pruebas
- `[x]` Adaptadores in-memory para desarrollo y testing

### Pendiente

- `[ ]` Reglas recurrentes y plantillas de movimientos
- `[ ]` Validaciones adicionales para escenarios multi-moneda
- `[ ]` Casos de uso de edicion masiva o acciones rapidas sobre movimientos
- `[ ]` Importacion y exportacion de datos

## Fase 3. Sync y persistencia real

### Objetivo

Pasar de un flujo validado en memoria a una base robusta de persistencia local y sincronizacion utilizable en escenarios reales.

### Estado general

`[~]` Nucleo inicial implementado

### Implementado

- `[x]` Outbox local con estados `pending`, `sent`, `acked` y `failed`
- `[x]` Caso de uso `SyncNow`
- `[x]` `GetSyncStatus` para UI
- `[x]` Push/pull incremental con cursor
- `[x]` Aplicacion de cambios remotos para cuentas, categorias y transacciones
- `[x]` Cliente de sync in-memory para pruebas

### Pendiente

- `[ ]` Persistencia web real sobre IndexedDB
- `[ ]` Persistencia mobile y desktop real sobre SQLite
- `[ ]` Mecanismo de migraciones de datos
- `[ ]` Politica de reintentos y backoff mas completa para sync
- `[ ]` Manejo explicito de conflictos con estrategia por entidad
- `[ ]` UI de resolucion de conflictos
- `[ ]` Sincronizacion automatica al recuperar conectividad
- `[ ]` Trazabilidad por operacion de sync y depuracion de errores

## Fase 4. Capa UI compartida

### Objetivo

Consolidar una capa UI headless reusable entre hosts y una base de design system coherente.

### Estado general

`[~]` Base implementada

### Implementado

- `[x]` `createFinanzasUiService` en `@finanzas/ui`
- `[x]` View models para `Inicio`, `Movimientos`, `Registrar` y `Cuenta`
- `[x]` Wrappers por host para consumir la UI headless
- `[x]` Design tokens compartidos
- `[x]` Sistema visual web inicial y refactor de layout principal
- `[x]` Pantallas web v1 en React para dashboard, movimientos, registro y cuenta

### Pendiente

- `[ ]` Consolidar componentes compartidos reutilizables entre vistas
- `[ ]` Documentar el design system y sus decisiones base
- `[ ]` Definir estados vacios, loading y error de forma consistente
- `[ ]` Incorporar accesibilidad como checklist explicito por componente
- `[ ]` Agregar historias o un entorno de preview aislado para componentes

## Fase 5. Experiencia de producto web

### Objetivo

Llevar la experiencia web de preview a una aplicacion operable de punta a punta.

### Estado general

`[~]` En progreso

### Implementado

- `[x]` Shell de navegacion principal del preview
- `[x]` Jerarquia visual mas clara para uso diario del dinero
- `[x]` Vista responsive desktop y mobile del preview web
- `[x]` Render de pantallas HTML desde la capa UI

### Pendiente

- `[ ]` Formularios reales de captura y edicion de movimientos
- `[ ]` Filtros reales en movimientos
- `[ ]` Busqueda, orden y segmentacion por cuenta/categoria/fecha
- `[ ]` Acciones de sync desde la UI
- `[ ]` Feedback de loading, guardado y error para acciones del usuario
- `[ ]` Navegacion de aplicacion mas alla del preview de desarrollo
- `[ ]` Soporte de PWA

## Fase 6. Hosts mobile y desktop

### Objetivo

Extender el core compartido a experiencias reales por plataforma sin duplicar logica.

### Estado general

`[~]` Bootstrap base implementado

### Implementado

- `[x]` Bootstrap/context compartido sobre `platform-shared`
- `[x]` Wrappers base para web, mobile y desktop
- `[x]` Pruebas smoke de bootstrap por host

### Pendiente

- `[ ]` UI real para mobile
- `[ ]` UI real para desktop
- `[ ]` Integracion de almacenamiento seguro por plataforma
- `[ ]` Integracion de capacidades nativas relevantes
- `[ ]` Estrategia de empaquetado y distribucion por host

## Fase 7. Seguridad y cuenta de usuario

### Objetivo

Cerrar los aspectos necesarios para operar con datos financieros de forma responsable.

### Estado general

`[ ]` Pendiente

### Pendiente

- `[ ]` Modelo de autenticacion
- `[ ]` Manejo de tokens o sesiones seguras segun host
- `[ ]` Lock de aplicacion con PIN o biometria
- `[ ]` Politicas de secretos por plataforma
- `[ ]` Endurecimiento de sync y validaciones de seguridad

## Fase 8. Observabilidad, calidad y operacion

### Objetivo

Tener capacidad de diagnostico, monitoreo y control de calidad continua.

### Estado general

`[~]` Base parcial

### Implementado

- `[x]` Suite de pruebas unitarias con Vitest
- `[x]` Typecheck como validacion obligatoria

### Pendiente

- `[ ]` Lint estable como parte del flujo de trabajo diario
- `[ ]` Telemetria estructurada transversal
- `[ ]` Cobertura de pruebas para escenarios de sync complejos
- `[ ]` Pruebas end-to-end de flujos criticos
- `[ ]` Medicion de rendimiento en apertura y listas grandes
- `[ ]` Checklist de regresion antes de releases

## Fase 9. Capacidades de producto futuras

### Objetivo

Registrar lo que no es prioritario ahora pero conviene mantener visible.

### Estado general

`[ ]` Pendiente

### Pendiente

- `[ ]` Presupuestos visuales y alertas
- `[ ]` Reportes y tendencias
- `[ ]` Automatizaciones y reglas
- `[ ]` Integraciones bancarias
- `[ ]` Multiusuario o colaboracion
- `[ ]` Cifrado E2EE como extension futura

## Reglas de mantenimiento del roadmap

- Cada cambio relevante de arquitectura, dominio o UI debe actualizar este documento.
- Cuando una fase avance, mover items de pendiente a implementado en el mismo PR.
- Si aparece una nueva linea de trabajo, agregarla como fase o subfase en lugar de dejarla solo en conversaciones.
