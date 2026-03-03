# ADR-002: Puertos y Adaptadores para abstraccion de plataforma

Estado: Aceptado  
Fecha: 2026-03-02

## Contexto

La aplicacion debe ejecutarse en Web, Mobile y Desktop, con capacidad de cambiar host (Capacitor, Electron, Tauri) sin reescribir la logica de negocio.

Acoplar UI o casos de uso a APIs concretas de host produce lock-in y dificulta pruebas, migraciones y mantenimiento.

## Decision

Se define una arquitectura por puertos y adaptadores:

- `packages/domain` y `packages/application` no conocen detalles de plataforma.
- Interfaces (ports) modelan capacidades requeridas: secretos, red, notificaciones, reloj, almacenamiento.
- Implementaciones concretas (adapters) se ubican por plataforma: web/mobile/desktop.
- `apps/*` solo compone adaptadores y configura bootstrap.

## Consecuencias

Positivas:

- Menor lock-in de host.
- Testabilidad superior (mocks/fakes por port).
- Evolucion incremental de capacidades nativas.

Trade-offs:

- Mayor esfuerzo inicial de diseno de contratos.
- Necesidad de gobernar consistencia entre adaptadores.

## Alternativas consideradas

1. Acceso directo a plugins desde UI: rechazada por acoplamiento alto.
2. Service locator global sin contratos claros: rechazada por ambiguedad y deuda tecnica.

## Criterios de aceptacion

- Ningun caso de uso importa SDKs de host.
- Cada capacidad de plataforma tiene port definido.
- Cambio de host no afecta dominio ni reglas de negocio.
