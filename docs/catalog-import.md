# Importación del catálogo

## Estado actual

El catálogo tiene 46 productos reales cargados en `lib/mock/products.ts`. Todos tienen `inventoryConfigured: false` porque los stocks reales no han sido ingresados.

## Cómo agregar imágenes de productos

Las fotografías van en `public/images/products/`.

### Convención de nombres

```
public/images/products/{slug-del-producto}-1.jpg
public/images/products/{slug-del-producto}-2.jpg
public/images/products/{slug-del-producto}-3.jpg
```

Ejemplo para "Set Floral Rosa":
```
public/images/products/set-floral-rosa-1.jpg
public/images/products/set-floral-rosa-2.jpg
```

### Después de agregar imágenes

Actualizar el arreglo `images` en `lib/mock/products.ts`:

```typescript
{
  id: 'prod-009',
  name: 'Set Floral Rosa',
  slug: 'set-floral-rosa',
  images: [
    '/images/products/set-floral-rosa-1.jpg',
    '/images/products/set-floral-rosa-2.jpg',
  ],
  // ...
}
```

### Luego actualizar el ProductPlaceholder

En `components/ui/ProductPlaceholder.tsx` y `components/product/ProductCard.tsx`, reemplazar el placeholder con `next/image` cuando `product.images.length > 0`:

```tsx
{product.images.length > 0 ? (
  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
) : (
  <ProductPlaceholder name={product.name} index={index} className="absolute inset-0" />
)}
```

## Cómo configurar inventario real

En `/admin/inventario`, usar el ajuste manual para cada variante del producto. Una vez configurado, cambiar `inventoryConfigured: true` en el mock (o hacerlo desde el formulario del producto en `/admin/productos`).

## Cómo confirmar la talla del producto #14

El producto "Sets Leggings Blanco y Negro" (prod-020) tiene `sizeNote: 'Talla pendiente de confirmación'`. La talla registrada es "9-13 meses". Una vez confirmada, eliminar el `sizeNote` y actualizar el variant.

## Resumen del catálogo

| Categoría | Cantidad |
|-----------|----------|
| Bebés     | 31       |
| Niñas     | 7        |
| Niños     | 8        |
| **Total** | **46**   |

Productos con opciones de precio múltiple: 7  
(Medias con Lazo, Medias Básicas, Medias Smile, Medias con Olán, Medias Altas, Pantalones Jogger, Set Leggings Básicos)
