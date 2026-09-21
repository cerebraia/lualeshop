# Arquitectura de Supabase — Luale Kids Shop

## Estructura de archivos

```
lib/
  supabase/
    client.ts          ← cliente de navegador (singleton, @supabase/ssr)
    server.ts          ← cliente de servidor (cookies via next/headers)
    middleware.ts      ← refresco de sesión para Next.js middleware
  data-provider.ts     ← abstracción mock|supabase
  repositories/
    *.ts               ← repositorios mock (síncronos, localStorage)
    supabase/
      mappers.ts       ← snake_case DB → camelCase TypeScript
      categoryRepository.ts
      productRepository.ts
      orderRepository.ts
      customerRepository.ts
      expenseRepository.ts
      inventoryRepository.ts
      settingsRepository.ts
      financeRepository.ts

middleware.ts           ← Next.js middleware (session refresh + route guard)
app/admin/login/page.tsx ← página de login (mock: demo | supabase: auth real)

supabase/
  config.toml          ← configuración Supabase CLI
  seed.sql             ← datos de desarrollo
  migrations/
    20240001..._extensions_and_types.sql
    20240002..._profiles_and_security_helpers.sql
    20240003..._catalog.sql
    20240004..._inventory.sql
    20240005..._orders_and_customers.sql
    20240006..._finance.sql
    20240007..._storage.sql
    20240008..._rls_policies.sql
    20240009..._transactional_functions.sql
    20240010..._seed_catalog.sql
```

## Flujo de datos

```
Browser Component
     │
     ├─ DATA_PROVIDER=mock  → lib/repositories/productRepository.ts (localStorage)
     │
     └─ DATA_PROVIDER=supabase → lib/repositories/supabase/productRepository.ts
                                    → lib/supabase/client.ts
                                    → Supabase PostgreSQL (via RLS)
```

## Clientes

| Cliente | Archivo | Uso | Credenciales |
|---------|---------|-----|--------------|
| Browser | `lib/supabase/client.ts` | Client Components | anon key |
| Server | `lib/supabase/server.ts` | Server Components, Actions | anon key + cookies |
| Middleware | `lib/supabase/middleware.ts` | Next.js middleware | anon key |

## RPC functions (PostgreSQL)

Todas usan `SECURITY DEFINER`, `search_path = public`, validación de rol:

| Función | Propósito |
|---------|-----------|
| `confirm_merchandise_entry(uuid)` | Confirma entrada de mercancía (idempotente) |
| `create_order_with_items(uuid, jsonb, text)` | Crea pedido + items con precios del servidor |
| `confirm_order(uuid)` | Deduce inventario, confirma pedido |
| `cancel_order(uuid, text)` | Cancela y restaura inventario si fue descontado |
| `register_order_payment(...)` | Registra pago, recalcula payment_status |
| `adjust_inventory(uuid, int, text)` | Ajuste manual de stock con motivo requerido |

## Decisiones de diseño

1. **Costo separado de precio**: `variant_costs` es una tabla privada. El catálogo público nunca expone costos.
2. **Snapshots en order_items**: Los pedidos conservan nombre, SKU, talla y costo en el momento de creación, independientemente de ediciones futuras.
3. **Movimientos de inventario inmutables**: Solo se insertan mediante RPC. No hay UPDATE ni DELETE en `inventory_movements`.
4. **order_number legible**: Secuencia PostgreSQL → `ORD-00001`, `ORD-00002`…
5. **Soft deletes**: Customers, expenses, y productos usan `archived_at` en lugar de DELETE para preservar referenciabilidad histórica.
