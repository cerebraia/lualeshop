# Requisitos para fotografías de productos

## Estado actual

Ningún producto tiene fotografía cargada. Todos muestran placeholders de color. El dashboard indica el conteo en "Sin imagen".

## Especificaciones técnicas

| Atributo | Valor recomendado |
|----------|-------------------|
| Formato  | JPEG o WebP |
| Dimensiones | 800 × 800 px (cuadrado) |
| Peso máximo | 200 KB por imagen |
| Fondo | Blanco o neutro claro |
| Cantidad por producto | 1 a 4 imágenes |

## Cómo importar las fotografías

1. Copiar las imágenes en `public/images/products/`
2. Seguir la convención de nombres: `{slug-del-producto}-{número}.jpg`
   - Ejemplo: `set-floral-rosa-1.jpg`, `set-floral-rosa-2.jpg`
3. En `lib/mock/products.ts`, actualizar el arreglo `images` del producto correspondiente
4. Verificar en la tienda que la imagen se muestra correctamente

La carpeta `public/images/products/` ya existe con un `.gitkeep` para que git la rastree.

## Slugs de referencia

Ver `lib/mock/products.ts` — cada producto tiene un campo `slug` que es el prefijo del archivo de imagen.

## Pendiente antes de lanzar

- [ ] Fotografías de los 46 productos
- [ ] Actualizar los `images[]` en `lib/mock/products.ts`
- [ ] Confirmar que `ProductCard` y la ficha de producto muestran las imágenes reales (actualizar el componente `ProductPlaceholder` / `ProductCard` para renderizar `next/image` cuando `product.images.length > 0`)
- [ ] Subir las imágenes a Supabase Storage en la fase 3 (ver `docs/pending-integrations.md`)
