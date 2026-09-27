-- ============================================================
-- 0018 — 16 Featured Products + Manual Receivables
-- ============================================================
--
-- Part A: Configure 16 featured products with featured_order 1-16.
--         The featured_order constraint allows 1-16 (from migration 0013).
--         Keeps existing featured=true products and adds more to reach 16.
--
-- Part B: Add source + description columns to orders for manual receivables.
--         source: 'admin' (default, from dashboard) | 'manual_receivable'
--         description: free-text concept for manual receivables.
--
-- Part C: RPC create_manual_receivable — atomic order + optional initial payment.
--
-- Idempotent: uses ALTER COLUMN IF NOT EXISTS, ON CONFLICT DO NOTHING,
--             and CREATE OR REPLACE for functions.

-- ══════════════════════════════════════════════════════════════
-- A. Featured products: set 16 with featured_order 1–16
-- ══════════════════════════════════════════════════════════════

-- First, clear all existing featured_order values to assign clean sequence
update products set featured_order = null, featured = false
where true;

-- Set exactly 16 featured products with featured_order 1-16.
-- Mix of bebés (8), niñas (5), niños (3) for variety.
with featured_set (sku, ord) as (
  values
    ('LK-001',  1),  -- Chaqueta Denim con Parches (bebés)
    ('LK-009',  2),  -- Set Floral Rosa (niñas)
    ('LK-038',  3),  -- Conjunto Tie-Dye (niños)
    ('LK-002',  4),  -- Set 3 Piezas León (bebés)
    ('LK-006',  5),  -- Pijamas Enterizas Estampadas (bebés)
    ('LK-043',  6),  -- Vestido Camiseta Parches Crema (niñas)
    ('LK-010',  7),  -- Set Polo Oakland Azul (niños)
    ('LK-012',  8),  -- Set AMORE Coral (niñas)
    ('LK-019',  9),  -- Pijamas 2 Piezas Dinosaurios (bebés)
    ('LK-044', 10),  -- Set Beach Vibes Rosa (niñas)
    ('LK-036', 11),  -- Set Sunset Studios (niños)
    ('LK-007', 12),  -- Vestido Polo Rosa (bebés)
    ('LK-011', 13),  -- Vestido Camiseta Parches Fucsia (niñas)
    ('LK-008', 14),  -- Conjunto Deportivo Oliva (bebés)
    ('LK-022', 15),  -- Rompers Florales Modelo 1 (bebés)
    ('LK-035', 16)   -- Set Floral Naranja (niñas)
)
update products p
set featured = true, featured_order = fs.ord, updated_at = now()
from featured_set fs
where p.sku = fs.sku;

-- ══════════════════════════════════════════════════════════════
-- B. Manual receivables — schema additions
-- ══════════════════════════════════════════════════════════════

-- Add source to distinguish how an order was created
alter table orders
  add column if not exists source text not null default 'admin'
    check (source in ('admin', 'manual_receivable'));

-- Add description for manual receivable concept
alter table orders
  add column if not exists description text;

create index if not exists orders_source_idx on orders (source);

-- ══════════════════════════════════════════════════════════════
-- C. RPC: create_manual_receivable
-- ══════════════════════════════════════════════════════════════
-- Atomically:
--   1. Creates an order with source='manual_receivable'
--   2. Optionally registers an initial payment
-- Authorization: is_active_admin() required.

create or replace function create_manual_receivable(
  p_customer_name    text,
  p_description      text,
  p_total            numeric(12,2),
  p_due_date         date          default null,
  p_customer_id      uuid          default null,
  p_initial_payment  numeric(12,2) default null,
  p_payment_method   payment_method default 'cash',
  p_payment_date     date          default current_date,
  p_reference        text          default null,
  p_notes            text          default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id    uuid;
  v_order_num   text;
  v_cust_name   text;
  v_pay_status  payment_status;
begin
  -- Authorization
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Validate amounts
  if p_total <= 0 then
    raise exception 'Total must be positive' using errcode = 'P0400';
  end if;
  if p_initial_payment is not null then
    if p_initial_payment < 0 then
      raise exception 'Initial payment cannot be negative' using errcode = 'P0400';
    end if;
    if p_initial_payment > p_total then
      raise exception 'Initial payment (%) exceeds total (%)', p_initial_payment, p_total
        using errcode = 'P0400';
    end if;
  end if;
  if trim(p_customer_name) = '' then
    raise exception 'Customer name is required' using errcode = 'P0400';
  end if;
  if trim(p_description) = '' then
    raise exception 'Description is required' using errcode = 'P0400';
  end if;

  -- Resolve customer name snapshot
  if p_customer_id is not null then
    select name into v_cust_name from customers where id = p_customer_id;
    if not found then
      raise exception 'Customer not found' using errcode = 'P0404';
    end if;
  else
    v_cust_name := trim(p_customer_name);
  end if;

  -- Generate order number
  v_order_num := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' ||
                 upper(substring(gen_random_uuid()::text, 1, 6));

  -- Initial payment status (before any payment is registered)
  v_pay_status := 'pending'::payment_status;

  -- Create the order
  insert into orders (
    order_number, customer_id, customer_name_snapshot,
    status, payment_status, subtotal, total, due_date,
    description, source, notes, created_by
  ) values (
    v_order_num, p_customer_id, v_cust_name,
    'confirmed', v_pay_status, p_total, p_total, p_due_date,
    p_description, 'manual_receivable', p_notes, auth.uid()
  ) returning id into v_order_id;

  -- Register initial payment if provided
  if p_initial_payment is not null and p_initial_payment > 0 then
    perform register_order_payment(
      v_order_id, p_initial_payment, p_payment_method,
      p_payment_date, p_reference, p_notes
    );
  end if;

  perform log_activity('create_manual_receivable', 'order', v_order_id,
    jsonb_build_object('total', p_total, 'customer', v_cust_name));

  return jsonb_build_object('ok', true, 'order_id', v_order_id, 'order_number', v_order_num);
end;
$$;

revoke execute on function create_manual_receivable(text, text, numeric, date, uuid, numeric, payment_method, date, text, text) from public;
grant  execute on function create_manual_receivable(text, text, numeric, date, uuid, numeric, payment_method, date, text, text) to authenticated;
