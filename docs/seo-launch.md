# SEO — Preparación para lanzamiento

## Gate de indexación

`NEXT_PUBLIC_ALLOW_INDEXING` controla todo:

| Valor | robots.txt | Meta robots | Sitemap visible |
|-------|-----------|-------------|-----------------|
| `false` (default) | `Disallow: /` | `noindex, nofollow` | Existe pero no anunciado |
| `true` | Reglas normales | index, follow | Anunciado en robots.txt |

**No cambiar a `true` sin completar el gate de lanzamiento.**

## Canonical URLs

Todas las páginas públicas tienen canonical correcto:

| Página | Canonical |
|--------|-----------|
| Home | `https://lualekids.shop` |
| Catálogo | `https://lualekids.shop/catalogo` |
| Bebés | `https://lualekids.shop/categoria/bebes` |
| Niñas | `https://lualekids.shop/categoria/ninas` |
| Niños | `https://lualekids.shop/categoria/ninos` |
| Producto | `https://lualekids.shop/producto/{slug}` |
| Nuestra historia | `https://lualekids.shop/nuestra-historia` |
| FAQ | `https://lualekids.shop/preguntas-frecuentes` |

## Sitemap

`/sitemap.xml` — generado dinámicamente con Next.js.

Incluye: home, catálogo, 3 categorías, 46 productos, nuestra historia, FAQ.
Excluye: admin, login, API, rutas de filtros, query params.

## Robots.txt

`/robots.txt` — generado dinámicamente.

Con `ALLOW_INDEXING=false`: bloquea todo.
Con `ALLOW_INDEXING=true`: permite públicas, bloquea /admin, /api/.

## Structured Data (JSON-LD)

- **ClothingStore** en `app/(public)/layout.tsx` (todas las páginas públicas)
- **Product + BreadcrumbList** en cada ficha de producto

## Open Graph

- Imagen de marca: `/og-image.jpg` (1200×630)
- Producto: usa la imagen real del producto
- Twitter Card: `summary_large_image`

## Activación final

Solo tras confirmación del usuario:

```
NEXT_PUBLIC_ALLOW_INDEXING=true
```

Después:
1. Verificar `/robots.txt` → ya no dice `Disallow: /`
2. Verificar `<meta name="robots">` → ya no dice `noindex`
3. Verificar `/sitemap.xml` → carga con todas las URLs
4. Verificar canonical de cada página
5. Verificar que `/admin` sigue en `Disallow`
6. NO enviar a Google Search Console todavía sin propiedad verificada
