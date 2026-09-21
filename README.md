# Luale Kids Shop

Tienda de ropa infantil en línea para Luale Kids Shop, ubicada en Caracas, Venezuela.

> "Más que ropa, es amor en cada detalle."

---

## Estado actual

**En preparación para lanzamiento.** El código está completo y pasa todas las validaciones.
Pendiente de configurar el repositorio remoto, las variables de entorno en Railway,
y la conexión a Supabase.

Ver `docs/launch-readiness.md` para el checklist completo.

---

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
cp .env.example .env.local
# Completar valores en .env.local
npm run dev
```

Accede en:
- **Tienda pública:** http://localhost:3000
- **Dashboard admin:** http://localhost:3000/admin

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en producción |
| `npm run lint` | Verificar con ESLint |
| `npm run test` | Ejecutar tests (vitest) |
| `npm run audit:catalog` | Auditoría del catálogo (46 productos) |
| `npx tsx scripts/audit-images.ts` | Auditoría de imágenes |

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

| Variable | Valor | Descripción |
|---------|-------|-------------|
| `NEXT_PUBLIC_DATA_PROVIDER` | `mock` / `supabase` | Backend de datos |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | Solo con DATA_PROVIDER=supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima | Solo con DATA_PROVIDER=supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio | **Solo servidor** — nunca al navegador |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `false` | `true` solo al lanzar públicamente |
| `NEXT_PUBLIC_SITE_URL` | `https://lualekids.shop` | Dominio canónico |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `584220162748` | Sin + ni espacios |

## Modos de operación

### Modo mock (desarrollo)
Sin Supabase. Los datos se almacenan en `localStorage`. No requiere conexión.

```bash
NEXT_PUBLIC_DATA_PROVIDER=mock  # valor por defecto
```

### Modo Supabase (producción)
Requiere proyecto Supabase con las 11 migraciones aplicadas.

```bash
supabase db push  # aplica migraciones
```

## Arquitectura

```
app/
  (public)/             — Tienda pública (/, /catalogo, /categoria, /producto, etc.)
  admin/                — Dashboard administrativo
  api/products/[id]/    — API routes (carga de imágenes)
lib/
  data-provider.ts      — Abstracción mock/supabase
  types.ts              — Tipos TypeScript compartidos
  repositories/         — Repositorios mock (localStorage)
  repositories/supabase/— Repositorios Supabase
components/
  admin/                — Componentes del dashboard
  product/              — ProductCard, ProductImageCarousel
  ui/                   — Componentes reutilizables
supabase/
  migrations/           — 11 migraciones SQL
docs/
  launch-readiness.md   — Checklist de lanzamiento
  first-real-sale.md    — Guía de primera venta real
  backup-strategy.md    — Estrategia de respaldo
  recovery-runbook.md   — Runbook de recuperación
public/images/products/ — 46 imágenes del catálogo (WebP)
```

## Catálogo

- 46 productos: Bebés (31), Niñas (7), Niños (8)
- Todos con imagen WebP extraída del catálogo PDF
- Pendiente: costos unitarios e inventario inicial real

Ver `/admin/inventario/inicial` para la carga de inventario.

## Seguridad

- RLS activo en todas las tablas de Supabase
- Service role nunca expuesto al navegador
- Imágenes validadas por firma binaria en el servidor
- Indexación controlada por variable de entorno
- `.env.local`, `.claude/`, `artifacts/` excluidos del repositorio

## Contacto

- WhatsApp: +58 422-0162748
- Instagram: @lualekids.shop
- Ubicación: Caracas, Venezuela
