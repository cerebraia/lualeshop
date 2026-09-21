# Checklist post-lanzamiento

A ejecutar en los primeros 7 días tras activar indexación.

## Inmediato (día 0)

- [ ] `https://lualekids.shop` responde con HTTP 200
- [ ] robots.txt muestra `Allow: /` (no noindex)
- [ ] Sitemap accesible: `https://lualekids.shop/sitemap.xml`
- [ ] Canonical correcto en `<head>` de la home
- [ ] Open Graph images cargan (compartir en WhatsApp/Instagram)
- [ ] WhatsApp abre con el mensaje correcto desde producto y home
- [ ] Login admin funciona con credenciales reales
- [ ] Dashboard muestra datos reales (no demo)
- [ ] Logs de Railway sin errores 5xx repetitivos
- [ ] Logs de Supabase sin errores de RLS o conexión

## Día 1

- [ ] Registrar sitemap en Google Search Console (si se tiene acceso)
- [ ] Probar sitemap en Search Console → "Inspeccionar URL" para la home
- [ ] Verificar que no aparece ninguna URL de Railway (*.railway.app) indexada
- [ ] Confirmar que `/admin` no aparece en sitemap ni en robots Allow
- [ ] Revisar core web vitals en Search Console (primeros datos en ~28 días)

## Semana 1

- [ ] Revisar errores de crawl en Search Console
- [ ] Verificar que las 46 URLs de productos son rastreables
- [ ] Confirmar que las imágenes de productos cargan en producción
- [ ] Ejecutar Lighthouse sobre los primeros productos más visitados
- [ ] Monitorear tiempo de respuesta en Railway
- [ ] Verificar que los pedidos nuevos aparecen en el dashboard en tiempo real

## Primera operación real

Referirse a `docs/first-real-sale.md` para el checklist completo.

## Si algo falla

1. Consultar `docs/recovery-runbook.md`
2. Desactivar indexación si hay un problema crítico:
   - Railway → Variables → `NEXT_PUBLIC_ALLOW_INDEXING=false` → Redeploy
3. Rollback de código: Railway Dashboard → Deployments → deploy anterior → Redeploy
4. Registrar el incidente en `docs/` para referencia futura

## Métricas a monitorear

- Errores 5xx en Railway logs
- Errores de auth en Supabase logs
- Tiempo de respuesta de la home (objetivo: < 2s en LTE)
- Imágenes que no cargan (404 en Storage)
- Intentos fallidos de login
