# Recuperación de imágenes

## Imagen desaparecida del carrusel público

**Síntoma**: Un producto no muestra imagen; aparece el placeholder de Luale.

1. Verificar que el producto tiene imágenes:
   ```sql
   SELECT id, storage_path, is_primary, position
   FROM product_images
   WHERE product_id = 'TU_PRODUCT_ID'
   ORDER BY position;
   ```
2. Verificar que el archivo existe en Storage:
   Supabase Dashboard → Storage → product-images → products/TU_PRODUCT_ID/
3. Si la metadata existe pero el archivo no:
   - Volver a subir la imagen desde el dashboard
   - No eliminar el registro huérfano hasta que la nueva imagen esté confirmada
4. Si hay metadata huérfana (sin archivo en Storage):
   - Registrar el `id` del registro
   - Subir la imagen de reemplazo
   - Eliminar el registro huérfano manualmente:
     ```sql
     DELETE FROM product_images WHERE id = 'TU_IMAGE_ID';
     ```

## Imagen principal no identificada

**Síntoma**: Las tarjetas del catálogo muestran una imagen incorrecta.

1. Verificar cuál imagen tiene `is_primary = true`:
   ```sql
   SELECT id, storage_path, is_primary FROM product_images
   WHERE product_id = 'TU_PRODUCT_ID';
   ```
2. Si hay más de una primary (no debería ocurrir con el índice único):
   ```sql
   UPDATE product_images SET is_primary = false
   WHERE product_id = 'TU_PRODUCT_ID';
   -- Luego:
   SELECT set_primary_product_image('TU_PRODUCT_ID', 'TU_IMAGE_ID');
   ```
3. Desde el dashboard: ir al producto → sección de fotos → seleccionar la foto correcta → "Establecer portada"

## Imagen eliminada accidentalmente

Una vez eliminada, la imagen se borra de Storage y de la base de datos. No hay papelera de reciclaje.

Opciones de recuperación:
1. Si existe backup de Storage: restaurar el archivo
2. Si tienes la imagen original: volver a subirla desde el dashboard
3. Las imágenes del PDF original están en `/public/images/products/` — pueden volver a subirse

## Objeto huérfano en Storage

**Síntoma**: Archivo en Storage sin metadata en `product_images`.

1. Ejecutar la auditoría: `npx tsx scripts/audit-images.ts`
2. Identificar los archivos huérfanos
3. Si el archivo no pertenece a ningún producto activo, es seguro eliminarlo:
   Supabase Dashboard → Storage → product-images → eliminar manualmente
4. No eliminar archivos en rutas `/products/{product_id}/` sin verificar el product_id

## Posiciones desordenadas tras un error

**Síntoma**: Las imágenes no aparecen en el orden esperado.

```sql
-- Ver posiciones actuales
SELECT id, position, is_primary FROM product_images
WHERE product_id = 'TU_PRODUCT_ID'
ORDER BY position;

-- Reasignar posiciones secuenciales
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY position, created_at) - 1 AS new_pos
  FROM product_images WHERE product_id = 'TU_PRODUCT_ID'
)
UPDATE product_images pi
SET position = o.new_pos
FROM ordered o WHERE pi.id = o.id;
```

## Verificar integridad completa

```sql
-- Productos sin imágenes
SELECT p.id, p.sku, p.name
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
  AND p.status = 'active';

-- Productos sin primary
SELECT p.id, p.sku
FROM products p
WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.is_primary = true
  );

-- Posiciones duplicadas
SELECT product_id, position, count(*)
FROM product_images
GROUP BY product_id, position
HAVING count(*) > 1;
```
