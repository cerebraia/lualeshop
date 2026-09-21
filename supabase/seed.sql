-- ============================================================
-- Luale Kids Shop — Development Seed
-- ============================================================
-- Used by `supabase db reset` to populate a local instance.
-- Runs AFTER all migrations in supabase/migrations/.
-- The catalog data is already seeded in migration 0010.
-- This file adds development-only data: a test admin user
-- and a few sample orders/customers for local testing.

-- ── Development test user ─────────────────────────────────────
-- NOTE: `supabase db reset` auto-creates this user when configured
-- in config.toml under [auth.users]. Alternatively, use:
--   supabase auth signup --email dev@lualekids.shop --password dev12345!
-- Then promote to owner via:
--   update profiles set role = 'owner' where id = '<user_uuid>';
--
-- This seed does NOT insert into auth.users directly (not supported).

-- ── Sample customers (dev only) ───────────────────────────────
insert into customers (name, phone, city, notes) values
  ('María González',     '+58 412-5551234', 'Caracas', 'Prefiere delivery a domicilio'),
  ('Andreína Rodríguez', '+58 414-7778899', 'Caracas', ''),
  ('Carmen López',       '+58 424-3334455', 'Valencia', 'Envío por MRW')
on conflict do nothing;

-- ── Sample expenses (dev only) ────────────────────────────────
insert into expenses (expense_date, category_id, description, amount, payment_method)
select
  '2024-09-01',
  (select id from expense_categories where slug = 'merchandise'),
  'Compra de mercancía inicial — Set León y Pijamas',
  145,
  'transfer'
where not exists (select 1 from expenses where description like 'Compra de mercancía inicial%');

insert into expenses (expense_date, category_id, description, amount, payment_method)
select
  '2024-09-05',
  (select id from expense_categories where slug = 'packaging'),
  'Bolsas y cajas para empaque',
  30,
  'cash'
where not exists (select 1 from expenses where description like 'Bolsas y cajas%');

-- ── Note on inventory ─────────────────────────────────────────
-- inventory_levels and inventory_movements are intentionally empty in dev seed.
-- All 46 products have inventory_configured = false.
-- Use `supabase db reset` then the admin panel to test inventory flows.
