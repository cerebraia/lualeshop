-- ============================================================
-- 0012 — Public product search RPC
-- ============================================================
-- Adds unaccent extension and the search_public_products function.
-- Only returns products with status = 'active'.
-- Never exposes costs, inventory levels, or private data.

-- ── unaccent extension ────────────────────────────────────────
create extension if not exists unaccent;

-- ── Helper: normalize text for accent-insensitive search ─────
-- Reused inside the RPC to normalise both query and stored fields.
create or replace function normalize_search_text(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(unaccent(p_text));
$$;

-- ── search_public_products ────────────────────────────────────
-- Input:  p_query text, p_limit integer (1–20)
-- Output: public product fields only — no costs, no stock numbers
--
-- Searches: product name, garment_type, category names, variant sizes.
-- Only returns products with status = 'active'.
-- Uses parameterized ILIKE to prevent SQL injection.
-- search_path is fixed — no schema confusion.
create or replace function search_public_products(
  p_query text,
  p_limit integer default 8
)
returns table (
  id                  uuid,
  slug                text,
  name                text,
  garment_type        text,
  status              product_status,
  inventory_configured boolean,
  price               numeric,
  is_multi_price      boolean,
  image_url           text,
  category_names      text[],
  sizes               text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q     text;
  v_limit integer;
begin
  -- Sanitise: strip leading/trailing whitespace, enforce max length
  v_q     := left(trim(p_query), 100);
  v_limit := least(greatest(coalesce(p_limit, 8), 1), 20);

  -- Empty or too-short query → return nothing
  if length(v_q) < 2 then
    return;
  end if;

  return query
  select
    p.id,
    p.slug,
    p.name,
    p.garment_type,
    p.status,
    p.inventory_configured,
    -- Base price: lowest purchase option if multi-price, otherwise from variants/options
    coalesce(
      (select min(ppo.price) from product_purchase_options ppo where ppo.product_id = p.id and ppo.active = true),
      0
    )                                                         as price,
    (select count(*) > 1
       from product_purchase_options ppo
      where ppo.product_id = p.id and ppo.active = true)     as is_multi_price,
    -- Primary image URL (storage path, caller converts to public URL if needed)
    (select pi.storage_path
       from product_images pi
      where pi.product_id = p.id
      order by pi.is_primary desc, pi.position asc
      limit 1)                                                as image_url,
    -- Category names array
    array(
      select c.name
        from categories c
        join product_categories pc on pc.category_id = c.id
       where pc.product_id = p.id and c.active = true
    )                                                         as category_names,
    -- Distinct variant sizes (active variants only)
    array(
      select distinct pv.size
        from product_variants pv
       where pv.product_id = p.id and pv.active = true
       order by pv.size
       limit 6
    )                                                         as sizes
  from products p
  where
    p.status = 'active'
    and (
      normalize_search_text(p.name)         like '%' || normalize_search_text(v_q) || '%'
      or normalize_search_text(p.garment_type) like '%' || normalize_search_text(v_q) || '%'
      or normalize_search_text(coalesce(p.short_description, ''))
                                            like '%' || normalize_search_text(v_q) || '%'
      or exists (
        select 1
          from categories c
          join product_categories pc on pc.category_id = c.id
         where pc.product_id = p.id
           and normalize_search_text(c.name) like '%' || normalize_search_text(v_q) || '%'
      )
      or exists (
        select 1
          from product_variants pv
         where pv.product_id = p.id
           and pv.active = true
           and normalize_search_text(pv.size) like '%' || normalize_search_text(v_q) || '%'
      )
    )
  order by
    -- Exact name match ranks first
    case when normalize_search_text(p.name) = normalize_search_text(v_q) then 0 else 1 end,
    -- Prefix match ranks second
    case when normalize_search_text(p.name) like normalize_search_text(v_q) || '%' then 0 else 1 end,
    p.featured desc,
    p.published_at desc
  limit v_limit;
end;
$$;

-- Public execute: this RPC is intentionally callable by anon
-- (it only reads active products, no private data)
grant execute on function search_public_products(text, integer) to anon, authenticated;

-- normalize_search_text is a helper, restrict to service and authenticated
revoke execute on function normalize_search_text(text) from public;
grant  execute on function normalize_search_text(text) to authenticated;

comment on function search_public_products is
  'Accent-insensitive public product search. Only returns active products. Max 20 results.';
