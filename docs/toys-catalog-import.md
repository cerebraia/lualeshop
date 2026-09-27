# Toys Catalog Import Manifest

Importación realizada el 2026-09-27 desde `reference/Catalogo_Juguetes_Luale_CORREGIDO.pdf`.

## PDF

| Propiedad | Valor |
|-----------|-------|
| Páginas | 7 |
| Portada | Página 1 |
| Productos | Páginas 2–6 |
| Cierre | Página 7 |
| Texto extraíble | Sí (no requirió OCR) |

## Productos importados

| # PDF | SKU | Nombre | Precio | Página PDF | Product ID |
|-------|-----|--------|--------|------------|------------|
| 01 | JUG-001 | Juego de clasificación | €20 | 2 | 03c243e6-e0bb-4713-8e87-adb7aef4ed7c |
| 02 | JUG-002 | Tableros de encaje educativo | €10 c/u | 3 | 68be3586-2087-4ce9-a236-4d6b6639a54e |
| 03 | JUG-003 | Busy Book | €15 | 4 | 4d26a031-c4f4-430c-b8ea-6261f77605a6 |
| 04 | JUG-004 | Puzzle My World | €10 c/u | 5 | bfdd8b5b-df4c-4d29-897a-688e575ea345 |
| 05 | JUG-005 | Piezas magnéticas | €20 | 6 | 4020db37-1f6b-439f-908f-8dbb17322a2a |

## Imágenes

| SKU | Storage path | Dimensiones (post-Sharp) |
|-----|--------------|--------------------------|
| JUG-001 | `products/03c243e6-e0bb-4713-8e87-adb7aef4ed7c/014d409f-3137-49da-8501-1b200d3b338f.webp` | 1112×1200 |
| JUG-002 | `products/68be3586-2087-4ce9-a236-4d6b6639a54e/7ebb4f24-a707-4dde-874d-2f068055d6fa.webp` | 1200×1097 |
| JUG-003 | `products/4d26a031-c4f4-430c-b8ea-6261f77605a6/4a19748e-b742-49c1-a29c-a827f2ed05d1.webp` | 1200×1097 |
| JUG-004 | `products/bfdd8b5b-df4c-4d29-897a-688e575ea345/5265f578-d184-48e8-8724-31ac7de5b8f4.webp` | 1200×1097 |
| JUG-005 | `products/4020db37-1f6b-439f-908f-8dbb17322a2a/5e6ab605-00ca-4f0b-83b6-eab57b7a4b3d.webp` | 1200×1200 |

## Categoría

| Campo | Valor |
|-------|-------|
| Nombre | Juguetes |
| Slug | juguetes |
| ID | 80241ebf-5b40-4728-b348-76004af55f70 |
| sort_order | 4 |

## Notas

- "c/u" = precio por unidad (tableros y puzzles se venden por separado)
- Ningún producto tiene talla ni variante de color
- `inventoryConfigured = false` → muestra "Consultar disponibilidad" como stock
- `is_new = true` → badge de novedad activo
- SKU estable generado por orden de aparición en el PDF
