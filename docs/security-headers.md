# Security Headers — Luale Kids Shop

## Headers configurados en `next.config.ts`

Se aplican a todas las rutas `(.*)` vía `headers()`.

### X-Content-Type-Options: nosniff

Evita que el navegador interprete archivos con un tipo MIME diferente al declarado.

### X-Frame-Options: SAMEORIGIN

Previene que la página sea embebida en iframes de otros dominios (clickjacking).

### Referrer-Policy: strict-origin-when-cross-origin

Envía el origen completo en requests al mismo dominio; solo el origin (sin path) al navegar a HTTPS externo.

### Permissions-Policy

Deshabilita acceso a cámara, micrófono, geolocalización y pago desde este origen.

### Strict-Transport-Security (HSTS)

`max-age=86400` (24 horas) durante el primer periodo de validación.

**Después de 30 días de estabilidad sin problemas HTTPS:**
- Aumentar a `max-age=31536000`
- Evaluar añadir `includeSubDomains` (solo si todos los subdominios son HTTPS)
- NO solicitar `preload` hasta confirmar estabilidad a largo plazo

### Content-Security-Policy

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: blob: https://<supabase-hostname>
connect-src 'self' https://<supabase-hostname> wss://<supabase-hostname>
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
```

**Nota sobre `unsafe-inline`:**
Next.js inyecta scripts inline durante la hidratación del servidor. Esto es un requisito
del framework en versiones anteriores a implementar CSP con nonces. En una futura fase
se puede implementar nonce-based CSP via middleware.

**WhatsApp e Instagram:**
Los usuarios navegan a `wa.me` e `instagram.com` via `<a>` tags. No se ejecutan
scripts de estas plataformas en nuestro sitio, por lo que no necesitan estar en `script-src`.

## Verificación

```bash
# Verificar headers en producción
curl -I https://lualekids.shop | grep -iE "x-content|x-frame|referrer|permissions|strict-transport|content-security"

# Herramienta online
# https://securityheaders.com/?q=lualekids.shop
```

## Pendientes fase posterior

- Migrar de `unsafe-inline` a nonces para scripts
- Evaluar Subresource Integrity (SRI) para futuros scripts de terceros
- Añadir `preload` a HSTS después de 90 días
