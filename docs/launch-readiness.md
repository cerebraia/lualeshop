# Checklist de lanzamiento

El panel interactivo vive en `/admin/puesta-en-marcha`. Este documento es la versión estática
de referencia, útil para revisión fuera de la aplicación.

## Bloqueadores críticos (deben resolverse antes de operar)

- [ ] Supabase conectado (`NEXT_PUBLIC_DATA_PROVIDER=supabase` en `.env.local`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurados en el servidor
- [ ] Usuario owner registrado en Supabase Auth con `role = 'owner'` y `active = true`
- [ ] Migraciones de base de datos aplicadas (10 migraciones en `supabase/migrations/`)
- [ ] RLS activo en todas las tablas privadas
- [ ] Costo unitario registrado en al menos un producto
- [ ] Inventario inicial cargado (`/admin/inventario/inicial`)

## Catálogo

- [ ] 46 productos en el catálogo
- [ ] Todos los productos tienen imagen
- [ ] Todos los productos tienen precio de venta
- [ ] Todos los productos tienen categoría
- [ ] Tallas y opciones de compra correctas

## Inventario

- [ ] Inventario inicial cargado (`INICIAL-LUALE`)
- [ ] Costo unitario registrado en todos los productos
- [ ] Stock > 0 en los productos que se van a vender en el lanzamiento
- [ ] Productos sin stock marcados como "Consultar disponibilidad"

## Configuración comercial

- [ ] Nombre: Luale Kids Shop
- [ ] WhatsApp: 584220162748
- [ ] Instagram: @lualekids.shop
- [ ] Ubicación: Caracas, Venezuela
- [ ] Información de delivery en Caracas
- [ ] Información de envíos nacionales
- [ ] Métodos de pago aceptados documentados

## Operación

- [ ] Datos de demostración eliminados (pedidos, clientes, gastos, movimientos)
- [ ] Prueba operativa completada (ver `docs/first-real-sale.md`)
- [ ] Primer backup manual realizado

## Infraestructura

- [ ] Deploy activo en Railway
- [ ] Dominio lualekids.shop con DNS apuntando a Railway
- [ ] HTTPS activo
- [ ] Variables de entorno configuradas en Railway
- [ ] Indexación todavía desactivada (`NEXT_PUBLIC_ALLOW_INDEXING=false`)

## SEO (solo activar después de todo lo anterior)

- [ ] Home completa y revisada
- [ ] Catálogo funcionando con productos reales
- [ ] Páginas de producto con imágenes y descripciones
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=true` en Railway
- [ ] Sitemap accesible en `lualekids.shop/sitemap.xml`

## No hacer antes del lanzamiento

- No activar indexación con datos demo o catálogo incompleto
- No compartir la URL pública hasta que la tienda esté lista
- No registrar ventas reales en modo mock (localStorage)
- No usar el service role key en el navegador
- No modificar DNS sin verificar primero en staging
