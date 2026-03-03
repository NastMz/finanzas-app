# ADR-004: Tombstones para deletes en sincronizacion

Estado: Aceptado  
Fecha: 2026-03-02

## Contexto

En un esquema multi-dispositivo con sincronizacion eventual, borrar fisicamente un registro puede causar resurrecciones de datos cuando otro dispositivo aun conserva una version antigua.

## Decision

Se adopta borrado logico con tombstones:

- Las entidades incluyen `deletedAt`.
- Una operacion `delete` marca el registro, no lo elimina fisicamente de inmediato.
- El estado de borrado se sincroniza como cambio normal via outbox/change log.
- La eliminacion fisica (GC) se realiza por politica de retencion.

## Consecuencias

Positivas:

- Evita resurrecciones de datos al sincronizar.
- Mantiene trazabilidad de cambios para auditoria y debug.
- Facilita resolucion de conflictos delete vs update.

Trade-offs:

- Incremento de complejidad en consultas (filtrar `deletedAt`).
- Crecimiento de datos hasta ejecutar GC.

## Alternativas consideradas

1. Hard delete inmediato: rechazada por riesgo de inconsistencia en sync.
2. Tabla separada de eliminados: descartada por complejidad adicional para MVP.

## Criterios de aceptacion

- Todas las entidades sincronizables soportan `deletedAt`.
- Pull/push propaga deletes como eventos de cambio.
- Existe politica de compactacion y retencion definida.
