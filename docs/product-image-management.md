# Gestión de fotografías de productos

## Arquitectura

Las imágenes de productos se almacenan en Supabase Storage (bucket `product-images`).
Los metadatos viven en la tabla `product_images`.

En modo demo (mock), las imágenes se sirven desde `/public/images/products/` y sus rutas se
almacenan en `Product.images[]` (localStorage).

## Bucket: `product-images`

- **Público**: cualquier visitante puede leer imágenes de productos activos
- **Escritura**: solo owner/admin activo con sesión
- **Límite**: 10 MB por archivo
- **Formatos**: JPEG, PNG, WebP

## Tabla: `product_images`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | ID de la imagen (también nombre del archivo en Storage) |
| product_id | uuid | Referencia al producto |
| storage_path | text | Ruta en Storage: `products/{product_id}/{uuid}.webp` |
| alt_text | text | Texto alternativo para accesibilidad |
| position | integer | Orden (0 = primera) |
| is_primary | boolean | Portada del catálogo |
| width | integer | Ancho en píxeles después de procesar |
| height | integer | Alto en píxeles después de procesar |
| file_size | integer | Tamaño en bytes después de procesar |
| mime_type | text | Siempre `image/webp` (procesado por Sharp) |
| created_by | uuid | Usuario que subió la imagen |
| created_at | timestamptz | Fecha de creación |
| updated_at | timestamptz | Última modificación |

## Restricciones

- Máximo 8 imágenes por producto
- Solo una imagen primary por producto (índice único parcial)
- Al eliminar la primary, la siguiente por position se convierte en primary
- `position >= 0`
- `storage_path` único (no se sobrescriben imágenes con el mismo nombre)

## Flujo de carga

1. El administrador arrastra o selecciona imágenes en `/admin/productos`
2. El frontend envía cada archivo a `POST /api/products/{id}/images`
3. El API route valida sesión, perfil, producto y conteo
4. Valida el tipo real del archivo por firma binaria (no solo MIME del navegador)
5. Procesa con Sharp: convierte a WebP, máx 1600px, calidad 85, corrige EXIF
6. Sube a Supabase Storage con una ruta `products/{product_id}/{uuid}.webp`
7. Inserta metadata en `product_images`
8. Devuelve la URL pública al cliente

## Procesamiento con Sharp

- Entrada: JPEG, PNG o WebP
- Salida: WebP (siempre)
- Tamaño: máximo 1600px en el lado mayor, sin recortar
- Calidad: 85
- EXIF: rotación corregida, metadatos eliminados
- Sin filtros, sin IA, sin recorte automático

## URL pública de imagen

```
https://{supabase_project}.supabase.co/storage/v1/object/public/product-images/products/{product_id}/{uuid}.webp
```

## Migración de imágenes existentes

Las 46 imágenes extraídas del PDF están en `/public/images/products/`.
Para migrarlas a Supabase Storage:
1. Ver `docs/product-image-upload.md` — sección "Migración masiva"
2. No eliminar los archivos locales hasta verificar las URLs en producción
3. Mantener las rutas locales como fallback durante la transición

## RPC Functions

| Función | Descripción |
|---------|-------------|
| `reorder_product_images(product_id, image_ids[])` | Reordena todas las imágenes del producto |
| `set_primary_product_image(product_id, image_id)` | Establece una imagen como portada |
| `delete_product_image(image_id)` | Elimina metadata y devuelve storage_path |

Todas requieren sesión autenticada con rol admin u owner.
