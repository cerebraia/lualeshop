-- ============================================================
-- 0019 — Safe product deletion and archive RPCs
-- ============================================================
-- Three RPCs:
--   attempt_product_delete  → tries hard delete; falls back to archive
--   archive_product         → soft-archive (status='archived')
--   restore_product         → reverses archive (status='draft')
--
-- Idempotent: CREATE OR REPLACE throughout.

-- ── RPC: attempt_product_delete ──────────────────────────────
-- Returns:
--   { action: 'deleted',          productId, reason: null }   → hard-deleted
--   { action: 'requires_archive', productId, reason: 'PRODUCT_HAS_HISTORY' }
--     → product has order history; caller should offer archive instead
--
-- Hard delete is safe because:
--   order_items.product_id → ON DELETE SET NULL (order rows preserved)
--   product_categories, product_purchase_options, product_variants,
--   product_images, inventory_levels → ON DELETE CASCADE
--
-- The RPC returns the list of storage_path values so the caller can
-- clean up Supabase Storage objects after the DB transaction commits.

create or replace function attempt_product_delete(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_count integer;
  v_storage_paths text[];
begin
  -- Authorization
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Validate product exists
  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'Product not found' using errcode = 'P0404';
  end if;

  -- Check for order history (order_items rows still linked to this product)
  select count(*) into v_order_count
  from order_items
  where product_id = p_product_id;

  if v_order_count > 0 then
    -- Cannot delete; tell caller to archive instead
    return jsonb_build_object(
      'action',    'requires_archive',
      'productId', p_product_id,
      'reason',    'PRODUCT_HAS_HISTORY'
    );
  end if;

  -- Collect storage paths before deletion (for Storage cleanup by caller)
  select coalesce(array_agg(storage_path), '{}')
  into v_storage_paths
  from product_images
  where product_id = p_product_id;

  -- Hard delete — cascades handle related rows
  delete from products where id = p_product_id;

  perform log_activity(
    'delete_product', 'product', p_product_id,
    jsonb_build_object('storage_paths_to_clean', v_storage_paths)
  );

  return jsonb_build_object(
    'action',        'deleted',
    'productId',     p_product_id,
    'reason',        null,
    'storagePaths',  to_json(v_storage_paths)
  );
end;
$$;

revoke execute on function attempt_product_delete(uuid) from public;
grant  execute on function attempt_product_delete(uuid) to authenticated;

-- ── RPC: archive_product ──────────────────────────────────────
create or replace function archive_product(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'Product not found' using errcode = 'P0404';
  end if;

  update products
  set status = 'archived', archived_at = coalesce(archived_at, now())
  where id = p_product_id;

  perform log_activity(
    'archive_product', 'product', p_product_id, '{}'::jsonb
  );

  return jsonb_build_object(
    'action',    'archived',
    'productId', p_product_id,
    'reason',    null
  );
end;
$$;

revoke execute on function archive_product(uuid) from public;
grant  execute on function archive_product(uuid) to authenticated;

-- ── RPC: restore_product ─────────────────────────────────────
-- Restores to 'draft' (not 'active') so admin can review before republishing.
create or replace function restore_product(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  if not exists (select 1 from products where id = p_product_id and status = 'archived') then
    raise exception 'Archived product not found' using errcode = 'P0404';
  end if;

  update products
  set status = 'draft', archived_at = null
  where id = p_product_id;

  perform log_activity(
    'restore_product', 'product', p_product_id, '{}'::jsonb
  );

  return jsonb_build_object(
    'action',    'restored',
    'productId', p_product_id,
    'reason',    null
  );
end;
$$;

revoke execute on function restore_product(uuid) from public;
grant  execute on function restore_product(uuid) to authenticated;
