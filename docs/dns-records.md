# Registros DNS — lualekids.shop

## Proveedor DNS

A determinar. Ejecutar antes de cualquier cambio:

```bash
whois lualekids.shop | grep -i "name server"
dig lualekids.shop NS +short
```

## Registros a configurar para Railway

Railway entrega los valores exactos al añadir el dominio en:
**Dashboard → Project → Settings → Domains → Add Domain**

### Dominio raíz (lualekids.shop)

Si el proveedor soporta ALIAS/ANAME (Cloudflare, Namecheap, etc.):
```
Tipo:   ALIAS (o ANAME)
Nombre: @
Valor:  <valor entregado por Railway>
TTL:    600 (durante migración), luego 3600
```

Si el proveedor solo soporta A/AAAA:
```
Tipo:   A
Nombre: @
Valor:  <IP entregada por Railway>
TTL:    600
```

### Subdominio www

```
Tipo:   CNAME
Nombre: www
Valor:  <valor CNAME entregado por Railway>
TTL:    600
```

## Registros que NO deben modificarse

- MX (correo)
- TXT con SPF, DKIM, DMARC
- TXT de verificación de servicios (Google Search Console, etc.)
- CAA si existe
- Cualquier registro no relacionado con el tráfico web

## Snapshot previo (completar antes de cambiar)

Registrar aquí los valores actuales antes de tocarlos:

| Tipo | Nombre | Valor actual | ¿Modificar? |
|------|--------|--------------|-------------|
| A    | @      | ?            | ✅ Reemplazar |
| CNAME| www    | ?            | ✅ Reemplazar |
| MX   | @      | ?            | ❌ Mantener  |
| TXT  | @      | ?            | ❌ Mantener  |

## Verificación después del cambio

```bash
# Verificar resolución (puede tardar 5-60 minutos)
dig lualekids.shop A +short
dig www.lualekids.shop CNAME +short

# Verificar desde resolvers externos
curl -I https://lualekids.shop
curl -I https://www.lualekids.shop

# Verificar HTTPS
curl -svo /dev/null https://lualekids.shop 2>&1 | grep -E "SSL|certificate|expire"
```

## Rollback

Si el dominio no resuelve después de 2 horas:
1. Restaurar los valores del snapshot previo
2. La URL temporal de Railway sigue funcionando sin cambios
3. DNS puede tardar hasta 48h en propagarse globalmente
