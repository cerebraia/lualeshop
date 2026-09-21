# Sistema de migraciones — localStorage

## Cómo funciona

El sistema usa una clave `luale_schema_version` en localStorage (sin el prefijo `luale_`, guardada directamente) para rastrear la versión del esquema de datos.

El componente `components/MigrationRunner.tsx` se monta en ambos layouts (`(public)` y `admin`) y llama a `runMigrations()` de `lib/migrations.ts` al primer render en el cliente.

## Versiones

| Versión | Cambios |
|---------|---------|
| 1       | Esquema inicial (12 productos placeholder) |
| 2       | 46 productos reales, `inventoryConfigured`, `purchaseOptions`, `catalogNumber`, `sizeNote` |

## Comportamiento de la migración v2

Al detectar que la versión almacenada es `null` o `"1"`:

1. Si no hay datos en localStorage (`luale_products` es null): semilla con todos los productos del mock.
2. Si hay datos:
   - Se conservan productos con IDs que no empiezan por `prod-` (creados por el admin).
   - Para cada producto del mock: si ya existe en localStorage (mismo ID), se conserva la versión del usuario; si no existe, se inserta el nuevo producto del mock.
   - Resultado: el catálogo se amplía sin sobrescribir ediciones del usuario.

La migración es idempotente: ejecutarla múltiples veces produce el mismo resultado.

## Cómo escribir una migración nueva

1. Incrementar `TARGET_VERSION` en `lib/migrations.ts`.
2. Agregar un `else if (current === '2')` en `runMigrations()`.
3. Implementar la función `migrateToV3()`.

```typescript
export function runMigrations(): void {
  if (typeof window === 'undefined') return;
  const current = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (current === TARGET_VERSION) return;

  if (!current || current === '1') migrateToV2();
  if (current === '2') migrateToV3(); // nueva migración

  localStorage.setItem(SCHEMA_VERSION_KEY, TARGET_VERSION);
}
```

## Cómo resetear

Para volver al estado inicial (útil en desarrollo):

```javascript
// En la consola del navegador:
Object.keys(localStorage)
  .filter(k => k.startsWith('luale_'))
  .forEach(k => localStorage.removeItem(k));
localStorage.removeItem('luale_schema_version');
location.reload();
```

O usar el botón "Restaurar catálogo original" en `/admin/configuracion`.

## Claves en localStorage

Todas con prefijo `luale_` excepto la versión:

| Clave | Contenido |
|-------|-----------|
| `luale_schema_version` | `"2"` (sin prefijo) |
| `luale_products` | `Product[]` |
| `luale_categories` | `Category[]` |
| `luale_orders` | `Order[]` |
| `luale_customers` | `Customer[]` |
| `luale_expenses` | `Expense[]` |
| `luale_inventory_movements` | `InventoryMovement[]` |
| `luale_merchandise_entries` | `MerchandiseEntry[]` |
| `luale_settings` | `StoreSettings` |
| `luale_whatsapp_intents` | `WhatsAppIntent[]` |
