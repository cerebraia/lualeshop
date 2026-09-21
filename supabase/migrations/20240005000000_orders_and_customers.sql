-- ============================================================
-- 0005 — Orders & Customers (private)
-- ============================================================

-- ── customers ─────────────────────────────────────────────────
create table customers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  phone       text        not null,
  city        text        not null default '',
  address     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz
);

create index customers_phone_idx on customers (phone);
create index customers_name_idx on customers (name);

create trigger customers_updated_at
  before update on customers
  for each row execute procedure touch_updated_at();

-- ── orders ────────────────────────────────────────────────────
-- order_number uses a sequence for human-readable references like ORD-00001
create sequence order_number_seq start 1 increment 1;

create table orders (
  id                    uuid           primary key default gen_random_uuid(),
  order_number          text           not null unique
                          default 'ORD-' || lpad(nextval('order_number_seq')::text, 5, '0'),
  customer_id           uuid           references customers(id) on delete set null,
  customer_name_snapshot text          not null default '',  -- snapshot in case customer is deleted
  status                order_status   not null default 'new',
  payment_status        payment_status not null default 'pending',
  subtotal              numeric(12,2)  not null default 0 check (subtotal >= 0),
  total                 numeric(12,2)  not null default 0 check (total >= 0),
  notes                 text,
  inventory_deducted_at timestamptz,  -- set when confirm_order() deducts stock
  cancelled_at          timestamptz,
  created_by            uuid           references auth.users(id) on delete set null,
  created_at            timestamptz    not null default now(),
  updated_at            timestamptz    not null default now()
);

create index orders_customer_idx on orders (customer_id);
create index orders_status_idx on orders (status);
create index orders_payment_status_idx on orders (payment_status);
create index orders_created_at_idx on orders (created_at desc);

create trigger orders_updated_at
  before update on orders
  for each row execute procedure touch_updated_at();

-- ── order_items ────────────────────────────────────────────────
-- Snapshots preserve history even if product/variant is later edited or deleted.
create table order_items (
  id                    uuid           primary key default gen_random_uuid(),
  order_id              uuid           not null references orders(id) on delete cascade,
  product_id            uuid           references products(id) on delete set null,
  variant_id            uuid           references product_variants(id) on delete set null,
  -- Snapshots at time of order creation:
  product_name_snapshot text           not null,
  sku_snapshot          text           not null default '',
  option_snapshot       text,           -- purchase option label, if applicable
  size_snapshot         text           not null default '',
  color_snapshot        text,
  unit_price            numeric(12,2)  not null check (unit_price >= 0),
  quantity              integer        not null check (quantity > 0),
  unit_cost_snapshot    numeric(12,2)  not null default 0 check (unit_cost_snapshot >= 0),
  line_total            numeric(12,2)  not null
                          generated always as (unit_price * quantity) stored,
  created_at            timestamptz    not null default now()
);

create index order_items_order_idx on order_items (order_id);

-- ── order_payments ────────────────────────────────────────────
create table order_payments (
  id             uuid           primary key default gen_random_uuid(),
  order_id       uuid           not null references orders(id) on delete cascade,
  amount         numeric(12,2)  not null check (amount > 0),
  payment_date   date           not null default current_date,
  payment_method payment_method not null,
  reference      text,           -- transfer/mobile reference number
  notes          text,
  created_by     uuid           references auth.users(id) on delete set null,
  created_at     timestamptz    not null default now()
);

create index order_payments_order_idx on order_payments (order_id);
