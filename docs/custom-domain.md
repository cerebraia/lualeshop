# Dominio personalizado — lualekids.shop

## Dominio canónico

`https://lualekids.shop`

`www.lualekids.shop` redirige permanentemente (308) a `lualekids.shop`.

## Proceso de conexión en Railway

1. Railway Dashboard → Project → Service → Settings → **Domains**
2. Click **Add Custom Domain**
3. Ingresar `lualekids.shop` → Railway entrega el registro DNS requerido
4. Ingresar `www.lualekids.shop` → Railway entrega un segundo registro
5. Configurar ambos en el proveedor DNS (ver `docs/dns-records.md`)
6. Esperar a que Railway muestre el certificado como válido (generalmente 5-30 min)
7. Verificar HTTPS desde el navegador

## Variables de entorno requeridas (Railway)

```
NEXT_PUBLIC_SITE_URL=https://lualekids.shop
NEXT_PUBLIC_DATA_PROVIDER=supabase
NEXT_PUBLIC_ALLOW_INDEXING=false   # cambiar a true solo tras auditoría
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## La redirección www → no-www

Configurada en `next.config.ts` via `redirects()`. Railway no necesita configuración adicional.

## Verificar que no haya bucles

```bash
curl -L -v https://www.lualekids.shop/catalogo 2>&1 | grep -E "Location|HTTP/"
```
Debe hacer exactamente una redirección: `www` → `lualekids.shop`.

## URL temporal de Railway

No eliminar hasta confirmar que `lualekids.shop` funciona desde múltiples dispositivos y navegadores.

## Checklist previo al lanzamiento

- [ ] DNS propagado (dig resuelve)
- [ ] HTTPS válido (certificado Railway emitido)
- [ ] www redirige a non-www
- [ ] http redirige a https
- [ ] Home carga correctamente
- [ ] Imágenes visibles
- [ ] WhatsApp links usan lualekids.shop
- [ ] Login funciona
- [ ] Dashboard funciona
- [ ] NEXT_PUBLIC_ALLOW_INDEXING=false confirmado
