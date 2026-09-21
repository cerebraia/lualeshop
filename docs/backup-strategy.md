# Estrategia de respaldo

## Plan actual de Supabase

El plan gratuito (Free Tier) de Supabase incluye:
- **Backups diarios automáticos** con retención de **7 días** (solo en planes Pro y superiores)
- El plan Free **NO incluye backups automáticos con descarga directa**
- Puedes exportar la base de datos manualmente desde el dashboard

Verificar el plan activo: Supabase Dashboard → Settings → Billing

## Qué no está cubierto en el plan Free

- Retención de backups mayor a 7 días
- Point-in-time recovery (PITR)
- Exportación automática programada
- Backup de Storage (imágenes de comprobantes) — requiere proceso manual

## Exportar esquema

```bash
supabase db dump --project-ref TU_PROJECT_REF > backups/schema_$(date +%Y%m%d).sql
```

Requiere Supabase CLI autenticado (`supabase login`).

## Exportar datos operativos

Los siguientes scripts deben ejecutarse **server-side o en CLI**. Nunca desde el navegador.

### Exportar catálogo

```bash
npx tsx scripts/export-catalog.ts > backups/catalog_$(date +%Y%m%d).json
```

### Exportar pedidos

```bash
npx tsx scripts/export-orders.ts > backups/orders_$(date +%Y%m%d).json
```

### Exportar inventario

```bash
npx tsx scripts/export-inventory.ts > backups/inventory_$(date +%Y%m%d).json
```

## Exportar Storage (comprobantes de gastos)

```bash
supabase storage ls expense-receipts/ --project-ref TU_PROJECT_REF
# Descargar cada archivo individualmente o usar la API de Supabase Storage
```

No existe una herramienta de exportación masiva de Storage en el CLI actual.
Considera scripts personalizados con el SDK de Supabase.

## Restaurar

Para restaurar desde un dump SQL:

```bash
psql postgresql://postgres:TU_PASSWORD@db.TU_PROJECT_REF.supabase.co:5432/postgres < backup.sql
```

Para restaurar desde el dashboard de Supabase (si tienes un backup guardado):
Settings → Database → Backups → Restore

## Validar una restauración

Después de restaurar:
1. Verificar conteo de productos: `SELECT count(*) FROM products`
2. Verificar conteo de pedidos: `SELECT count(*) FROM orders`
3. Verificar RLS activo: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'`
4. Probar el login del owner
5. Verificar que las imágenes de productos cargan

## Recomendaciones

- Realizar backup manual antes de cada migración de base de datos
- Guardar los backups fuera del repositorio (no en `public/`, no en `git`)
- Guardar en un bucket de almacenamiento externo (Google Drive, S3, etc.)
- Incluir timestamp en el nombre del archivo
- Para datos de clientes: no imprimir en logs, cifrar si se comparten fuera del servidor

## Qué no hace este sistema automáticamente

- No hay cron de backup configurado actualmente
- No hay cifrado automático de exportaciones
- No hay validación automática de restauración

Estas son tareas manuales hasta que se configure un plan de backup más robusto.
