# UI v1 - Flujos y experiencia (mobile-first)

Estado: Propuesto  
Fecha: 2026-03-03

## 1. Objetivo

Definir la experiencia v1 evitando una app centrada en pantallas CRUD.
La UI se diseña por **intenciones del usuario** y cada pantalla debe ayudar a tomar una decision.

## 2. Principios de diseño

- Registrar un gasto en menos de 10 segundos.
- Mostrar contexto (saldo, tendencia, categorias) antes de pedir edicion manual.
- Minimizar formularios largos; usar defaults inteligentes y edicion progresiva.
- Priorizar lectura y accion rapida en mobile.
- Cada flujo debe contemplar estados: `loading`, `empty`, `error`, `offline`.

## 3. Mapa de navegacion v1

Barra principal (4 tabs):

1. **Inicio**
2. **Movimientos**
3. **Registrar** (accion principal)
4. **Cuenta** (ajustes, sync, datos)

## 4. Flujos prioritarios (jobs-to-be-done)

### F1. Registrar gasto rapido

**Intencion:** “Acabo de gastar y quiero registrarlo ya”.

Pasos:
1. Tap en `Registrar`.
2. Ingreso monto (teclado numerico), categoria sugerida, nota opcional.
3. Confirmar.
4. Ver feedback inmediato + opcion “Deshacer”.

No-negociables UX:
- Cuenta por defecto preseleccionada.
- Fecha por defecto = ahora.
- Ultimas categorias usadas primero.

### F2. Entender en que gaste

**Intencion:** “Quiero saber a donde se fue mi dinero”.

Pasos:
1. Abrir `Inicio`.
2. Ver resumen del mes (gasto total, ingresos, balance).
3. Ver top categorias y acceso a lista filtrada.

No-negociables UX:
- Indicador visual de categoria dominante.
- Filtro rapido por rango (semana/mes).

### F3. Revisar y corregir movimientos

**Intencion:** “Necesito corregir un movimiento mal registrado”.

Pasos:
1. Abrir `Movimientos`.
2. Buscar/filtrar (categoria, fecha, cuenta).
3. Editar o eliminar.
4. Reflejar cambios en resumen.

No-negociables UX:
- Lista virtualizable y orden por fecha descendente.
- Confirmacion corta para eliminar.

### F4. Confiar en el estado de sincronizacion

**Intencion:** “Quiero saber si mis datos estan guardados y sincronizados”.

Pasos:
1. Abrir `Cuenta`.
2. Ver estado de sync (ultimo intento, pendientes, errores).
3. Accion manual “Sincronizar ahora” si aplica.

No-negociables UX:
- Estado claro: `Sincronizado`, `Pendiente`, `Error`.
- Mensajes accionables en error (sin tecnicismos).

## 5. Pantallas v1 y contenido minimo

### Inicio

- Balance actual.
- Gasto del mes.
- Top 3 categorias.
- Ultimos 5 movimientos.
- CTA principal: `Registrar movimiento`.

### Movimientos

- Lista de movimientos.
- Filtros: fecha, cuenta, categoria.
- Acciones por item: editar, eliminar.

### Registrar

- Monto (obligatorio).
- Tipo (gasto/ingreso).
- Categoria.
- Cuenta.
- Fecha.
- Nota (opcional).

### Cuenta

- Estado de sincronizacion.
- Gestion de cuentas y categorias.
- Preferencias basicas (moneda principal, exportar en futuras fases).

## 6. Contratos de UI (preliminares)

Estos contratos son de capa UI; se mapean a `commands`/`queries` existentes.

- `queryHomeSummary(monthRange)` -> balance, totales, topCategorias, recientes.
- `queryTransactionList(filters)` -> items paginados/listados.
- `commandQuickAddTransaction(input)` -> crea movimiento rapido.
- `commandEditTransaction(input)` -> actualiza.
- `commandDeleteTransaction(id)` -> tombstone.
- `querySyncStatus()` -> estado visual de sincronizacion.
- `commandSyncNow()` -> disparo manual.

Nota: `queryHomeSummary` ya puede mapearse con `GetAccountSummary` (por cuenta/rango).
`querySyncStatus` aun no existe como use case dedicado.

## 7. Anti-patrones a evitar

- Pantalla “Cuentas” o “Categorias” como formulario vacio sin contexto.
- Forzar al usuario a completar campos no criticos para registrar rapido.
- Duplicar los mismos filtros en todas las pantallas sin objetivo claro.
- Mostrar estados tecnicos de sync sin traduccion funcional para el usuario.

## 8. Plan de implementacion por slices

### Slice 1 (MVP usable)

- `Registrar` rapido + listado de `Movimientos`.
- Edicion/eliminacion basica.
- Resumen simple en `Inicio` (totales + recientes).

### Slice 2

- Top categorias, filtros avanzados, busqueda.
- Estado de sync mas detallado en `Cuenta`.

### Slice 3

- Refinamientos UX: sugerencias, atajos, mejores empty states.

## 9. Criterios de aceptacion v1

- Un usuario puede registrar, corregir y revisar gastos sin salir de los 4 tabs.
- No hay bloqueos por conectividad para CRUD local.
- Cada pantalla tiene estado `empty`, `error` y `loading` definido.
- Los flujos F1-F4 pueden ejecutarse end-to-end en mobile.
