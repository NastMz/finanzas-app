# ADR-001: Local-first con Outbox Sync

Estado: Aceptado  
Fecha: 2026-03-02

## Contexto

La app debe operar con experiencia completa sin red, soportar multiples dispositivos por usuario y mantener consistencia razonable sin bloquear la edicion local.

Modelos de sincronizacion basados en consulta directa al backend en cada accion no cumplen el requisito offline-first y degradan UX en escenarios de red inestable.

## Decision

Se adopta un modelo local-first con outbox y sincronizacion push/pull:

- La base local es la fuente de verdad para la UI.
- Cada accion persiste localmente y agrega una operacion a `outbox_ops`.
- El cliente ejecuta `push` idempotente al servidor cuando hay conectividad.
- El servidor aplica cambios y publica un change log por usuario.
- El cliente ejecuta `pull` incremental por cursor para converger.

## Consecuencias

Positivas:

- UX consistente sin dependencia de conectividad.
- Mejor tolerancia a latencia alta e intermitencia.
- Escala bien para multi-dispositivo con convergencia eventual.

Trade-offs:

- Mayor complejidad de sync engine y resolucion de conflictos.
- Necesidad de trazabilidad fina de estados (`pending/sent/acked/failed`).
- Requiere estrategia de reintentos y manejo de operaciones fallidas.

## Alternativas consideradas

1. Online-first con cache local: rechazada por mala experiencia offline.
2. Replicacion completa tipo CRDT: pospuesta por complejidad para MVP.
3. Polling de snapshots completos: rechazada por costo y baja granularidad.

## Criterios de aceptacion

- CRUD funcional sin red.
- Reintento automatico al recuperar conectividad.
- Idempotencia por `opId`.
- Convergencia eventual entre al menos dos dispositivos por usuario.
