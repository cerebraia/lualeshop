# Fórmulas financieras

## Zona horaria

Todas las fechas se almacenan en ISO 8601 UTC. Para reportes en Caracas (UTC-4):
`fecha_local = fecha_utc - 4 horas`

## Ingresos cobrados

Solo se contabilizan pedidos con `paymentStatus === 'paid'`.

```
Ingresos cobrados = Σ (pedido.total) para pedidos con paymentStatus = 'paid'
```

Los pedidos cancelados, pendientes o con pago parcial **no se incluyen**.

## Ventas pendientes de cobro

```
Ventas pendientes = Σ (pedido.total) para pedidos con status ≠ 'cancelled'
                   y paymentStatus IN ('pending', 'partial')
```

## Gastos

```
Total gastos = Σ (gasto.amount) para todos los gastos no archivados
             en el período seleccionado
```

## Costo de mercancía vendida (CMV)

Se calcula por pedido y variante:

```
CMV = Σ (orderItem.quantity × producto.cost) para cada ítem
      en pedidos con paymentStatus = 'paid'
```

Si `producto.cost = 0`, el ítem no suma al CMV y se marca como **"costo pendiente"**.

## Utilidad bruta

```
Utilidad bruta = Ingresos cobrados - CMV
```

Si algún producto no tiene costo, mostrar: **"Utilidad incompleta — hay productos sin costo"**

## Utilidad neta estimada

```
Utilidad neta estimada = Utilidad bruta - Total gastos del período
```

Es una estimación porque no incluye depreciación, impuestos ni ajustes contables formales.

## Valor del inventario

```
Valor inventario = Σ (variante.stock × producto.cost)
                  para todos los productos activos
```

Si `producto.cost = 0`, esa variante no contribuye al valor. Se muestra advertencia.

## Productos sin costo en métricas

Cuando `noCost > 0`:

- La utilidad bruta se muestra como "Parcial"
- La valorización de inventario es incompleta
- Se muestra un badge de advertencia en el dashboard financiero

## Pagos múltiples por pedido

(Aplicable cuando está implementado el modelo de pagos múltiples en Supabase)

```
totalPagado = Σ (pago.amount) para pagos del pedido
paymentStatus:
  - totalPagado = 0 → 'pending'
  - 0 < totalPagado < pedido.total → 'partial'
  - totalPagado ≥ pedido.total → 'paid'
```

Un pago mayor que el total del pedido no debe generar crédito silenciosamente.
Requiere confirmación explícita o lógica de saldo a favor documentada.

## Reglas generales

- Los precios siempre son USD con 2 decimales
- No se asume ganancia = precio de venta
- No se incluyen pedidos cancelados en ninguna métrica de ingreso
- No se duplican ingresos por múltiples pagos del mismo pedido
- Los pagos de prueba (prefijo TEST-) deben ser excluidos manualmente antes del lanzamiento
