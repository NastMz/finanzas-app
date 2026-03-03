# Arquitectura de la App de Finanzas Personales

Estado: Aprobado  
Version: 1.0  
Fecha: 2026-03-02

## 1. Proposito y alcance

Este documento define la arquitectura objetivo para una app de finanzas personales con enfoque web-core, local-first y sincronizacion cloud.

Objetivos del sistema:

- Multiplataforma: Web, Mobile y Desktop con una sola base de codigo.
- Offline-first: operaciones CRUD completas sin conectividad.
- Sincronizacion multi-dispositivo con convergencia eventual.
- Seguridad por plataforma (lock de app y secretos en almacenes seguros).
- Evolucion sin lock-in del host (Capacitor, Electron o Tauri intercambiables).

Fuera de alcance en esta fase:

- Integracion bancaria automatica (open banking).
- Presupuestos colaborativos multiusuario avanzados.
- Cifrado E2EE completo (se deja punto de extension futuro).

## 2. Requerimientos no funcionales

| ID | Requerimiento | Criterio objetivo |
| --- | --- | --- |
| NFR-01 | Rendimiento de apertura | Primer render util menor a 2s en dispositivo gama media, con skeleton inmediato |
| NFR-02 | Offline | CRUD financiero disponible sin red |
| NFR-03 | Sync | Convergencia eventual, conflictos detectables y resolubles |
| NFR-04 | Seguridad | Lock opcional, secretos en store seguro, sin tokens en texto plano |
| NFR-05 | Observabilidad | Logging estructurado y trazas de sync/errores en todas las plataformas |

## 3. Arquitectura de alto nivel

### 3.1 Estilo arquitectonico

Se adopta arquitectura Hexagonal/Clean aplicada al frontend:

- **Domain**: entidades y reglas puras (Money, Transaction, Budget, invariantes).
- **Application**: casos de uso (AddTransaction, SetBudget, SyncNow, UnlockApp).
- **Ports**: interfaces requeridas por la aplicacion (repositorios, secretos, red, clock, notificaciones).
- **Adapters**: implementaciones concretas para persistencia, sync remoto y servicios de plataforma.

Regla principal: la UI consume Application; no habla directo con plugins, HTTP ni SDKs de host.

### 3.2 Vista logica de capas

```text
UI
 -> Application (use cases)
    -> Domain (reglas)
    -> Ports (interfaces)
       -> Adapters
          -> Local DB (IndexedDB/SQLite)
          -> Remote Sync API (push/pull)
          -> Platform services (web/mobile/desktop)
```

### 3.3 Hosts multiplataforma

| Plataforma | Host | Rol |
| --- | --- | --- |
| Web | SPA/PWA | Entrega web y APIs browser |
| Mobile | Capacitor | WebView + plugins nativos |
| Desktop | Electron o Tauri | Shell desktop + integraciones OS |

El host se considera infraestructura. La logica de negocio vive en paquetes compartidos.

## 4. Estructura de repositorio (monorepo)

```text
apps/
  web/
  mobile/
  desktop/
packages/
  domain/
  application/
  data/
  sync/
  platform/
    platform-web/
    platform-mobile/
    platform-desktop/
  ui/
  telemetry/
docs/
  adr/
```

Regla: `apps/*` solo compone dependencias, configura adaptadores y bootstrap de plataforma.

## 5. Modelo de dominio y datos

### 5.1 Entidades principales

```text
Money {
  amountMinor: int64
  currency: string
}

Account {
  id, name, type, currency
}

Transaction {
  id, accountId, amount: Money, date, categoryId, note?, tags[]
}

Category {
  id, name, type: income|expense
}

Budget {
  month, categoryId, limit: Money
}

RecurringRule {
  id, schedule, templateTransactionId
}
```

### 5.2 Invariantes

- `amount != 0`.
- Toda transaccion referencia una cuenta existente.
- Moneda consistente con la cuenta (o conversion explicita).
- Presupuesto unico por `(month, categoryId)`.

## 6. Persistencia local (source of truth)

### 6.1 Motor por plataforma

- Web: IndexedDB.
- Mobile/Desktop: SQLite.

### 6.2 Esquema conceptual minimo

- `accounts`
- `transactions`
- `categories`
- `budgets`
- `recurring_rules`
- `outbox_ops`
- `sync_state`

Campos base por entidad:

- `id`
- `createdAt`, `updatedAt`
- `deletedAt` (tombstone recomendado)
- `version` (version de servidor cuando exista)

## 7. Sincronizacion cloud

### 7.1 Principios

- Local-first con convergencia eventual.
- Toda accion del usuario persiste local y genera outbox.
- El motor de sync intenta `push` al detectar red.
- El cliente ejecuta `pull` incremental por cursor.

### 7.2 Modelo

Modelo recomendado: change log por usuario en servidor + cursores opacos.

Flujo:

1. Cliente envia operaciones idempotentes (`push`).
2. Servidor valida, aplica y escribe cambios en log.
3. Cliente consulta cambios desde `cursor` (`pull`).
4. Cliente aplica cambios y actualiza `nextCursor`.

### 7.3 Outbox operation

```text
OutboxOp {
  opId: UUID
  deviceId: string
  entityType: string
  entityId: string
  opType: create|update|delete
  payload: json
  baseVersion?: string|number
  createdAt: datetime
  status: pending|sent|acked|failed
  attemptCount: number
  lastError?: string
}
```

### 7.4 API de sincronizacion

`POST /sync/push`

```json
{
  "deviceId": "string",
  "ops": []
}
```

```json
{
  "ackedOpIds": [],
  "conflicts": [],
  "serverTime": "datetime"
}
```

`POST /sync/pull`

```json
{
  "deviceId": "string",
  "cursor": "opaque-token"
}
```

```json
{
  "nextCursor": "opaque-token",
  "changes": []
}
```

Change DTO tipico:

```text
ChangeDTO {
  changeId,
  entityType,
  entityId,
  opType,
  entitySnapshot|delta,
  serverVersion,
  serverTimestamp
}
```

### 7.5 Conflictos

Politica base:

- Transaction: conflicto si `baseVersion != currentVersion`.
- Metadata (categorias, notas): LWW con desempate por `(serverTimestamp, deviceId)`.

Resolucion UX:

- Notificacion de conflicto detectado.
- Diff simple: version local vs remota.
- Acciones: usar local, usar remota o duplicar como nueva.

## 8. Seguridad

### 8.1 Autenticacion

- JWT access/refresh o sesiones server-side.
- Mobile: secretos en Keychain/Keystore.
- Desktop: vault del OS o capa de cifrado equivalente.
- Web: preferir cookies httpOnly cuando el backend lo permita.

### 8.2 Lock de aplicacion

Casos de uso:

- `EnableLock(PIN|Biometric)`
- `Unlock(challenge)`
- `AutoLockAfter(duration)`

Politica:

- PIN nunca en texto plano.
- Almacenar hash derivado (KDF) + salt.
- Material sensible solo en secret store por plataforma.

## 9. Experiencia de usuario y rendimiento

### 9.1 Cold start

- Splash nativo del host.
- Skeleton inmediato en UI.
- Home minimalista inicial: balance total y ultimos 10-20 movimientos.
- Features pesadas lazy: reportes, ajustes, import/export.

### 9.2 Escalamiento visual

- Virtualizacion en listas grandes de transacciones.
- Code splitting por ruta para evitar bundles gigantes.
- Evitar efectos CSS costosos en mobile.

## 10. Observabilidad

Paquete `telemetry` transversal:

- Logging estructurado en todas las capas.
- Metricas de sync: duracion push/pull, retries, conflictos.
- Error boundary en UI y trazabilidad por correlation id.
- Integracion de logs JS + nativos en mobile/desktop.

## 11. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Conflictos frecuentes | Mala UX, perdida de confianza | Reducir edicion concurrente y UI de resolucion clara |
| Crecimiento de complejidad en sync | Deuda tecnica y bugs | Empezar con LWW + conflicto fuerte en Transaction; iterar por fases |
| Exposicion de tokens en web SPA | Riesgo de seguridad | Priorizar cookies httpOnly y reducir superficie de tokens |
| Rendimiento en mobile | Lentitud y abandono | Disciplina de bundle, skeleton temprano y virtualizacion |

## 12. Registro de decisiones (ADR)

Este documento se complementa con ADRs formales:

- `docs/adr/ADR-001-local-first-outbox-sync.md`
- `docs/adr/ADR-002-ports-adapters-platform-abstraction.md`
- `docs/adr/ADR-003-money-minor-units-int64.md`
- `docs/adr/ADR-004-tombstones-soft-delete.md`
