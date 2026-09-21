# Conectar Supabase Remoto — Guía

> Este documento describe el proceso FUTURO de conexión.
> No ejecutar hasta tener las credenciales del proyecto remoto.

## 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project.
2. Nombre: `luale-kids-shop`
3. Region: más cercana a Venezuela (ej: `us-east-1`)
4. Anotar: **Project URL** y **Anon Key** (Settings → API).

## 2. Configurar variables de entorno locales

```bash
# .env.local
NEXT_PUBLIC_DATA_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_AQUI
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_AQUI  # solo para scripts, nunca al navegador
```

## 3. Instalar Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
```

## 4. Vincular el proyecto remoto

```bash
supabase link --project-ref <project-ref>
```

## 5. Ejecutar migraciones

```bash
supabase db push
# O ejecutar cada archivo en orden desde el dashboard SQL Editor:
# 0001 → 0002 → 0003 → ... → 0010
```

## 6. Desactivar registro público

En el dashboard: **Authentication → Settings → Enable sign ups = OFF**.
Verificar que `supabase/config.toml` tiene `enable_signup = false`.

## 7. Crear el primer owner

```sql
-- 1. Crear usuario desde Dashboard: Authentication → Users → Invite user
--    Email: admin@lualekids.shop, contraseña segura

-- 2. Obtener el UUID del usuario creado y promover a owner:
UPDATE profiles
SET role = 'owner'
WHERE id = '<uuid-del-usuario>';
```

## 8. Verificar RLS

```sql
-- Probar como anon: solo catálogo activo debe ser visible
SET ROLE anon;
SELECT * FROM products;          -- debe retornar solo status='active'
SELECT * FROM customers;         -- debe retornar vacío (RLS)
SELECT * FROM orders;            -- debe retornar vacío (RLS)
SELECT * FROM variant_costs;     -- debe retornar vacío (RLS)
RESET ROLE;
```

## 9. Migrar imágenes a Storage

```bash
# Para cada imagen en public/images/products/:
supabase storage cp public/images/products/luale-001-*.webp \
  ss:///product-images/<product_id>/luale-001-chaqueta-denim-con-parches.webp

# Luego actualizar product_images.storage_path a la URL pública de Supabase
```

## 10. Generar tipos TypeScript

```bash
supabase gen types typescript --project-id <project-ref> \
  --schema public > lib/supabase/database.types.ts
```

## Checklist antes de ir a producción

- [ ] Migraciones ejecutadas en DB remota
- [ ] Seed ejecutado (o datos cargados desde admin)
- [ ] Primer owner creado y verificado
- [ ] Registro público desactivado
- [ ] RLS verificada con pruebas manuales
- [ ] Variables de entorno en Railway/Vercel
- [ ] `NEXT_PUBLIC_DATA_PROVIDER=supabase` en producción
- [ ] Imágenes migradas a Storage (o sirviendo desde /public como fallback)
- [ ] Tipos TypeScript generados desde DB real
