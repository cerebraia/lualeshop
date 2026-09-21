# Integraciones pendientes — Luale Kids Shop

## Estado de la fase 2

Completado:
- 46 productos reales cargados (Bebés: 31, Niñas: 7, Niños: 8)
- Sistema de migraciones localStorage v2
- `inventoryConfigured` por producto (todos pendientes de stock real)
- Opciones de precio múltiple (`purchaseOptions`)
- Flujo WhatsApp actualizado con opción de compra, total y logging de intención
- Dashboard con métricas de imágenes e inventario pendiente
- Filtros de precio, sin imagen e inventario pendiente en admin

Pendiente antes de lanzar:
- Fotografías de los 46 productos (ver `docs/product-image-requirements.md`)
- Confirmar talla de producto #14 (Sets Leggings Blanco y Negro)
- Ingresar stock real de los productos disponibles

## 1. Supabase (base de datos y autenticación)

**Estado:** Pendiente  
**Prioridad:** Alta  
**Esfuerzo estimado:** 2-3 días

### Qué hacer:
- Crear proyecto en Supabase.
- Diseñar esquema de tablas: `products`, `product_variants`, `categories`, `product_categories`, `inventory_movements`, `merchandise_entries`, `customers`, `orders`, `order_items`, `expenses`, `store_settings`.
- Reemplazar cada `lib/repositories/*.ts` con la implementación de Supabase (misma interfaz, distinta implementación).
- Usar `@supabase/supabase-js` y `@supabase/auth-helpers-nextjs`.
- Configurar Row Level Security (RLS) para proteger los datos del admin.

### Archivos a modificar:
- `lib/repositories/*.ts` (reemplazar localStorage por queries Supabase)
- `lib/storage.ts` (ya no necesario para persistencia principal)
- `.env.local` (agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## 2. Supabase Auth (autenticación del dashboard)

**Estado:** Pendiente  
**Prioridad:** Alta  
**Esfuerzo estimado:** 1 día

### Qué hacer:
- Configurar Supabase Auth con email/contraseña o Magic Link.
- Agregar middleware de Next.js para proteger `/admin/*`.
- Mostrar pantalla de login en `/admin/login`.
- Eliminar el banner de "Modo demostración".

### Archivos a crear/modificar:
- `app/admin/login/page.tsx`
- `middleware.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

---

## 3. Subida de imágenes (Supabase Storage)

**Estado:** Pendiente  
**Prioridad:** Media  
**Esfuerzo estimado:** 1-2 días

### Qué hacer:
- Crear bucket en Supabase Storage para imágenes de productos.
- Agregar campo de subida de imágenes en el formulario de productos.
- Reemplazar `ProductPlaceholder` por imágenes reales con `next/image`.
- Definir política de acceso público al bucket.

### Archivos a modificar:
- `app/admin/productos/page.tsx` (agregar uploader de imágenes)
- `components/ui/ProductPlaceholder.tsx` (reemplazar por `<Image>` cuando haya URL)
- `components/product/ProductCard.tsx` (usar imagen real)

---

## 4. Railway / Vercel (despliegue)

**Estado:** Pendiente  
**Prioridad:** Media  
**Esfuerzo estimado:** Medio día

### Qué hacer:
- Configurar despliegue en Vercel (recomendado para Next.js) o Railway.
- Agregar variables de entorno del `.env.example` en la plataforma.
- Configurar dominio `lualekids.shop`.
- Configurar redirects de www → dominio principal.

---

## 5. GitHub (control de versiones)

**Estado:** Pendiente  
**Prioridad:** Alta  
**Esfuerzo estimado:** 1 hora

### Qué hacer:
- Crear repositorio en GitHub.
- Configurar `.gitignore` (ya incluye `.env.local`).
- Hacer primer commit.
- Conectar a Vercel para CI/CD automático.

---

## 6. WhatsApp Business API (opcional)

**Estado:** No iniciado  
**Prioridad:** Baja  
**Esfuerzo estimado:** Variable

### Descripción:
El flujo actual usa `wa.me` links para abrir WhatsApp directamente. En una fase futura podría integrarse la API oficial de WhatsApp Business para notificaciones automáticas de estado de pedido.

---

## 7. Analytics (opcional)

**Estado:** No iniciado  
**Prioridad:** Baja  

### Opciones:
- Vercel Analytics (integración nativa, gratis).
- Google Analytics 4.
- Plausible (enfocado en privacidad).

---

## 8. SEO avanzado

**Estado:** Parcialmente implementado  
**Prioridad:** Media  

### Pendiente:
- Agregar `sitemap.xml` dinámico (`app/sitemap.ts`).
- Agregar `robots.txt` (`app/robots.ts`).
- Open Graph con imágenes dinámicas por producto.
- Datos estructurados (JSON-LD) para productos.

---

## 9. Fotografías del catálogo

**Estado:** Pendiente  
**Prioridad:** Alta (bloquea el lanzamiento)  

### Pendiente:
- Fotografías reales de los 46 productos.
- Ver `docs/product-image-requirements.md` para specs.
- Una vez disponibles: subir a `public/images/products/` y actualizar `images[]` en mock.
- En fase Supabase: migrar a Supabase Storage.

---

## 10. Confirmaciones pendientes del catálogo

**Estado:** Pendiente  

- Talla del producto #14 (Sets Leggings Blanco y Negro): registrada como "9-13 meses", pendiente confirmación.
- Stock real de los 46 productos: ingresar desde `/admin/inventario` una vez disponibles.
- Dominio `lualekids.shop`: configurar en Vercel una vez desplegado.
