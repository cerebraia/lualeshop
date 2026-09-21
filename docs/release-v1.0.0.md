# Release v1.0.0 — Luale Kids Shop

> **Estado**: PENDIENTE — release no activado aún

## Descripción

Primera versión pública de Luale Kids Shop, tienda infantil de ropa en Caracas, Venezuela.

## Alcance de esta versión

### Tienda pública
- Catálogo completo con 46 productos en 3 categorías (Bebés, Niñas, Niños)
- Filtros por categoría, tipo de prenda y estado
- Carrusel de imágenes por producto con soporte táctil y teclado
- Lightbox de imágenes
- Flujo de compra por WhatsApp (+58 422-0162748)
- Opciones de compra múltiples (5 productos)
- Información de tallas
- Indicadores de disponibilidad
- Página de historia y FAQ
- Responsive: 375px a 1440px

### Dashboard administrativo
- Autenticación con Supabase Auth (roles: owner, admin)
- Gestión de productos y categorías
- Gestor de imágenes con carga, reordenamiento (drag-and-drop), portada, alt text y eliminación
- Inventario con movimientos auditables
- Carga inicial de inventario con importador CSV
- Mercancía con entradas confirmables (RPC transaccional)
- Pedidos con ciclo completo (nuevo → confirmado → preparado → enviado → entregado → cancelado)
- Clientes
- Gastos
- Finanzas con fórmulas de utilidad bruta/neta
- Configuración comercial
- Panel de puesta en marcha (GO/NO-GO)

### Infraestructura
- Next.js 16 sobre Railway
- Supabase (PostgreSQL + Auth + Storage)
- 10 migraciones SQL con RLS completo
- Procesamiento de imágenes con Sharp (→ WebP, 1600px, calidad 85)
- Indexación controlada por variable de entorno
- Redirects www → non-www
- Headers de seguridad (CSP, HSTS, X-Frame-Options)

## Pendiente para v1.0.0

- [ ] Git remote configurado (GitHub privado)
- [ ] Commit inicial del código completo
- [ ] Variables de entorno en Railway
- [ ] Migraciones aplicadas en Supabase remoto
- [ ] Usuario owner creado
- [ ] Inventario inicial cargado
- [ ] Datos demo eliminados
- [ ] Smoke test completo en producción
- [ ] Indexación activada

## Fecha de activación

*(Pendiente de confirmación del propietario)*

## Notas de seguridad

- Service role nunca expuesto al navegador
- Todas las operaciones administrativas validadas server-side
- RLS activo en todas las tablas privadas
- Imágenes validadas por firma binaria antes de procesar
- `.env.local`, `.claude/`, `artifacts/` excluidos del repositorio
