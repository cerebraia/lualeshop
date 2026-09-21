-- ============================================================
-- 0003 — Catalog (public-readable tables)
-- ============================================================
-- categories, products, product_categories, product_images,
-- product_purchase_options, product_variants
--
-- Public read access is granted via RLS.
-- Write access requires an active admin/owner session.
-- Cost data is kept in a separate private table (migration 0006).

-- ── Helper: touch updated_at ──────────────────────────────────
-- Reuse the function from 0002

-- ── categories ───────────────────────────────────────────────
create table categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  description text,
  color       text,                          -- optional hex or name for UI theming
  active      boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger categories_updated_at
  before update on categories
  for each row execute procedure touch_updated_at();

-- ── products ─────────────────────────────────────────────────
create table products (
  id                   uuid              primary key default gen_random_uuid(),
  catalog_number       integer           unique,    -- original PDF catalog #, 1–46
  sku                  text              not null unique,
  slug                 text              not null unique,
  name                 text              not null,
  garment_type         text              not null default '',
  short_description    text,
  description          text,
  status               product_status    not null default 'draft',
  manual_availability  manual_availability not null default 'consult',
  inventory_configured boolean           not null default false,
  low_stock_threshold  integer           not null default 3 check (low_stock_threshold >= 0),
  featured             boolean           not null default false,
  is_new               boolean           not null default false,
  size_note            text,              -- e.g. "Talla pendiente de confirmación" (LK-020)
  tags                 text[]            not null default '{}',
  published_at         timestamptz,       -- null = not published; set when status→active
  archived_at          timestamptz,
  created_at           timestamptz       not null default now(),
  updated_at           timestamptz       not null default now()
);

comment on column products.catalog_number is 'Immutable reference to the PDF catalog page/number. 1-46.';
comment on column products.manual_availability is 'Overrides computed availability. "consult" is the default for all 46 products.';
comment on column products.size_note is 'Displayed to customers when size information needs clarification.';

create index products_status_idx ON products (status) where status = 'active';
create index products_featured_idx ON products (featured) where featured = true;
create index products_is_new_idx ON products (is_new) where is_new = true;

create trigger products_updated_at
  before update on products
  for each row execute procedure touch_updated_at();

-- Auto-set published_at when status changes to active
create or replace function sync_published_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' and old.status != 'active' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  if new.status = 'archived' and old.status != 'archived' then
    new.archived_at = coalesce(new.archived_at, now());
  end if;
  return new;
end;
$$;

create trigger products_sync_published_at
  before update on products
  for each row execute procedure sync_published_at();

-- ── product_categories ────────────────────────────────────────
create table product_categories (
  product_id  uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- ── product_images ────────────────────────────────────────────
create table product_images (
  id           uuid        primary key default gen_random_uuid(),
  product_id   uuid        not null references products(id) on delete cascade,
  storage_path text        not null,  -- path in product-images Storage bucket
  alt_text     text,
  position     integer     not null default 0 check (position >= 0),
  is_primary   boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- Enforce only one primary image per product
create unique index product_images_primary_idx
  on product_images (product_id)
  where is_primary = true;

-- ── product_purchase_options ──────────────────────────────────
-- Used when a product is sold in multiple configurations
-- (e.g. "Una unidad $8 / Set completo $35")
create table product_purchase_options (
  id                 uuid        primary key default gen_random_uuid(),
  product_id         uuid        not null references products(id) on delete cascade,
  label              text        not null,          -- "Una unidad", "Cinco pares"
  price              numeric(12,2) not null check (price > 0),
  unit_description   text,                          -- "c/u", "set de 5", "par"
  quantity_included  integer     check (quantity_included > 0),
  active             boolean     not null default true,
  sort_order         integer     not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger purchase_options_updated_at
  before update on product_purchase_options
  for each row execute procedure touch_updated_at();

-- ── product_variants ──────────────────────────────────────────
-- Represents a specific size/color combination of a product.
-- Stock is tracked in inventory_levels (migration 0004).
create table product_variants (
  id                  uuid        primary key default gen_random_uuid(),
  product_id          uuid        not null references products(id) on delete cascade,
  purchase_option_id  uuid        references product_purchase_options(id) on delete set null,
  sku                 text        unique,            -- variant-level SKU (optional)
  size                text        not null,
  color               text,                          -- null = color not confirmed
  active              boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index product_variants_product_idx on product_variants (product_id);

create trigger product_variants_updated_at
  before update on product_variants
  for each row execute procedure touch_updated_at();
