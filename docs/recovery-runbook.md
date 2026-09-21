# Runbook de recuperación

Este documento cubre los escenarios de fallo más probables y sus pasos de recuperación.
No incluye secretos ni credenciales.

---

## Railway caído

**Síntoma**: La tienda pública no carga. Error 5xx o timeout.

1. Verificar el dashboard de Railway: estado del servicio, logs recientes
2. Si hay un deploy roto, hacer rollback al deploy anterior:
   Railway Dashboard → Deployments → seleccionar el deploy anterior → Redeploy
3. Si el problema es una variable de entorno faltante, agregarla en Variables
4. Si el servicio no arranca, revisar los logs de build y runtime

---

## Supabase caído

**Síntoma**: El dashboard admin muestra errores de conexión. Las páginas públicas pueden seguir funcionando si los datos están cacheados.

1. Verificar el estado en status.supabase.com
2. Si es un fallo de la plataforma, esperar la recuperación (no modificar nada)
3. Si es un problema de conexión del proyecto, verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` sean correctos en Railway
4. Verificar que el proyecto Supabase esté activo (no pausado por inactividad en el plan Free)
   - Plan Free pausa proyectos después de 1 semana sin actividad
   - Reactivar: Supabase Dashboard → proyecto → "Restore project"

---

## Error de deploy

**Síntoma**: El deploy falla en Railway. Build error o crash en runtime.

1. Revisar los logs del build en Railway
2. Si es un error de TypeScript: ejecutar `npm run build` localmente y corregir antes de subir
3. Si es un error de dependencias: verificar `package.json` y `package-lock.json`
4. Hacer rollback al último deploy exitoso mientras se corrige
5. No forzar deploys con `--force` si el build falla localmente

---

## Migración fallida

**Síntoma**: Error al aplicar migraciones de Supabase.

1. Verificar el error en Supabase Dashboard → Database → Migrations
2. No aplicar la migración siguiente hasta corregir la fallida
3. Si el error es parcial (algunos statements ejecutados), puede requerir rollback manual:
   ```sql
   -- Solo si es seguro hacerlo, con el schema documentado
   ```
4. Consultar `docs/database-schema.md` para entender el estado esperado
5. Nunca ejecutar `DROP TABLE` sin un backup previo verificado

---

## Login roto

**Síntoma**: No se puede iniciar sesión en el dashboard admin.

1. Verificar que el usuario existe en Supabase Auth:
   Supabase Dashboard → Authentication → Users
2. Verificar que el perfil tiene `active = true` y `role = 'owner'` o `'admin'`:
   ```sql
   SELECT id, role, active FROM profiles WHERE id = 'TU_USER_ID';
   ```
3. Si el perfil no existe, crearlo manualmente:
   ```sql
   INSERT INTO profiles (id, full_name, role, active)
   VALUES ('TU_USER_ID', 'Nombre', 'owner', true);
   ```
4. Si el usuario no existe en Auth, crearlo desde Supabase Dashboard → Authentication → Add user
5. Verificar que `NEXT_PUBLIC_SUPABASE_URL` coincide con el proyecto correcto

---

## Imágenes no disponibles

**Síntoma**: Las imágenes de productos no cargan.

1. Verificar que los archivos existen en `public/images/products/`
2. Verificar que el path en el producto coincide con el nombre del archivo
3. Si el Storage de Supabase está configurado para las imágenes, verificar las políticas en
   Supabase Dashboard → Storage → Policies
4. Verificar que la política de lectura pública esté activa para el bucket de productos
   (ver `docs/storage-policy.md`)

---

## Datos modificados accidentalmente

**Síntoma**: Un producto, pedido o cliente fue editado o eliminado por error.

1. Si hay backup reciente: restaurar desde el backup (ver `docs/backup-strategy.md`)
2. Si el dato fue eliminado de Supabase y no hay backup:
   - En modo mock (localStorage): recargar la página o limpiar localStorage para restaurar datos mock
   - En Supabase: el dato puede ser irrecuperable sin backup
3. Para pedidos: nunca eliminar — solo cancelar. El historial se preserva.
4. Para productos: si hay una imagen o descripción sobreescrita, verificar el git history del
   código para recuperar valores mock originales

---

## Rotación de claves

**Síntoma**: Las claves de Supabase necesitan rotarse (brecha de seguridad, expiración, etc.)

1. Generar nuevas claves en Supabase Dashboard → Project Settings → API
2. Actualizar en Railway: Variables → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Actualizar `.env.local` local
4. Las claves antiguas dejan de funcionar al revocarlas — coordinar con el equipo si hay múltiples personas
5. Verificar que el login y las operaciones funcionan con las nuevas claves

---

## Pérdida de sesión

**Síntoma**: La sesión del admin expira o se invalida inesperadamente.

1. Cerrar sesión explícitamente y volver a iniciar
2. Si el problema persiste, verificar la fecha de expiración del JWT en Supabase:
   Supabase Dashboard → Auth → JWT expiry (configurado en `supabase/config.toml`)
3. Limpiar cookies del navegador para el dominio
4. Verificar que el middleware no esté redirigiendo en un loop

---

## Rollback del código

Para volver a un commit anterior:

1. En Railway: Dashboard → Deployments → seleccionar el deploy anterior → Redeploy
2. Localmente para diagnóstico:
   ```bash
   git log --oneline -10
   git checkout <commit-hash> -- app/ components/ lib/
   ```
3. Si el rollback rompe migraciones de base de datos, restaurar también el schema correspondiente

---

## Restauración completa de datos

Ver `docs/backup-strategy.md` para los comandos de exportación e importación.

Proceso general:
1. Identificar el backup más reciente válido
2. Aplicar en un entorno de prueba primero
3. Validar integridad (ver sección "Validar una restauración" en backup-strategy.md)
4. Aplicar en producción en horario de baja actividad

---

## Escalamiento de incidentes

Si ninguno de los pasos anteriores resuelve el problema:

1. Revisar los logs completos de Railway y Supabase
2. Consultar la documentación oficial de Supabase: https://supabase.com/docs
3. Si es un problema de la plataforma Supabase: abrir un ticket en support.supabase.com
4. Si es un problema de código: revisar el historial de commits recientes para identificar el cambio causante
