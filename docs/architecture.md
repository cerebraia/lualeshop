# Arquitectura — Luale Kids Shop

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS v4 |
| Iconos | Lucide React |
| Animaciones | Framer Motion |
| Persistencia actual | localStorage (capa simulada) |
| Persistencia futura | Supabase |

## Estructura de directorios

```
app/
  (public)/           — Route group: tienda pública (InfoBar + Header + Footer)
    page.tsx          — Inicio (/)
    catalogo/         — /catalogo
    categoria/[slug]/ — /categoria/:slug
    producto/[slug]/  — /producto/:slug
    nuestra-historia/ — /nuestra-historia
    preguntas-frecuentes/ — /preguntas-frecuentes
  admin/              — Dashboard administrativo (/admin/*)
    layout.tsx        — Sidebar + mobile header
    page.tsx          — Resumen
    productos/
    categorias/
    inventario/
    mercancia/
    pedidos/
    clientes/
    gastos/
    finanzas/
    configuracion/
  layout.tsx          — Root layout (HTML, body, fuente)
  globals.css         — Estilos globales + Tailwind v4 theme

lib/
  types.ts            — Tipos TypeScript compartidos
  utils.ts            — Helpers (cn, slugify, formatPrice, etc.)
  storage.ts          — Abstracción de localStorage (prefijo "luale_")
  mock/               — Datos de demostración
    products.ts
    categories.ts
    orders.ts
    customers.ts
    expenses.ts
    inventory.ts
    settings.ts
  repositories/       — Capa de acceso a datos (reemplazar por Supabase)
    productRepository.ts
    categoryRepository.ts
    orderRepository.ts
    customerRepository.ts
    expenseRepository.ts
    inventoryRepository.ts
    settingsRepository.ts

components/
  ui/                 — Componentes genéricos (Button, Badge, Modal, Input, etc.)
  layout/             — InfoBar, Header, Footer, AdminSidebar
  product/            — ProductCard, ProductGrid
  admin/              — AdminSidebar
```

## Flujo de datos (fase actual)

```
Component → Repository → storage.ts (localStorage) → mock data (seed)
```

Al primer uso, los repositories inyectan los datos de `lib/mock/` en localStorage.
Los datos persisten entre recargas. Se puede resetear llamando a `*.repository.reset()`.

## Flujo de datos (fase Supabase)

```
Component → Repository → Supabase client → PostgreSQL
```

Solo los repositories necesitan cambiar. Los componentes no tocan la persistencia.

## Separación de contextos

- **Tienda pública**: solo lee datos (productos, categorías). No escribe.
- **Dashboard admin**: lee y escribe. Actualmente sin autenticación (modo demo).
- **Repositorios**: abstraen el origen de datos. Un cambio en la implementación no afecta la UI.

## Convenciones

- IDs: generados con `generateId(prefix)` usando timestamp + random.
- Slugs: generados con `slugify()` (normaliza acentos, lowercase, guiones).
- Precios: siempre en USD, mostrados con `formatPrice()`.
- Fechas: almacenadas como ISO 8601, mostradas con `formatDate()` en español.
- Clases CSS: combinadas con `cn()` (similar a clsx).
- `'use client'`: solo en componentes que usan hooks o eventos del navegador.

## Paleta de colores (Tailwind v4)

| Token | Hex |
|-------|-----|
| `cream` | #FBF3E8 |
| `rose` | #E8B5B0 |
| `rose-dark` | #D4948E |
| `blue-pastel` | #8DB9D5 |
| `yellow-soft` | #F2C66D |
| `brown` | #624B3F |
| `brown-light` | #8B6F67 |
