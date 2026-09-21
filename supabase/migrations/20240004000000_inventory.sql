-- ============================================================
-- 0004 — Inventory (private)
-- ============================================================
-- inventory_levels, inventory_movements, suppliers,
-- merchandise_entries, merchandise_entry_items

-- ── suppliers ─────────────────────────────────────────────────
create table suppliers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  phone       text,
  notes       text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger suppliers_updated_at
  before update on suppliers
  for each row execute procedure touch_updated_at();

-- ── inventory_levels ──────────────────────────────────────────
-- One row per variant. quantity_on_hand is the source of truth.
-- Updated transactionally; never updated directly via API.
create table inventory_levels (
  variant_id         uuid        primary key references product_variants(id) on delete cascade,
  quantity_on_hand   integer     not null default 0 check (quantity_on_hand >= 0),
  updated_at         timestamptz not null default now()
);

-- ── inventory_movements ───────────────────────────────────────
-- Immutable audit trail. Never update or delete rows here.
-- All changes go through RPC functions that create movements + update levels.
create table inventory_movements (
  id                 uuid          primary key default gen_random_uuid(),
  variant_id         uuid          not null references product_variants(id),
  movement_type      movement_type not null,
  quantity_delta     integer       not null,  -- positive=in, negative=out
  previous_quantity  integer       not null,
  resulting_quantity integer       not null check (resulting_quantity >= 0),
  reference_type     text,                    -- 'order', 'merchandise_entry', 'manual'
  reference_id       uuid,                    -- FK to the originating record
  notes              text,
  created_by         uuid          references auth.users(id) on delete set null,
  created_at         timestamptz   not null default now()
);

create index inventory_movements_variant_idx on inventory_movements (variant_id, created_at desc);
create index inventory_movements_reference_idx on inventory_movements (reference_type, reference_id)
  where reference_type is not null;

-- Prevent direct updates/deletes on this table (use RPC only)
create or replace rule inventory_movements_no_update as
  on update to inventory_movements do instead nothing;

create or replace rule inventory_movements_no_delete as
  on delete to inventory_movements do instead nothing;

-- ── merchandise_entries ───────────────────────────────────────
create table merchandise_entries (
  id               uuid          primary key default gen_random_uuid(),
  reference        text          not null unique,  -- e.g. "ENT-2024-001"
  supplier_id      uuid          references suppliers(id) on delete set null,
  entry_date       date          not null default current_date,
  additional_costs numeric(12,2) not null default 0 check (additional_costs >= 0),
  notes            text,
  status           entry_status  not null default 'draft',
  created_by       uuid          references auth.users(id) on delete set null,
  confirmed_at     timestamptz,  -- set by confirm_merchandise_entry() RPC
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

create trigger merchandise_entries_updated_at
  before update on merchandise_entries
  for each row execute procedure touch_updated_at();

-- ── merchandise_entry_items ───────────────────────────────────
create table merchandise_entry_items (
  id                    uuid          primary key default gen_random_uuid(),
  merchandise_entry_id  uuid          not null references merchandise_entries(id) on delete cascade,
  variant_id            uuid          not null references product_variants(id),
  quantity              integer       not null check (quantity > 0),
  unit_cost             numeric(12,2) not null check (unit_cost >= 0),
  created_at            timestamptz   not null default now()
);

create index entry_items_entry_idx on merchandise_entry_items (merchandise_entry_id);
