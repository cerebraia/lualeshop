# Esquema de base de datos — Luale Kids Shop

## Enumerados

| Tipo | Valores |
|------|---------|
| `user_role` | `owner`, `admin` |
| `product_status` | `draft`, `active`, `archived` |
| `manual_availability` | `automatic`, `available`, `low_stock`, `out_of_stock`, `coming_soon`, `consult` |
| `order_status` | `new`, `confirmed`, `prepared`, `shipped`, `delivered`, `cancelled` |
| `payment_status` | `pending`, `partial`, `paid`, `refunded` |
| `payment_method` | `cash`, `transfer`, `mobile_payment`, `other` |
| `movement_type` | `merchandise_entry`, `sale`, `return`, `adjustment_in`, `adjustment_out`, `cancellation_restore` |
| `entry_status` | `draft`, `confirmed`, `cancelled` |

## Diagrama de tablas (simplificado)

```
auth.users (Supabase)
  └─ profiles [role, active]

categories
  └─ product_categories ─── products
                               ├─ product_images
                               ├─ product_purchase_options
                               └─ product_variants
                                    ├─ inventory_levels
                                    ├─ inventory_movements
                                    └─ variant_costs (privado)

suppliers
  └─ merchandise_entries
       └─ merchandise_entry_items ──── product_variants

customers
  └─ orders
       ├─ order_items ──── products, product_variants
       └─ order_payments

expense_categories
  └─ expenses

store_settings (fila única)
activity_log (append-only)
```

## Diferencias clave respecto al modelo TypeScript actual

| Concepto | TypeScript actual | PostgreSQL |
|----------|------------------|------------|
| `Product.cost` | Campo en Product | `variant_costs` (privado, separado) |
| `Product.status` | `InventoryStatus` | Split en `product_status` + `manual_availability` |
| `Customer.orderIds` | Array en Customer | Derivado de `orders.customer_id` |
| `Order.paymentMethod` | Campo en Order | `order_payments.payment_method` |
| `MerchandiseEntry.supplier` | String libre | FK a tabla `suppliers` |
| `InventoryMovement.type` | `entry|exit|adjustment` | 6 tipos granulares |
| `Expense.category` | Enum string | FK a `expense_categories` |
| Pagos | Ninguno | `order_payments` separado |
| Auditoría | Ninguna | `activity_log` |
| Totales | Calculados en front | Calculados en RPC del servidor |

## Convenciones

- IDs: UUID v4 (`gen_random_uuid()`)
- Timestamps: `timestamptz` en UTC
- Decimales: `numeric(12,2)` para precios y costos
- Soft deletes: `archived_at timestamptz` (en lugar de DELETE)
- Snapshots: `*_snapshot` en `order_items` para preservar historia
- `updated_at`: actualizado automáticamente por trigger `touch_updated_at()`
