# Respaldo previo al lanzamiento

## Fecha de este registro

2026-09-21

## Estado del código

- Branch: `main`
- Commit: *(pendiente — primer commit real se creará en este paso)*
- Todos los archivos de la sesión de desarrollo están listos para commit

## Alcance del respaldo

### Código fuente (Git)
- Todos los archivos del proyecto
- Migración nueva: `supabase/migrations/20240011000000_product_images_v2.sql`
- Componentes nuevos: ProductImageManager, ProductImageCarousel
- API routes: `/api/products/[id]/images`
- Páginas admin nuevas: puesta-en-marcha, inventario/inicial
- 8 archivos de documentación nuevos

### Base de datos (Supabase)
- Respaldo automático: disponible en Supabase Dashboard → Database → Backups
  (solo en plan Pro; en Free, exportar manualmente)
- Exportación manual recomendada antes del lanzamiento:
  ```bash
  supabase db dump --project-ref TU_PROJECT_REF > backups/pre-launch-$(date +%Y%m%d).sql
  ```

### Imágenes (Storage)
- 46 imágenes del catálogo en `/public/images/products/` — incluidas en el commit
- Imágenes de Storage de Supabase: no aplica hasta que se realice la migración

### Variables de entorno (Railway)
- No se incluyen en Git (protegidas por `.gitignore`)
- Registrar manualmente en un gestor de secretos (1Password, Bitwarden, etc.):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_DATA_PROVIDER`
  - `NEXT_PUBLIC_ALLOW_INDEXING`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_WHATSAPP_NUMBER`

## Cómo restaurar desde este punto

### Código
```bash
git clone TU_REPO_URL
npm install
```

### Base de datos
```bash
psql TU_SUPABASE_DB_URL < backups/pre-launch-YYYYMMDD.sql
```

### Variables de entorno
- Restaurar en Railway desde el gestor de secretos

## Qué NO está incluido

- Credenciales ni secretos (protegidos por `.gitignore`)
- Datos personales de clientes
- Archivos temporales y build artifacts

## Notas de seguridad

- El archivo `.claude/` está en `.gitignore` — nunca se sube al repositorio
- El archivo `artifacts/` está en `.gitignore`
- El archivo `.env.local` está protegido por `.gitignore`
- No hay secretos hardcoded en el código fuente (verificado)
- El service role nunca aparece en código del navegador (verificado)
