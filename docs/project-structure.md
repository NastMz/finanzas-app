# Estructura y Convenciones del Proyecto

Estado: Activo  
Alcance: Monorepo completo

## 1. Objetivo

Definir una estructura estable para el monorepo, evitar carpetas planas, reducir imports ambiguos y facilitar onboarding.

Este documento cierra la Fase 1 del roadmap y sirve como referencia para cualquier modulo nuevo.

## 2. Principios

- Cada carpeta representa una responsabilidad concreta.
- La logica compartida vive en `packages/`; los hosts solo componen y adaptan.
- Los imports entre paquetes usan aliases `@finanzas/*`.
- Los imports relativos se usan solo dentro del mismo paquete o app.
- Si una carpeta empieza a mezclar responsabilidades, se subdivide antes de seguir creciendo.
- Los modulos de orquestacion con dependencias compartidas se encapsulan en clases o facades; las funciones libres quedan para transformaciones puras y locales.

## 3. Estructura actual esperada

```text
apps/
  web/
    src/
      app/
      dev/
      screens/
      features/
      ui/
  mobile/
    src/
      app/
  desktop/
    src/
      app/
packages/
  domain/
  application/
  data/
  sync/
  platform/
    platform-shared/
    platform-web/
    platform-mobile/
    platform-desktop/
  ui/
    src/
      models/
      service/
      design-system/
docs/
  adr/
```

## 4. Donde va cada cosa

### `apps/web/src/app`

Puntos de entrada, bootstrap del host web, contexto y wiring del host.

Aqui van:

- `main.ts`
- `bootstrap.ts`
- `create-web-context.ts`
- `create-web-ui.ts`

No va aqui:

- UI de pantallas
- componentes visuales
- logica de negocio de dominio

### `apps/web/src/dev`

Solo herramientas de preview local y desarrollo visual.

Aqui van:

- `dev-main.tsx`
- shells de preview
- estilos exclusivos del preview

No va aqui:

- entrypoints productivos
- casos de uso
- componentes compartidos de negocio

### `apps/web/src/screens`

Wrappers de pantalla y adaptadores de render entre `app` y `features`.

Aqui van:

- loaders de pantalla
- exports de `render*Screen`
- specs de las pantallas

No va aqui:

- componentes internos de feature
- design system

### `apps/web/src/features/<feature>`

Implementacion concreta de cada feature visual.

Estructura recomendada:

```text
features/<feature>/
  components/
  lib/
  <feature>-screen.tsx
  <feature>-screen.module.css
```

Aqui van:

- componentes de la feature
- helpers locales de la feature
- estilos de la feature

No va aqui:

- bootstrap del host
- tokens globales

### `apps/web/src/ui`

Base visual compartida del host web.

Aqui van:

- componentes genericos
- foundations globales
- utilidades UI puras

No va aqui:

- componentes atados a una feature de negocio

### `apps/mobile/src/app` y `apps/desktop/src/app`

Bootstrap y composicion del host.

Aqui van:

- `main.ts`
- `bootstrap.ts`
- `create-*-context.ts`
- `create-*-ui.ts` cuando aplique

No va aqui:

- features de negocio concretas
- reglas de dominio

### `packages/domain/src`

Modelo de dominio puro y reglas invariantes.

Aqui van:

- entidades
- value objects
- errores de dominio

No debe importar:

- `application`
- `data`
- `sync`
- `ui`
- `apps/*`

### `packages/application/src`

Casos de uso y puertos del sistema.

Aqui van:

- `use-cases/`
- servicios de aplicacion que agrupen casos de uso por contexto cuando un modulo necesite una API orientada a objetos
- `ports.ts`
- errores de aplicacion

No va aqui:

- adaptadores concretos
- componentes visuales

### `packages/data/src`

Implementaciones de persistencia y utilidades de infraestructura de datos.

Aqui van:

- repositorios
- generadores de ids
- adaptadores in-memory o persistentes

### `packages/sync/src`

Todo lo relacionado con sincronizacion.

Aqui van:

- adaptadores de sync
- change appliers
- servicios de sync que encapsulen estado local y colaboracion con APIs remotas
- use cases de sync
- contratos de sync

### `packages/ui/src/models`

Contratos y view models compartidos por la capa UI headless.

Aqui van:

- tipos de tabs
- view models
- tipos de interaccion UI

### `packages/ui/src/service`

Orquestacion headless de la UI compartida.

Aqui van:

- `createFinanzasUiService`
- facades de servicio que agrupen comandos, queries y estado de runtime compartido
- mapeos de queries/commands a view models

### `packages/ui/src/design-system`

Tokens, primitives y activos base del sistema visual compartido.

## 5. Convenciones de nombres

### Archivos

- Usar `kebab-case` para archivos TypeScript y CSS Modules.
- El nombre del archivo debe describir el modulo exportado o la responsabilidad principal.
- Los tests van junto al modulo con sufijo `.spec.ts` o `.spec.tsx`.
- Los estilos de un componente React usan el mismo basename: `component.tsx` + `component.module.css`.
- Los barrels solo se nombran `index.ts`.

### Carpetas

- Usar nombres cortos y por responsabilidad: `app`, `dev`, `screens`, `components`, `lib`, `models`, `service`.
- Crear una carpeta nueva cuando un grupo tenga identidad clara y mas de un archivo relacionado.
- No crear carpetas “misc”, “utils” o “shared” sin alcance definido.

### Exports

- Un modulo debe tener una responsabilidad principal.
- Los `index.ts` se usan solo en bordes de carpeta, no para esconder estructuras confusas.
- Si un export solo se usa en una carpeta, mantenerlo local y no subirlo al barrel global.
- Los `create-*` se reservan para composition roots o fabricas; la logica orquestadora vive dentro de la clase o facade que esas fabricas instancian.

## 6. Reglas de importacion entre capas

### Regla general

Se importa hacia adentro de la arquitectura, no hacia afuera.

### Permitido

- `apps/*` -> `packages/*`
- `apps/web/src/screens` -> `apps/web/src/features` y `apps/web/src/app`
- `apps/web/src/features` -> `apps/web/src/ui`
- `packages/application` -> `packages/domain`
- `packages/data` -> `packages/application` y `packages/domain`
- `packages/sync` -> `packages/application` y `packages/domain`
- `packages/ui/service` -> `packages/application`, `packages/domain`, `packages/sync`

### No permitido

- `packages/domain` importando cualquier capa superior
- `packages/application` importando `data`, `sync`, `ui` visual o `apps/*`
- `packages/ui` importando `apps/*`
- un host importando codigo de otro host
- imports relativos cruzando entre `apps/` y `packages/`

### Regla practica

- Dentro del mismo paquete o app: imports relativos.
- Entre paquetes: imports por alias `@finanzas/*`.
- Entre carpetas del mismo host: imports relativos cortos y directos.

## 7. Guia rapida para crear modulos nuevos

### Si agregas un caso de uso

Ubicacion:

`packages/application/src/use-cases`

Checklist:

- crear archivo del caso de uso
- crear spec junto al caso de uso
- exportarlo desde el `index.ts` del paquete si corresponde

### Si agregas un nuevo adaptador de datos

Ubicacion:

`packages/data/src/<grupo>`

Checklist:

- mantener dependencia hacia `application` y `domain`
- no filtrar detalles de infraestructura hacia arriba

### Si agregas una nueva capacidad de sync

Ubicacion:

`packages/sync/src/<grupo>`

Checklist:

- separar `use-cases`, `adapters` y `change-appliers` si aplica
- agregar pruebas de flujo feliz y error

### Si agregas una nueva pantalla web

Ubicacion:

- wrapper: `apps/web/src/screens`
- implementacion: `apps/web/src/features/<feature>`

Checklist:

- crear `*-screen.tsx`
- crear `*.module.css` asociado
- crear spec del wrapper en `screens`
- conectar el loader desde `app/main.ts` si aplica

### Si agregas componentes visuales compartidos

Ubicacion:

- `apps/web/src/ui` si son compartidos solo en web
- `packages/ui` si son contratos o sistema visual headless/shared

## 8. Guia rapida por carpeta para onboarding

| Ruta | Rol |
| --- | --- |
| `apps/web/src/app` | bootstrap y wiring del host web |
| `apps/web/src/dev` | preview local y herramientas de desarrollo visual |
| `apps/web/src/screens` | adaptadores de pantallas y loaders |
| `apps/web/src/features` | implementacion por feature |
| `apps/web/src/ui` | base visual compartida del host web |
| `apps/mobile/src/app` | bootstrap del host mobile |
| `apps/desktop/src/app` | bootstrap del host desktop |
| `packages/domain/src` | reglas puras del dominio |
| `packages/application/src` | casos de uso y puertos |
| `packages/data/src` | persistencia y utilidades de datos |
| `packages/sync/src` | sincronizacion y outbox |
| `packages/ui/src/models` | tipos y view models de UI |
| `packages/ui/src/service` | servicio headless de UI |
| `packages/ui/src/design-system` | tokens y sistema visual |
| `docs/adr` | decisiones de arquitectura |

## 9. Checklist de revision estructural

Antes de agregar una carpeta o archivo nuevo, revisar:

- si ya existe una carpeta con esa responsabilidad
- si el nombre describe bien su rol
- si el modulo depende solo de las capas permitidas
- si necesita test al lado
- si debe exponerse por `index.ts` o quedar local

## 10. Mantenimiento

- Este documento debe actualizarse cuando cambie la estructura base del repo.
- Si una nueva convención se vuelve recurrente, se agrega aqui antes de replicarla en varios lugares.
- Si una regla estructural necesita enforcement automatico, el siguiente paso es moverla a ESLint.
