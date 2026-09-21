# Migración desde localStorage a Supabase

## Estado actual

La aplicación usa localStorage para toda la persistencia:
- `luale_products` → productos (46)
- `luale_categories` → categorías (3)
- `luale_orders` → pedidos
- `luale_customers` → clientes
- `luale_expenses` → gastos
- `luale_settings` → configuración
- `luale_schema_version` → versión de migración (actualmente "3")
- `luale_inventory_movements` → movimientos
- `luale_merchandise_entries` → entradas de mercancía

## Ruta de migración

### Fase 1 (actual): Arquitectura preparada
- Supabase SQL listo.
- Repositorios Supabase implementados pero no conectados a las páginas.
- App funciona 100% en modo mock.

### Fase 2 (próxima): Conexión del proyecto remoto
Ver `docs/remote-supabase-setup.md`.

### Fase 3: Migración de datos existentes

Si hay datos reales en localStorage del usuario:

```ts
// Ejemplo: migrar pedidos de localStorage a Supabase
const stored = JSON.parse(localStorage.getItem('luale_orders') ?? '[]');
for (const order of stored) {
  await supabase.from('orders').upsert(mapOrderToDb(order), {
    onConflict: 'id',
    ignoreDuplicates: true,
  });
}
```

Considerar:
- Migrar solo datos reales (no los datos mock de demostración).
- Verificar que los IDs no colisionen con los del seed.
- Los `prod-XXX` IDs del mock coinciden con los del seed SQL — esto es intencional.

### Fase 4: Migrar páginas admin a async

Cada página admin actualmente usa repos síncronos en `useEffect`.
Para Supabase, cambiar a repos async:

```ts
// Antes (mock):
setOrders(orderRepository.findAll());

// Después (supabase):
setLoading(true);
supabaseOrderRepository.findAll()
  .then(setOrders)
  .catch(handleError)
  .finally(() => setLoading(false));
```

### Fase 5: Conectar repositorios via data-provider

```ts
// lib/repositories/index.ts (fase futura)
import { getDataProvider } from '@/lib/data-provider';
import { categoryRepository } from './categoryRepository';
import { supabaseCategoryRepository } from './supabase/categoryRepository';

export function getCategoryRepo() {
  return getDataProvider() === 'supabase'
    ? supabaseCategoryRepository
    : categoryRepository;
}
```

## Lo que no migrar

- Datos mock de demostración (mockOrders, mockCustomers, etc.)
- Datos de prueba generados automáticamente
- WhatsApp intents (no hay tabla Supabase aún — ver nota en RLS)

## Rollback a mock

En cualquier momento: `NEXT_PUBLIC_DATA_PROVIDER=mock` → app vuelve a localStorage sin cambios.
