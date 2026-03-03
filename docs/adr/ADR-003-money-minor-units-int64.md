# ADR-003: Representacion de Money en minor units int64

Estado: Aceptado  
Fecha: 2026-03-02

## Contexto

El sistema maneja montos financieros para balances, presupuestos y transacciones. El uso de `float` introduce errores de precision y redondeo incompatibles con contabilidad confiable.

## Decision

Se representa `Money` con unidades menores enteras:

- `amountMinor: int64`
- `currency: string` (ejemplo: COP, USD)

Toda operacion aritmetica se hace sobre enteros. La conversion a formato decimal se limita a presentacion.

## Consecuencias

Positivas:

- Precision deterministica en operaciones financieras.
- Reglas de negocio mas simples y auditables.
- Menor riesgo de discrepancias entre plataformas.

Trade-offs:

- Necesidad de utilidades de formato/parsing por moneda.
- Cuidado adicional en conversiones con tasas o prorrateos.

## Alternativas consideradas

1. `float`/`double`: rechazada por imprecision binaria.
2. Decimal arbitrario en todas las capas: pospuesta por costo de librerias y serializacion para MVP.

## Criterios de aceptacion

- Ninguna entidad financiera usa `float` para persistencia o logica.
- Validacion de moneda consistente por cuenta.
- Formateo de montos desacoplado de reglas de dominio.
