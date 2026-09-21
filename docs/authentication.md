# Autenticación — Luale Kids Shop

## Modos

### Mock (`NEXT_PUBLIC_DATA_PROVIDER=mock`)
- Acceso al dashboard sin contraseña.
- Banner amarillo visible que indica "Modo demo".
- No hay sesión real. No hay tokens.
- Apropiado solo para desarrollo local.

### Supabase (`NEXT_PUBLIC_DATA_PROVIDER=supabase`)
- Autenticación real con Supabase Auth (email + contraseña).
- Sesión con cookies HttpOnly administradas por `@supabase/ssr`.
- Middleware de Next.js refresca la sesión automáticamente.
- El admin layout valida sesión + perfil activo + rol permitido en cada carga.

## Flujo de login (supabase mode)

1. Usuario abre `/admin/*`.
2. Middleware detecta cookie de sesión ausente → redirect a `/admin/login?next=/admin/...`.
3. Usuario completa email + contraseña en `/admin/login`.
4. `supabase.auth.signInWithPassword()` → cookie de sesión establecida.
5. Redirect a `next` (validado contra whitelist `/admin/*`).
6. Admin layout verifica `profile.active` y `profile.role in ('admin','owner')`.
7. Si la sesión expira → middleware redirect a login.

## Roles

| Rol | Acceso |
|-----|--------|
| `owner` | Todo: catálogo, pedidos, finanzas, configuración, gestión de perfiles |
| `admin` | Operaciones de tienda: catálogo, pedidos, inventario, clientes, gastos |

## Registro de usuarios

- **El registro público está deshabilitado** en `supabase/config.toml` (`enable_signup = false`).
- El primer `owner` se crea manualmente desde el dashboard de Supabase.
- Ver `docs/remote-supabase-setup.md` para el proceso de creación.

## Recuperación de contraseña

Pendiente de implementar. Proceso futuro:
1. Página `/admin/reset-password` → llama a `supabase.auth.resetPasswordForEmail()`.
2. Email enviado con link → `/admin/reset-password/confirm?code=...`.
3. `supabase.auth.exchangeCodeForSession()` + `supabase.auth.updateUser({ password })`.

## Anti-patterns evitados

- ❌ Service role key en cliente o variables `NEXT_PUBLIC_`
- ❌ `using (true)` en políticas RLS de tablas privadas
- ❌ Open redirects en `next` param
- ❌ Registro público habilitado
- ❌ Confiar solo en middleware sin RLS como segunda línea de defensa
