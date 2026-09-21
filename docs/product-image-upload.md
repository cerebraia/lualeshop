# Carga de fotografías — guía de uso

## Desde el dashboard

1. Ir a `/admin/productos`
2. Hacer clic en **Editar** (icono lápiz) en el producto
3. En el panel de edición, desplazarse hasta la sección **Fotografías del producto**
4. Para subir fotos:
   - Arrastrar archivos a la zona de carga, o
   - Hacer clic en "Arrastra fotos aquí o haz clic para seleccionar"
5. Esperar a que cada archivo se procese y suba
6. Revisar el resultado en la galería

## Formatos aceptados

| Formato | Extensión | Máx. tamaño |
|---------|-----------|-------------|
| JPEG | .jpg, .jpeg | 10 MB |
| PNG | .png | 10 MB |
| WebP | .webp | 10 MB |

No se aceptan: SVG, GIF animado, HEIC, PDF, BMP, TIFF.

## Límites

- Máximo 8 fotografías por producto
- Máximo 10 MB por archivo (antes de procesar)
- Múltiples archivos simultáneos (hasta el límite disponible)

## Portada del catálogo

- La primera imagen subida se convierte automáticamente en portada
- Para cambiar la portada: seleccionar una imagen en el carrusel → botón "Establecer portada"
- La portada aparece marcada con una estrella dorada
- Las tarjetas del catálogo y la página de inicio usan únicamente la portada

## Reordenar imágenes

- Arrastrar las miniaturas en el gestor del dashboard para cambiar el orden
- El orden se guarda automáticamente al soltar
- F5 conserva el orden guardado
- El orden se refleja en el carrusel público

## Eliminar una fotografía

1. Seleccionar la imagen en el carrusel del gestor
2. Hacer clic en "Eliminar"
3. Confirmar la acción
4. Si era la portada, la siguiente imagen toma ese rol automáticamente
5. Si era la última imagen, el producto mostrará el fallback de Luale

## Texto alternativo

El texto alt inicial es: `[Nombre del producto] de Luale Kids Shop`

Para editar:
1. Seleccionar la imagen
2. Hacer clic en "Alt"
3. Escribir una descripción breve del contenido visual
4. Guardar

Reglas para el texto alt:
- No vacío
- Máximo 200 caracteres
- Sin HTML
- Sin precio
- Describir el contenido (ej: "Pijama de algodón estampado de dinosaurios en rosa")

## Modo demo (sin Supabase)

En modo demo, la carga de nuevas fotografías no está disponible.
Las imágenes existentes (extraídas del PDF) se muestran y pueden reordenarse localmente.

Para habilitar la carga real:
1. Configurar `.env.local` con credenciales Supabase
2. `NEXT_PUBLIC_DATA_PROVIDER=supabase`

## Migración masiva de imágenes existentes

Para migrar las 46 imágenes de `/public/images/products/` a Supabase Storage:

```bash
# Script de migración (pendiente de implementar en scripts/migrate-images.ts)
# 1. Lee lib/mock/products.ts para obtener las rutas actuales
# 2. Para cada imagen, sube a Storage en products/{product_id}/{uuid}.webp
# 3. Inserta registro en product_images con is_primary=true
# 4. No elimina los archivos locales

npx tsx scripts/migrate-images.ts --dry-run   # Vista previa
npx tsx scripts/migrate-images.ts --execute   # Ejecutar
```

Verificar después:
- Cada producto tiene al menos 1 imagen en la base de datos
- Las URLs de Storage son accesibles públicamente
- Los fallback locales siguen funcionando
- No hay duplicados
