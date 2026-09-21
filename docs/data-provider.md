# Data Provider — Luale Kids Shop

## Variable

```
NEXT_PUBLIC_DATA_PROVIDER=mock   # default
NEXT_PUBLIC_DATA_PROVIDER=supabase
```

## Comportamiento

| Valor | Backend | Auth | Migraciones requeridas |
|-------|---------|------|------------------------|
| `mock` | localStorage | Demo (sin contraseña) | Ninguna |
| `supabase` | PostgreSQL + Supabase Auth | Real | Sí |

## Reglas

- **Nunca mezclar** lecturas mock con escrituras Supabase en la misma sesión.
- Si `supabase` pero faltan las variables de entorno, el sistema lanza un error claro en lugar de caer silenciosamente a mock.
- No se permite un tercer valor. Cualquier valor desconocido se trata como `mock` con advertencia en consola.

## Implementación

`lib/data-provider.ts` exporta:
- `getDataProvider()` → `'mock' | 'supabase'`
- `isMockProvider()` → boolean
- `isSupabaseProvider()` → boolean

## Repositorios

Los repositorios mock (actuales, síncronos) viven en `lib/repositories/*.ts`.
Los repositorios Supabase (nuevos, asíncronos) viven en `lib/repositories/supabase/*.ts`.

En esta fase, los componentes admin aún consumen los repositorios mock directamente.
La migración de páginas a repositorios async es la siguiente fase.

## Para volver a mock en desarrollo

```bash
# .env.local
NEXT_PUBLIC_DATA_PROVIDER=mock
```

Reiniciar el servidor de desarrollo. No se requiere configuración adicional.
