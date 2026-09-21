-- ============================================================
-- 0006 — Finance (private: costs, expenses, activity log)
-- ============================================================

-- ── variant_costs ─────────────────────────────────────────────
-- Private table. Never readable by anon. Never joined into public views.
-- Updated transactionally by confirm_merchandise_entry().
create table variant_costs (
  variant_id   uuid           primary key references product_variants(id) on delete cascade,
  average_cost numeric(12,2)  not null default 0 check (average_cost >= 0),
  last_cost    numeric(12,2)  not null default 0 check (last_cost >= 0),
  updated_at   timestamptz    not null default now()
);

-- ── expense_categories ────────────────────────────────────────
create table expense_categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ── expenses ──────────────────────────────────────────────────
create table expenses (
  id                    uuid           primary key default gen_random_uuid(),
  expense_date          date           not null default current_date,
  category_id           uuid           references expense_categories(id) on delete set null,
  description           text           not null,
  amount                numeric(12,2)  not null check (amount > 0),
  payment_method        payment_method not null,
  receipt_path          text,          -- path in expense-receipts Storage bucket
  merchandise_entry_id  uuid           references merchandise_entries(id) on delete set null,
  created_by            uuid           references auth.users(id) on delete set null,
  created_at            timestamptz    not null default now(),
  updated_at            timestamptz    not null default now(),
  archived_at           timestamptz
);

create index expenses_date_idx on expenses (expense_date desc);
create index expenses_category_idx on expenses (category_id);

create trigger expenses_updated_at
  before update on expenses
  for each row execute procedure touch_updated_at();

-- ── store_settings ────────────────────────────────────────────
-- Single-row table controlled by owners.
-- Public-safe fields are readable by anon via RLS.
create table store_settings (
  id                 integer     primary key default 1 check (id = 1),  -- enforce single row
  store_name         text        not null default 'Luale Kids Shop',
  whatsapp_number    text        not null default '584220162748',
  whatsapp_display   text        not null default '+58 422-0162748',
  instagram_url      text        not null default 'https://instagram.com/lualekids.shop',
  location           text        not null default 'Caracas, Venezuela',
  currency           text        not null default 'USD',
  currency_symbol    text        not null default '$',
  delivery_text      text        not null default 'Delivery en Caracas con costo según la zona.',
  shipping_text      text        not null default 'Envíos a toda Venezuela.',
  hero_title         text        not null default 'Más que ropa, es amor en cada detalle.',
  hero_description   text        not null default 'Prendas especiales para acompañar con ternura sus primeros pasos.',
  site_domain        text        not null default 'lualekids.shop',
  about_text         text        not null default '',
  tagline            text        not null default 'Pequeños grandes momentos.',
  updated_by         uuid        references auth.users(id) on delete set null,
  updated_at         timestamptz not null default now()
);

-- ── activity_log ──────────────────────────────────────────────
-- Append-only audit trail. Written by RPC functions, never by API directly.
create table activity_log (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        references auth.users(id) on delete set null,
  action      text        not null,  -- e.g. 'confirm_order', 'register_payment'
  entity_type text        not null,  -- e.g. 'order', 'merchandise_entry'
  entity_id   uuid,
  metadata    jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

create index activity_log_actor_idx on activity_log (actor_id, created_at desc);
create index activity_log_entity_idx on activity_log (entity_type, entity_id)
  where entity_id is not null;

-- Prevent direct modification of activity log via API
create or replace rule activity_log_no_update as
  on update to activity_log do instead nothing;

create or replace rule activity_log_no_delete as
  on delete to activity_log do instead nothing;
