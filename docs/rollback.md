# Rollback — Procedimientos de reversión

## Niveles de rollback

### Nivel 1: Revertir código (más seguro, 2 minutos)

```bash
# En Railway: ir a Deployments → seleccionar deployment anterior → Redeploy
# O en Git:
git revert HEAD
git push
```

Railway redesplega automáticamente.

### Nivel 2: Revertir DNS (si el dominio no resuelve)

1. Ir al panel del proveedor DNS
2. Restaurar los registros A/CNAME previos (del snapshot en docs/dns-records.md)
3. Esperar propagación (5-30 minutos típicamente)
4. La URL temporal de Railway sigue funcionando inmediatamente

**Por eso nunca eliminar la URL temporal de Railway.**

### Nivel 3: Revertir DATA_PROVIDER a mock

Si Supabase presenta problemas:

```
# En Railway → Variables:
NEXT_PUBLIC_DATA_PROVIDER=mock
```

La app vuelve a funcionar con localStorage + mock data inmediatamente.

### Nivel 4: Revertir indexación

```
# En Railway → Variables:
NEXT_PUBLIC_ALLOW_INDEXING=false
→ Redeploy
```

`/robots.txt` vuelve a bloquear todo. Los bots respetan el cambio en 24-48h.

## Snapshots a documentar antes del lanzamiento

```
Fecha del snapshot: ___________

Railway:
  Deployment URL anterior: ___________
  Commit hash estable:     ___________

DNS previo (completar):
  A @:         ___________
  CNAME www:   ___________

Supabase Auth URL anterior: ___________

Variables Railway previas:
  NEXT_PUBLIC_SITE_URL: ___________
```

## Contactos de emergencia

- Railway support: https://railway.app/help
- Supabase support: https://supabase.com/support
- Proveedor DNS: (anotar aquí)
