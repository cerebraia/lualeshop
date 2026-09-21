-- ============================================================
-- 0007 — Storage Buckets
-- ============================================================
-- Creates buckets via the storage schema.
-- Run after all table migrations are complete.
-- Note: Storage bucket policies can also be managed via the
--       Supabase Dashboard under Storage → Policies.

-- ── product-images ────────────────────────────────────────────
-- Public bucket: anyone can read images (needed for public storefront).
-- Write access is restricted to authenticated admins via policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,                                        -- public read
  5242880,                                     -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ── expense-receipts ──────────────────────────────────────────
-- Private bucket: only admins can read or write.
-- Use signed URLs to share individual receipts when needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-receipts',
  'expense-receipts',
  false,                                       -- private
  10485760,                                    -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- ── Storage Policies ─────────────────────────────────────────

-- product-images: public read
create policy "product_images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

-- product-images: admin write (upload, update, delete)
create policy "product_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and is_active_admin()
  );

create policy "product_images_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and is_active_admin()
  );

create policy "product_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and is_active_admin()
  );

-- expense-receipts: admin only
create policy "expense_receipts_admin_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and is_active_admin()
  );

create policy "expense_receipts_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'expense-receipts'
    and is_active_admin()
  );

create policy "expense_receipts_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and is_active_admin()
  );

-- ── Migration notes ───────────────────────────────────────────
-- Current images are served from /public/images/products/*.webp.
-- To migrate to Storage:
--   1. Upload each file to product-images/<product_id>/<filename>
--   2. Update product_images.storage_path for each row
--   3. Update ProductImage component to use Supabase public URL
--   4. Remove /public/images/products/ from the repo (or keep as CDN fallback)
-- Do NOT delete local images until Storage migration is verified.
