# Storage Policy — Luale Kids Shop

## Buckets

### `product-images` (público)

| Operación | anon | authenticated admin |
|-----------|------|---------------------|
| SELECT    | ✅   | ✅                  |
| INSERT    | ❌   | ✅                  |
| UPDATE    | ❌   | ✅                  |
| DELETE    | ❌   | ✅                  |

- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamaño máximo: 5 MB
- Estructura de rutas: `<product_id>/<filename>.webp`
- URLs públicas: `https://<project>.supabase.co/storage/v1/object/public/product-images/<path>`

### `expense-receipts` (privado)

| Operación | anon | authenticated admin |
|-----------|------|---------------------|
| SELECT    | ❌   | ✅ (via URL firmada)|
| INSERT    | ❌   | ✅                  |
| UPDATE    | ❌   | ❌                  |
| DELETE    | ❌   | ✅                  |

- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Tamaño máximo: 10 MB
- Acceso mediante URLs firmadas con expiración (no URLs públicas directas)

## Migración de imágenes locales

Las imágenes actuales están en `public/images/products/*.webp` (servidas desde Next.js).

Proceso de migración a Storage (fase futura):

1. Subir cada archivo al bucket `product-images`:
   ```bash
   supabase storage cp public/images/products/ ss:///product-images/ --recursive
   ```

2. Actualizar `product_images.storage_path` para que apunte a la URL pública de Supabase.

3. Actualizar el componente `ProductImage` para construir la URL:
   ```ts
   const imageUrl = src.startsWith('/images/')
     ? src  // legacy local
     : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${src}`;
   ```

4. Verificar que todas las imágenes cargan correctamente.

5. Conservar los archivos en `/public` como fallback hasta verificación completa.

## Notas de seguridad

- No subir SVGs generados por usuarios (riesgo XSS).
- Las rutas de receipt no se exponen en respuestas de API públicas.
- Las URLs firmadas para receipts expiran en 1 hora por defecto.
