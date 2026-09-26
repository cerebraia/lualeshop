-- ============================================================
-- 0014 — Default purchase options + EUR currency fix
-- ============================================================
-- Adds a single "Unidad" purchase option for the 41 products
-- that were seeded without one, so mapProduct() returns a
-- real price instead of 0.
-- Also updates store_settings to use EUR / €.
-- Idempotent: uses ON CONFLICT (product_id, label) DO NOTHING.
-- ============================================================

-- ── Default single-unit purchase options ─────────────────────
insert into product_purchase_options (product_id, label, price, unit_description, active, sort_order)
select id, 'Unidad', price_val, null, true, 0
from (values
  ('LK-001', 25),
  ('LK-002', 15),
  ('LK-004', 12),
  ('LK-006', 18),
  ('LK-007', 15),
  ('LK-008', 25),
  ('LK-009', 25),
  ('LK-010', 35),
  ('LK-011', 40),
  ('LK-012', 40),
  ('LK-013',  8),
  ('LK-017', 10),
  ('LK-018', 15),
  ('LK-019', 25),
  ('LK-020', 25),
  ('LK-021', 20),
  ('LK-022', 18),
  ('LK-023', 15),
  ('LK-024', 25),
  ('LK-025', 15),
  ('LK-026', 25),
  ('LK-027', 20),
  ('LK-028', 25),
  ('LK-029', 25),
  ('LK-030', 25),
  ('LK-031', 20),
  ('LK-032', 20),
  ('LK-033', 15),
  ('LK-034',  5),
  ('LK-035', 25),
  ('LK-036', 40),
  ('LK-037', 35),
  ('LK-038', 40),
  ('LK-039', 35),
  ('LK-040', 40),
  ('LK-041', 40),
  ('LK-042', 40),
  ('LK-043', 40),
  ('LK-044', 40),
  ('LK-045', 40),
  ('LK-046', 15)
) as v(sku_val, price_val)
join products on products.sku = v.sku_val
where not exists (
  select 1 from product_purchase_options
  where product_id = products.id
);

-- ── Fix store_settings currency to EUR ───────────────────────
update store_settings
set currency = 'EUR', currency_symbol = '€'
where id = 1;
