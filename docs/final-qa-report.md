# Luale Kids Shop — Reporte de Auditoría Final

**Fecha:** 2026-10-02  
**Commit auditado:** `aff634b`  
**Proveedor:** Supabase (`NEXT_PUBLIC_DATA_PROVIDER=supabase`)  
**Migraciones aplicadas:** 19/19 ✓  

---

## Matriz CRUD por módulo

| Módulo | Crear | Leer | Editar | Archivar/eliminar | Persiste | RLS | Producción |
|--------|-------|------|--------|-------------------|----------|-----|------------|
| Productos | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Categorías | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Imágenes | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Inventario (ajuste) | PASS | PASS | N/A | N/A | PASS | PASS | PASS |
| Mercancía (entrada) | PASS | PASS | N/A | N/A | PASS | PASS | PASS |
| Clientes | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Pedidos | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Pagos (order_payments) | PASS | PASS | N/A | PASS (void) | PASS | PASS | PASS |
| Gastos | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Proveedores | N/A* | PASS | N/A | N/A | N/A | PASS | N/A |
| Cuentas por cobrar | PASS | PASS | N/A | N/A | PASS | PASS | PASS |
| Cuentas por pagar | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Configuración | PASS | PASS | PASS | N/A | PASS | PASS | PASS |
| WhatsApp intents | localStorage | localStorage | N/A | N/A | Sesión | N/A | N/A |

*Proveedores: no existe página admin dedicada; campo de texto libre en mercancía.

---

## Causas encontradas y corregidas

### Bug 1 — Todas las operaciones CREATE fallaban silenciosamente (commit `aff634b`)
**Causa:** `generateId()` generaba strings como `cust-1727834567890-abc123`. Todas las tablas usan `uuid PRIMARY KEY`. PostgreSQL rechazaba con `22P02` (invalid input syntax for uuid). Los `catch {}` sin variable atrapaban la excepción silenciosamente.

**Fix:** `lib/utils.ts` — `generateId()` ahora usa `crypto.randomUUID()`. Todos los `catch {}` reemplazados con `catch (e: unknown) {}` que expone el mensaje real.

**Archivos corregidos:**
- `lib/utils.ts`
- `app/admin/clientes/page.tsx`
- `app/admin/gastos/page.tsx`
- `app/admin/pedidos/page.tsx`
- `app/admin/mercancia/page.tsx`
- `app/admin/inventario/page.tsx`
- `app/admin/categorias/page.tsx`
- `lib/repositories/supabase/inventoryRepository.ts`
- `lib/repos.ts`

### Bug 2 — Precios no se persistían en Supabase (commit `468a311`)
**Causa:** `supabaseProductRepository.update()` nunca escribía a `product_purchase_options`. El precio vive en esa tabla, no en `products`.

**Fix:** `syncPurchaseOptions()` en productRepository.ts sincroniza opciones al hacer update/create.

### Bug 3 — Estado de disponibilidad no se persistía (commit `468a311`)
**Causa:** `update()` nunca escribía `manual_availability`. `mapAvailability('consult')` devolvía `'available'`.

**Fix:** `toManualAvailability()` helper; `mapAvailability` corregido para devolver `'consult'`.

### Bug 4 — catch blocks ocultos en configuración, finanzas, deudas (este commit)
**Causa:** `} catch {` sin variable + mensajes genéricos en configuracion/page.tsx, finanzas/page.tsx, deudas/page.tsx.

**Fix:** Aplicado el mismo patrón `catch (e: unknown)` con `e.message`.

---

## Rutas públicas verificadas en producción

| Ruta | HTTP | Estado |
|------|------|--------|
| `/` | 200 | ✓ |
| `/catalogo` | 200 | ✓ |
| `/categoria/bebes` | 200 | ✓ |
| `/categoria/ninas` | 200 | ✓ |
| `/categoria/ninos` | 200 | ✓ |
| `/categoria/juguetes` | 200 | ✓ |
| `/producto/chaqueta-denim-con-parches` | 200 | ✓ |
| `/nuestra-historia` | 200 | ✓ |
| `/preguntas-frecuentes` | 200 | ✓ |
| `/categoria/inexistente` | 404 | ✓ (notFound()) |
| `/admin` | 307→login | ✓ |
| `/admin/clientes` | 307→login | ✓ |
| `/admin/gastos` | 307→login | ✓ |

---

## Evidencia de persistencia (QA-LUALE-*)

Todos los tests ejecutados directamente contra la API de Supabase con JWT del owner:

1. **Customer** `QA-LUALE-Auditoría Final` → creado → leído → editado → eliminado ✓
2. **Expense** `QA-LUALE-Auditoría Final` €12.50 → creado → leído → editado a €15.75 → eliminado ✓
3. **Receivable** `QA-LUALE-Deudor` €50.00 (RPC) → creado → eliminado ✓
4. **Payable** `QA-LUALE-Proveedor` €30.00 → creado → eliminado ✓
5. **0 registros QA** quedan en producción ✓

---

## Evidencia de seguridad (RLS)

| Test | Resultado |
|------|-----------|
| Anon INSERT customers | `42501` RLS violation ✓ |
| Anon READ customers | `[]` (0 registros) ✓ |
| Anon INSERT expenses | `42501` RLS violation ✓ |
| Anon READ expenses | `[]` (0 registros) ✓ |
| Anon INSERT payables | `42501` RLS violation ✓ |
| `is_active_admin()` con JWT owner | `true` ✓ |
| `is_active_admin()` sin JWT | `false` ✓ |

---

## Fuentes canónicas de datos

| Dato | Fuente canónica |
|------|----------------|
| Precio de producto | `product_purchase_options.price` (mínimo si múltiples) |
| Disponibilidad | `products.manual_availability` (enum PostgreSQL) |
| Imágenes | `product_images` + Storage bucket `product-images` |
| Inventario | `inventory_levels.quantity_on_hand` (gestionado por RPC `adjust_inventory`) |
| Portada del producto | `product_images WHERE is_primary = true` |

---

## Fórmula de disponibilidad

```
manual_availability = 'consult'      → "Consultar disponibilidad"
manual_availability = 'available'    → "Disponible"  
manual_availability = 'low_stock'    → badge "Últimas unidades"
manual_availability = 'out_of_stock' → badge "Agotado" + CTA de reposición
manual_availability = 'coming_soon'  → badge "Próximamente"
```

---

## Resultado de validaciones

```
✓ npm run typecheck  — 0 errores
✓ npm run lint       — 0 errores (1 warning preexistente: PRODUCT_SELECT_INNER)
✓ npm test           — 134/134 passed
✓ npm run build      — 23 páginas, 0 errores
```

---

## Pendientes y limitaciones reales

1. **WhatsApp intents** — `intentRepository` usa `localStorage` (best-effort en ficha pública). No es dato administrativo crítico. Para persistirlo en Supabase requiere migración con RLS público-write limitado.
2. **Proveedores** — no existe página admin dedicada. Solo campo de texto libre en mercancía.
3. **Editor de gastos en UI** — la edición de un gasto existente no está implementada en la interfaz (solo se puede crear y archivar). La API/repositorio sí soporta UPDATE.
4. **`PRODUCT_SELECT_INNER`** — variable no utilizada en `lib/data/catalog.ts:24`. Limpieza menor pendiente.
5. **Configuración → `secondaryTagline`** — el mapper lo mapea igual que `tagline` (solo hay una columna en DB). Sin impacto funcional.
