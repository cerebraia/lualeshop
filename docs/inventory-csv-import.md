# Importación CSV de inventario inicial

## Plantilla

Descarga la plantilla desde `/admin/inventario/inicial` → "Exportar plantilla CSV".

El archivo incluye todos los productos y variantes del catálogo (46 productos, múltiples tallas).
Las columnas `initial_quantity` y `unit_cost` vienen vacías — el propietario las llena.

## Formato

- Encoding: **UTF-8 con BOM** (compatible con Excel en Windows)
- Separador: coma (`,`)
- Comillas: las celdas con comas o caracteres especiales deben ir entre comillas dobles
- Primera fila: cabeceras fijas (no modificar)

## Preparar el CSV en Excel

1. Abrir el archivo exportado
2. Localizar las columnas `initial_quantity` y `unit_cost`
3. Ingresar los valores numéricos directamente (sin símbolos de moneda, sin comas de miles)
4. Al guardar: Archivo → Guardar como → CSV UTF-8 (con BOM)

## Preparar el CSV en Google Sheets

1. Subir el archivo a Google Drive → Abrir con Google Sheets
2. Completar las columnas requeridas
3. Archivo → Descargar → Valores separados por comas (.csv)

## Validación del sistema

El importador valida cada fila antes de aplicar cambios:

| Error | Causa |
|-------|-------|
| `SKU "LK-XXX" no encontrado` | El SKU no existe en el catálogo actual |
| `variant_id "v-..." no encontrado` | ID de variante no coincide con el producto |
| `Cantidad inválida` | Valor no es entero ≥ 0 |
| `Costo inválido` | Valor no es número ≥ 0 |

Si hay **cualquier error**, el importador rechaza todo el archivo. Corrige los errores y vuelve a importar.

## Protección contra fórmulas peligrosas

La plantilla exportada no incluye fórmulas. Si el CSV importado contiene celdas que empiecen
con `=`, `+`, `-` o `@`, el sistema los trata como texto y generarán error de validación
(no son números válidos). El sistema nunca ejecuta fórmulas de hoja de cálculo.

## Identificadores estables

El identificador principal es `variant_id` (ej. `v-001-1`). El SKU se usa para localizar el
producto pero el `variant_id` identifica la variante exacta. No uses el nombre del producto
ni la talla como identificadores — pueden cambiar.

## Qué no puede hacer el CSV

- Crear productos nuevos
- Modificar nombres, precios ni categorías
- Registrar ventas o pagos
- Activar indexación SEO
- Asignar valores negativos

## Después de importar

Los datos se cargan al formulario de inventario inicial. Revisa visualmente que los valores
sean correctos antes de presionar "Vista previa" y "Confirmar".

## Reporte de errores

Si hay filas con error, el sistema muestra:
- Número de fila en el CSV
- SKU y talla de la variante afectada
- Descripción del error

Puedes descargar el CSV original, corregir las filas indicadas y volver a importar.
