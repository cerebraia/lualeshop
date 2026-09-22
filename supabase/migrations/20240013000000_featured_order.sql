-- ============================================================
-- 0013 — featured_order column on products
-- ============================================================
-- Idempotent: safe to run multiple times.
-- Adds featured_order (nullable integer) to the products table.
-- Null = not featured or order not specified.
-- Application code sorts by featured_order ASC NULLS LAST.

alter table products
  add column if not exists featured_order integer
    check (featured_order is null or (featured_order >= 1 and featured_order <= 16));

comment on column products.featured_order is
  'Display position in the "Elegidos con amor" home carousel (1–16). NULL = not featured or unordered.';

-- Partial index for efficient lookup of featured products ordered by position
create index if not exists products_featured_order_idx
  on products (featured_order asc nulls last)
  where featured_order is not null;
