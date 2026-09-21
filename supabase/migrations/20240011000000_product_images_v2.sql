-- ============================================================
-- 0011 — product_images v2
-- ============================================================
-- Adds missing columns: width, height, file_size, mime_type,
-- updated_at, created_by.
-- Increases Storage bucket file_size_limit to 10 MB.
-- Creates RPCs: reorder_product_images, set_primary_product_image,
--               delete_product_image.
-- Adds max-8-images-per-product check via trigger.

-- ── Add missing columns ───────────────────────────────────────
alter table product_images
  add column if not exists width       integer,
  add column if not exists height      integer,
  add column if not exists file_size   integer,       -- bytes
  add column if not exists mime_type   text,
  add column if not exists created_by  uuid references auth.users(id) on delete set null,
  add column if not exists updated_at  timestamptz not null default now();

-- Add trigger for updated_at
create trigger product_images_updated_at
  before update on product_images
  for each row execute procedure touch_updated_at();

-- ── Enforce max 8 active images per product ───────────────────
create or replace function check_max_product_images()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from product_images
  where product_id = new.product_id;

  if v_count >= 8 then
    raise exception 'A product can have at most 8 images'
      using errcode = 'P0400', hint = 'Delete an existing image before adding a new one';
  end if;
  return new;
end;
$$;

create trigger product_images_max_check
  before insert on product_images
  for each row execute procedure check_max_product_images();

-- ── Increase Storage bucket limit to 10 MB ───────────────────
update storage.buckets
  set file_size_limit = 10485760        -- 10 MB
where id = 'product-images';

-- Allow WebP and include HEIC-safe mime
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';

-- ── RPC: reorder_product_images ───────────────────────────────
-- Input:  p_product_id uuid, p_image_ids uuid[]
-- The array must contain ALL current image IDs for the product
-- in the desired order. Position = array index (0-based).
create or replace function reorder_product_images(
  p_product_id uuid,
  p_image_ids  uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_ids uuid[];
  v_count        integer;
  v_dup_check    integer;
begin
  -- Authorization
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Validate product exists
  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'Product not found' using errcode = 'P0404';
  end if;

  -- Get current image IDs for this product
  select array_agg(id) into v_existing_ids
  from product_images
  where product_id = p_product_id;

  -- Validate count matches
  if array_length(p_image_ids, 1) != array_length(v_existing_ids, 1) then
    raise exception 'Image count mismatch: expected %, got %',
      array_length(v_existing_ids, 1), array_length(p_image_ids, 1)
      using errcode = 'P0400';
  end if;

  -- Check no duplicates in input
  select count(distinct x) into v_dup_check from unnest(p_image_ids) x;
  if v_dup_check != array_length(p_image_ids, 1) then
    raise exception 'Duplicate image IDs in input' using errcode = 'P0400';
  end if;

  -- Validate all input IDs belong to this product
  if exists (
    select 1 from unnest(p_image_ids) x(img_id)
    where not exists (
      select 1 from product_images
      where id = x.img_id and product_id = p_product_id
    )
  ) then
    raise exception 'One or more image IDs do not belong to this product'
      using errcode = 'P0400';
  end if;

  -- Apply new positions
  for i in 1 .. array_length(p_image_ids, 1) loop
    update product_images
    set position = i - 1, updated_at = now()
    where id = p_image_ids[i];
  end loop;

  -- Log activity
  perform log_activity(
    'reorder_images', 'product', p_product_id,
    jsonb_build_object('image_count', array_length(p_image_ids, 1))
  );
end;
$$;

revoke execute on function reorder_product_images(uuid, uuid[]) from public;
grant  execute on function reorder_product_images(uuid, uuid[]) to authenticated;

-- ── RPC: set_primary_product_image ───────────────────────────
-- Makes one image the primary; clears previous primary.
create or replace function set_primary_product_image(
  p_product_id uuid,
  p_image_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Authorization
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Validate product
  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'Product not found' using errcode = 'P0404';
  end if;

  -- Validate image belongs to product
  if not exists (
    select 1 from product_images
    where id = p_image_id and product_id = p_product_id
  ) then
    raise exception 'Image does not belong to this product' using errcode = 'P0400';
  end if;

  -- Clear current primary (if any)
  update product_images
  set is_primary = false, updated_at = now()
  where product_id = p_product_id and is_primary = true;

  -- Set new primary
  update product_images
  set is_primary = true, updated_at = now()
  where id = p_image_id;

  -- Log
  perform log_activity(
    'set_primary_image', 'product', p_product_id,
    jsonb_build_object('image_id', p_image_id)
  );
end;
$$;

revoke execute on function set_primary_product_image(uuid, uuid) from public;
grant  execute on function set_primary_product_image(uuid, uuid) to authenticated;

-- ── RPC: delete_product_image ─────────────────────────────────
-- Removes metadata and returns storage_path for caller to delete from Storage.
-- Reassigns primary to the next image by position if needed.
create or replace function delete_product_image(
  p_image_id uuid
)
returns text   -- returns storage_path so caller can delete from Storage
language plpgsql
security definer
set search_path = public
as $$
declare
  v_image        product_images%rowtype;
  v_next_id      uuid;
  v_storage_path text;
begin
  -- Authorization
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Lock and get image
  select * into v_image
  from product_images
  where id = p_image_id
  for update;

  if not found then
    raise exception 'Image not found' using errcode = 'P0404';
  end if;

  v_storage_path := v_image.storage_path;

  -- Delete metadata
  delete from product_images where id = p_image_id;

  -- Reorder remaining (close the gap)
  update product_images
  set position = position - 1, updated_at = now()
  where product_id = v_image.product_id
    and position > v_image.position;

  -- If it was primary, assign primary to first remaining
  if v_image.is_primary then
    select id into v_next_id
    from product_images
    where product_id = v_image.product_id
    order by position asc
    limit 1;

    if v_next_id is not null then
      update product_images
      set is_primary = true, updated_at = now()
      where id = v_next_id;
    end if;
  end if;

  -- Log
  perform log_activity(
    'delete_image', 'product', v_image.product_id,
    jsonb_build_object('image_id', p_image_id, 'was_primary', v_image.is_primary)
  );

  return v_storage_path;
end;
$$;

revoke execute on function delete_product_image(uuid) from public;
grant  execute on function delete_product_image(uuid) to authenticated;
