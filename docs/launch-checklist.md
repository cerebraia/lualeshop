# Checklist de lanzamiento — Luale Kids Shop

## PRE-LANZAMIENTO (completar antes de activar indexación)

### Infraestructura
- [ ] Railway desplegado correctamente
- [ ] Health check operativo
- [ ] Dominio `lualekids.shop` resolviendo
- [ ] Dominio `www.lualekids.shop` redirige a `lualekids.shop`
- [ ] HTTP redirige a HTTPS en ambos dominios
- [ ] Certificado HTTPS válido (Railway emitido)
- [ ] URL temporal Railway aún accesible

### Supabase
- [ ] Proyecto remoto conectado (DATA_PROVIDER=supabase)
- [ ] Migraciones ejecutadas (supabase db push)
- [ ] 46 productos en base de datos
- [ ] RLS verificada (anon no ve datos privados)
- [ ] Site URL actualizada en Supabase Auth
- [ ] Redirect URLs configuradas
- [ ] Registro público desactivado
- [ ] Owner creado y login verificado

### Contenido
- [ ] 46 productos visibles con imágenes reales
- [ ] Precios correctos en todos los productos
- [ ] WhatsApp links apuntan a lualekids.shop
- [ ] Número de WhatsApp correcto (584220162748)

### SEO técnico
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=false` confirmado en Railway
- [ ] `/robots.txt` retorna `Disallow: /`
- [ ] `<meta name="robots" content="noindex...">` en todas las páginas
- [ ] `/sitemap.xml` accesible (no bloqueado)
- [ ] Canonical correcto en todas las páginas
- [ ] Open Graph image visible en share preview
- [ ] Favicon visible en el navegador
- [ ] Structured data válido (validar en https://validator.schema.org)

### Seguridad
- [ ] Security headers presentes (`curl -I https://lualekids.shop`)
- [ ] Admin protegido (redirect a /admin/login sin sesión)
- [ ] Ningún secreto en código o Git
- [ ] Repositorio privado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo en servidor

### Funcional
- [ ] Home carga correctamente
- [ ] Catálogo muestra 46 productos
- [ ] Filtros funcionan
- [ ] Página de producto individual carga
- [ ] WhatsApp abre mensaje correcto
- [ ] Login de admin funciona
- [ ] Dashboard muestra datos
- [ ] Logout funciona
- [ ] Responsive en 375px, 768px, 1440px

---

## ACTIVACIÓN DE INDEXACIÓN (solo tras aprobación del usuario)

```
NEXT_PUBLIC_ALLOW_INDEXING=true
→ Redeploy en Railway
```

Post-activación:
- [ ] `/robots.txt` ya NO dice `Disallow: /`
- [ ] Meta robots ya NO dice `noindex`
- [ ] `/sitemap.xml` contiene todas las URLs
- [ ] `/admin` sigue en Disallow

---

## PENDIENTES PARA FASES POSTERIORES
- Google Search Console (verificar propiedad primero)
- HSTS max-age incremento a 31536000 (30 días después)
- Analytics (con consentimiento y política de privacidad)
- Google Merchant Center (cuando haya inventario confirmado)
