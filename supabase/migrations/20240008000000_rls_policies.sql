-- ============================================================
-- 0008 — Row Level Security Policies
-- ============================================================
-- Enable RLS on all tables and define access rules.
-- Principle: deny by default, grant explicitly.

-- ── Enable RLS on all tables ─────────────────────────────────
alter table categories              enable row level security;
alter table products                enable row level security;
alter table product_categories      enable row level security;
alter table product_images          enable row level security;
alter table product_purchase_options enable row level security;
alter table product_variants        enable row level security;
alter table inventory_levels        enable row level security;
alter table inventory_movements     enable row level security;
alter table suppliers               enable row level security;
alter table merchandise_entries     enable row level security;
alter table merchandise_entry_items enable row level security;
alter table variant_costs           enable row level security;
alter table expense_categories      enable row level security;
alter table expenses                enable row level security;
alter table store_settings          enable row level security;
alter table activity_log            enable row level security;
alter table customers               enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table order_payments          enable row level security;

-- ============================================================
-- PUBLIC (anon) READ policies
-- Only select on catalog and store config — no financial data.
-- ============================================================

-- categories: public read active only
create policy "categories_public_read"
  on categories for select
  to anon, authenticated
  using (active = true);

-- products: public read active only
create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (status = 'active');

-- product_categories: public read (for active products only — join handles the rest)
create policy "product_categories_public_read"
  on product_categories for select
  to anon, authenticated
  using (
    exists (select 1 from products where id = product_id and status = 'active')
  );

-- product_images: public read for active products
create policy "product_images_public_read"
  on product_images for select
  to anon, authenticated
  using (
    exists (select 1 from products where id = product_id and status = 'active')
  );

-- product_purchase_options: public read active options for active products
create policy "purchase_options_public_read"
  on product_purchase_options for select
  to anon, authenticated
  using (
    active = true
    and exists (select 1 from products where id = product_id and status = 'active')
  );

-- product_variants: public read active variants for active products
-- NOTE: does NOT expose cost or stock quantity — those are in separate private tables
create policy "product_variants_public_read"
  on product_variants for select
  to anon, authenticated
  using (
    active = true
    and exists (select 1 from products where id = product_id and status = 'active')
  );

-- store_settings: public read of commercial fields only
-- Admins can read all; anon reads via this policy (all columns visible but
-- sensitive values should not be in this table)
create policy "store_settings_public_read"
  on store_settings for select
  to anon, authenticated
  using (id = 1);

-- expense_categories: public read (names only, no financial data)
create policy "expense_categories_public_read"
  on expense_categories for select
  to anon, authenticated
  using (active = true);

-- ============================================================
-- ADMIN write policies for catalog
-- ============================================================

create policy "categories_admin_all"
  on categories for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "products_admin_all"
  on products for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "product_categories_admin_all"
  on product_categories for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "product_images_admin_all"
  on product_images for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "purchase_options_admin_all"
  on product_purchase_options for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "product_variants_admin_all"
  on product_variants for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

-- ============================================================
-- PRIVATE tables: admin only, no anon access
-- ============================================================

create policy "inventory_levels_admin_read"
  on inventory_levels for select
  to authenticated
  using (is_active_admin());

-- inventory_levels are written only by RPC functions (no direct INSERT/UPDATE via API)
-- The RPC runs as SECURITY DEFINER so it bypasses RLS for internal writes.

create policy "inventory_movements_admin_read"
  on inventory_movements for select
  to authenticated
  using (is_active_admin());

create policy "suppliers_admin_all"
  on suppliers for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "merchandise_entries_admin_all"
  on merchandise_entries for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "merchandise_entry_items_admin_all"
  on merchandise_entry_items for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

-- variant_costs: read-only for admins; written only by RPC
create policy "variant_costs_admin_read"
  on variant_costs for select
  to authenticated
  using (is_active_admin());

create policy "expenses_admin_all"
  on expenses for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "store_settings_owner_update"
  on store_settings for update
  to authenticated
  using (is_owner())
  with check (is_owner());

create policy "customers_admin_all"
  on customers for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "orders_admin_all"
  on orders for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "order_items_admin_all"
  on order_items for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "order_payments_admin_all"
  on order_payments for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "activity_log_admin_read"
  on activity_log for select
  to authenticated
  using (is_active_admin());

-- expense_categories: admin all
create policy "expense_categories_admin_all"
  on expense_categories for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());
