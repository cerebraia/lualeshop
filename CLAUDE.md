# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # Development server (may use port 3001/3002 if 3000 is occupied)
npm run build          # Production build — runs TypeScript check then Turbopack build
npm run lint           # ESLint
npm run test           # Run unit tests (vitest)
npm run test:watch     # Vitest in watch mode
npm run audit:catalog  # Programmatic catalog audit — exits 1 on failure
npm run start          # Serve the production build
```

Tests live in `tests/`. Catalog audit in `scripts/audit-catalog.ts`.

## Architecture

### Route structure

`app/page.tsx` does **not exist**. The homepage lives at `app/(public)/page.tsx`. The `(public)` route group applies `InfoBar + Header + Footer` to all public pages. Removing or adding a page outside this group means it won't get the public shell.

```
app/
  (public)/layout.tsx          ← InfoBar + Header + main + Footer
  (public)/page.tsx            ← / (homepage)
  (public)/catalogo/           ← /catalogo
  (public)/categoria/[slug]/   ← /categoria/:slug
  (public)/producto/[slug]/    ← /producto/:slug
  (public)/nuestra-historia/
  (public)/preguntas-frecuentes/
  admin/layout.tsx             ← Sidebar + mobile header, no auth
  admin/page.tsx               ← /admin (dashboard summary)
  admin/productos|categorias|inventario|mercancia|pedidos|clientes|gastos|finanzas|configuracion/
  layout.tsx                   ← Root: html, body, Nunito font
  globals.css                  ← Tailwind v4 @theme tokens + base styles
```

### Data layer

All persistence goes through `lib/repositories/`. Components never touch `localStorage` directly.

**Seeding pattern** — every repository calls an internal `seed()` on first read:
```
seed() → storageGet(KEY, null) → null? → write mockData → return mockData
         → found? → return stored data
```

All localStorage keys are prefixed `luale_` (via `lib/storage.ts`). The public store reads mock data directly (not via repositories) since those pages are client components that don't persist anything.

**To replace with Supabase**: swap each `lib/repositories/*.ts` implementation. The component API stays identical.

### Tailwind CSS v4

No `tailwind.config.js`. Tokens are declared in `app/globals.css` under `@theme inline`. Use these custom tokens in className:

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | #FBF3E8 | Page background |
| `rose` | #E8B5B0 | Primary accent / buttons |
| `rose-dark` | #D4948E | Hover state for rose |
| `blue-pastel` | #8DB9D5 | Secondary accent |
| `yellow-soft` | #F2C66D | Highlights |
| `brown` | #624B3F | All body text |
| `brown-light` | #8B6F67 | Muted text / icons |

### Key conventions

- `'use client'` only on components that use hooks or browser events. Server components import client components freely.
- IDs: `generateId(prefix)` — timestamp + random (see `lib/utils.ts`).
- Slugs: `slugify()` — normalises accents, lowercase, hyphens.
- Prices: always USD numbers, displayed via `formatPrice()`.
- Dates: ISO 8601 stored, `formatDate()` renders in `es-VE` locale.
- CSS classes: composed with `cn()` (`lib/utils.ts`).
- `params` in dynamic routes is a `Promise` — must be `await`ed in Server Components. In Client Components use `useParams<{ slug: string }>()` instead.

### ESLint overrides

Two rules are disabled in `eslint.config.mjs`:
- `react-hooks/set-state-in-effect` — turned off because `useEffect(load, [])` is the intentional mount pattern for hydrating from localStorage.
- `@typescript-eslint/no-unused-vars` — warnings only; variables prefixed `_` are ignored.

### lucide-react v1.47

`Instagram` does **not exist** in this version. Use `ExternalLink` for Instagram links. Always verify icon names exist before importing.

### WhatsApp integration

All "order via WhatsApp" flows build a link with `buildWhatsAppLink(phone, message)` from `lib/utils.ts`. The number is `584220162748` (no `+`, no spaces). The link opens `https://wa.me/584220162748?text=...` with a URL-encoded message. Clicking the button must never register a sale — only manually created orders in `/admin/pedidos` count as revenue.

### Admin dashboard (demo mode)

`/admin` has no authentication. A visible banner marks it as demo. All CRUD writes go to localStorage via the repositories. Financial summaries only count orders with `paymentStatus === 'paid'`.

### Product catalog (46 products)

All products live in `lib/mock/products.ts`. Key fields:
- `inventoryConfigured: false` on all — show "Consultar disponibilidad", not stock numbers.
- `purchaseOptions` with **2+ entries** → show selector + "Desde $X" on card. Exactly 5 products (LK-003, LK-005, LK-014, LK-015, LK-016).
- Single-option products do NOT have a `purchaseOptions` array; they use `price` directly.
- `sizeNote` present only on LK-020 (talla "9-13 meses" pending confirmation).
- `catalogNumber` (1–46) is a stable reference to the original catalog; different from the numeric part of `sku`.
- `Image` icon from lucide-react v1.47 exists but triggers `jsx-a11y/alt-text` — import as `ImageIcon` instead.

### localStorage migration

`components/MigrationRunner.tsx` runs on mount in both `(public)` and `admin` layouts. It calls `lib/migrations.ts` which bumps the schema to version `"2"` and merges new catalog products without overwriting user edits. The version key is `luale_schema_version` (no `luale_` prefix).
