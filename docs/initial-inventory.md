# Inventario inicial

## Propósito

Registrar el stock real y costo unitario de cada variante de producto con el que comienza Luale Kids Shop.
Esta carga debe realizarse **una sola vez** antes de la primera venta real.

## Acceso

`/admin/inventario/inicial`

## Referencia de la entrada

La entrada de mercancía se guarda con referencia `INICIAL-LUALE`. El sistema verifica que esta
referencia no exista antes de permitir guardar. Si ya existe, redirige al ajuste manual.

## Flujo manual (interfaz web)

1. Abrir `/admin/inventario/inicial`
2. Para cada variante, ingresar:
   - **Cantidad inicial** — entero ≥ 0 (dejar vacío si no se conoce aún)
   - **Costo unitario** — decimal ≥ 0 en USD (dejar vacío si es desconocido — se marcará como pendiente)
   - **Observación** — opcional
3. El sistema calcula en tiempo real: unidades totales y valorización
4. Presionar "Vista previa" para revisar el resumen
5. Presionar "Confirmar y guardar inventario inicial"

## Flujo por CSV (recomendado para 46 productos)

1. Presionar "Exportar plantilla CSV"
2. Abrir el archivo `luale-inventario-inicial.csv` en Excel o Google Sheets
3. Completar columnas `initial_quantity` y `unit_cost`
4. Guardar como CSV UTF-8
5. Presionar "Importar CSV" y seleccionar el archivo
6. El sistema valida cada fila y muestra errores por fila
7. Si no hay errores, los valores se cargan al formulario
8. Revisar y confirmar

## Columnas del CSV

| Columna | Descripción | Requerido |
|---------|------------|-----------|
| `sku` | SKU del producto (LK-001 a LK-046) | Sí |
| `catalog_number` | Número de catálogo (1–46) | No |
| `product_name` | Nombre del producto | No |
| `variant_id` | ID interno de variante | Sí |
| `size` | Talla o descripción de la variante | No |
| `initial_quantity` | Cantidad inicial (entero ≥ 0) | No |
| `unit_cost` | Costo unitario en USD | No |
| `notes` | Observación libre | No |

## Reglas de validación

- Cantidad: entero ≥ 0. No se aceptan decimales ni negativos.
- Costo: decimal ≥ 0. Se acepta 0 si el costo es desconocido.
- Si costo = 0 o vacío, el producto quedará marcado como "costo pendiente".
- No se crean productos nuevos desde este importador.
- No se modifican precios de venta ni categorías.
- Los SKU inexistentes generan error por fila.
- Si hay errores críticos, no se guarda nada.

## Efecto sobre el sistema

Después de confirmar:

- Se crea una `MerchandiseEntry` con referencia `INICIAL-LUALE`
- Se actualiza el stock de cada variante (`ProductVariant.stock`)
- Se actualiza el costo unitario del producto (`Product.cost`)
- Se marca `Product.inventoryConfigured = true` en cada producto con datos

## Correcciones posteriores

Si necesitas corregir stock después de la carga inicial, usa:
- `/admin/inventario` → Ajuste manual (para correcciones por variante)
- `/admin/mercancia` → Nueva entrada de mercancía (para nuevas compras)

**No modifiques la entrada `INICIAL-LUALE` directamente.**

## Qué NO hace este flujo

- No modifica precios de venta
- No crea clientes ni pedidos
- No registra gastos
- No activa indexación SEO
