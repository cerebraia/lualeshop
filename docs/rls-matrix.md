# Matriz de RLS — Luale Kids Shop

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Permitido |
| ❌ | Denegado (RLS bloquea) |
| 🔒 | Solo vía RPC SECURITY DEFINER |
| ⚠️ | Parcial (solo campos seguros) |

## Tabla de acceso

| Tabla | anon SELECT | admin SELECT | admin INSERT | admin UPDATE | admin DELETE | Notas |
|-------|-------------|--------------|--------------|--------------|--------------|-------|
| `categories` | ✅ activas | ✅ todas | ✅ | ✅ | ✅ | |
| `products` | ✅ status=active | ✅ todas | ✅ | ✅ | ❌ (soft delete) | |
| `product_categories` | ⚠️ activos | ✅ | ✅ | ✅ | ✅ | |
| `product_images` | ⚠️ activos | ✅ | ✅ | ✅ | ✅ | |
| `product_purchase_options` | ✅ activas | ✅ | ✅ | ✅ | ✅ | |
| `product_variants` | ✅ activas | ✅ | ✅ | ✅ | ✅ | Sin costo |
| `inventory_levels` | ❌ | ✅ | 🔒 RPC | 🔒 RPC | ❌ | Solo vía RPC |
| `inventory_movements` | ❌ | ✅ | 🔒 RPC | ❌ | ❌ | Append-only |
| `variant_costs` | ❌ | ✅ | 🔒 RPC | 🔒 RPC | ❌ | Privado |
| `suppliers` | ❌ | ✅ | ✅ | ✅ | ✅ | |
| `merchandise_entries` | ❌ | ✅ | ✅ | ✅ | ❌ | Confirmar via RPC |
| `merchandise_entry_items` | ❌ | ✅ | ✅ | ✅ | ✅ | |
| `customers` | ❌ | ✅ | ✅ | ✅ | ❌ (archived_at) | |
| `orders` | ❌ | ✅ | ✅ | ✅ | 🔒 RPC cancel | |
| `order_items` | ❌ | ✅ | ✅ | ❌ | ❌ | Snapshots inmutables |
| `order_payments` | ❌ | ✅ | 🔒 RPC | ❌ | ❌ | Solo via RPC |
| `expenses` | ❌ | ✅ | ✅ | ✅ | ❌ (archived_at) | |
| `expense_categories` | ✅ activas | ✅ | ✅ | ✅ | ✅ | |
| `store_settings` | ✅ | ✅ | ❌ | 🔐 owner | ❌ | |
| `profiles` | ❌ (own) | ✅ (own) | ❌ | ⚠️ sin cambiar rol | 🔐 owner | |
| `activity_log` | ❌ | ✅ | 🔒 RPC | ❌ | ❌ | Append-only |

## Pruebas de seguridad recomendadas

```sql
-- Como anon: debe retornar solo datos del catálogo activo
SET ROLE anon;
SELECT count(*) FROM products WHERE status = 'draft';  -- debe ser 0
SELECT * FROM customers LIMIT 1;                        -- debe retornar 0 filas
SELECT * FROM variant_costs LIMIT 1;                   -- debe retornar 0 filas
SELECT * FROM inventory_movements LIMIT 1;             -- debe retornar 0 filas
RESET ROLE;

-- Entrada confirmada dos veces no duplica stock:
SELECT confirm_merchandise_entry('<entry-id>');  -- OK
SELECT confirm_merchandise_entry('<entry-id>');  -- ERROR: "Entry already confirmed"
```
