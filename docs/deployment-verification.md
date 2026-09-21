# Verificación del deploy

Este documento describe el procedimiento de verificación después de cada deploy.

## Pre-deploy checklist

- [ ] `npm run lint` — 0 errores
- [ ] `npx tsc --noEmit` — 0 errores
- [ ] `npm run build` — build exitoso
- [ ] `npm run test` — todos los tests pasan
- [ ] `npm run audit:catalog` — 46 productos
- [ ] `npx tsx scripts/audit-images.ts` — 0 problemas
- [ ] No hay secretos en el diff
- [ ] `.env.local` no está en el commit
- [ ] `artifacts/` no está en el commit
- [ ] `.claude/` no está en el commit

## Variables de entorno requeridas en Railway

| Variable | Valor | Notas |
|---------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Panel Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Panel Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Solo servidor. NO prefijo NEXT_PUBLIC_ |
| `NEXT_PUBLIC_DATA_PROVIDER` | `supabase` | Producción siempre Supabase |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `false` → `true` solo en GO | Controla robots.txt |
| `NEXT_PUBLIC_SITE_URL` | `https://lualekids.shop` | |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `584220162748` | Sin + ni espacios |

## Verificación post-deploy

### 1. Health check
```
curl -I https://lualekids.shop/
# Esperar: HTTP 200
```

### 2. Robots.txt
```
curl https://lualekids.shop/robots.txt
# Con indexing OFF: User-agent: * / Disallow: /
# Con indexing ON:  User-agent: * / Allow: / / Disallow: /admin
```

### 3. Sitemap
```
curl https://lualekids.shop/sitemap.xml
# Debe incluir URLs de productos y categorías
```

### 4. HTTPS y redirect www
```
curl -I http://www.lualekids.shop/
# Esperar: 308 → https://lualekids.shop/
```

### 5. Catálogo
- Abrir https://lualekids.shop/catalogo
- Verificar que se ven productos y sus imágenes
- Verificar que los filtros funcionan

### 6. Producto
- Abrir cualquier producto (/producto/[slug])
- Verificar imagen, precio, botón WhatsApp
- Verificar que WhatsApp abre con el número correcto

### 7. Login admin
- Abrir https://lualekids.shop/admin
- Con DATA_PROVIDER=supabase: debe redirigir a /admin/login
- Con credenciales válidas: debe entrar al dashboard

### 8. Sin datos expuestos
- Abrir https://lualekids.shop/api/products/cualquier-id/images (GET sin auth)
- Esperar: 401 o 405 (no 200 con datos)
- No debe aparecer ningún secreto en el source HTML de la tienda pública

## Deploy en Railway

1. Verificar que el branch `main` tiene el último commit
2. Railway auto-despliega al hacer push a `main`
3. Esperar a que el build termine (ver Railway Dashboard → Deployments)
4. Verificar que el health check pase
5. Revisar los logs de build para errores

## Rollback

Si el deploy falla:
1. Railway Dashboard → Deployments → seleccionar el deploy anterior → Redeploy
2. Si el problema es de base de datos: no hacer rollback de datos, solo del código
3. Desactivar indexación si fue habilitada en este deploy
