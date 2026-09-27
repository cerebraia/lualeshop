-- ============================================================
-- 0016 — Orders due_date + order_payments void support
-- ============================================================
-- Adds fields required for accounts-receivable tracking:
--   orders.due_date          — optional payment deadline
--   order_payments.voided_at — soft-void a mistaken payment
--   order_payments.void_reason
--
-- Also adds a void_order_payment() RPC that:
--   1. Marks the payment as voided
--   2. Recalculates orders.payment_status
--   3. Logs activity
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS.

-- ── Schema additions ──────────────────────────────────────────
alter table orders
  add column if not exists due_date date;

alter table order_payments
  add column if not exists voided_at   timestamptz,
  add column if not exists void_reason text;

-- Index: quickly find orders due within N days
create index if not exists orders_due_date_idx
  on orders (due_date)
  where due_date is not null and status != 'cancelled';

-- Index: quickly find non-voided payments per order
create index if not exists order_payments_valid_idx
  on order_payments (order_id)
  where voided_at is null;

-- ── RPC: set_order_due_date ───────────────────────────────────
create or replace function set_order_due_date(p_order_id uuid, p_due_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;
  update orders set due_date = p_due_date, updated_at = now()
  where id = p_order_id;
  if not found then
    raise exception 'Order not found' using errcode = 'P0404';
  end if;
end;
$$;

revoke execute on function set_order_due_date(uuid, date) from public;
grant  execute on function set_order_due_date(uuid, date) to authenticated;

-- ── RPC: void_order_payment ───────────────────────────────────
-- Marks a payment as voided and recalculates the order's payment_status.
create or replace function void_order_payment(p_payment_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment  order_payments%rowtype;
  v_order    orders%rowtype;
  v_paid     numeric(12,2);
  v_new_status payment_status;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Void reason is required' using errcode = 'P0400';
  end if;

  -- Lock and fetch payment
  select * into v_payment from order_payments
  where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0404';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'Payment already voided' using errcode = 'P0409';
  end if;

  -- Void the payment
  update order_payments
  set voided_at = now(), void_reason = p_reason
  where id = p_payment_id;

  -- Recalculate order payment_status
  select * into v_order from orders where id = v_payment.order_id for update;

  select coalesce(sum(amount), 0) into v_paid
  from order_payments
  where order_id = v_payment.order_id and voided_at is null;

  v_new_status := case
    when v_paid >= v_order.total then 'paid'::payment_status
    when v_paid > 0              then 'partial'::payment_status
    else                              'pending'::payment_status
  end;

  update orders set payment_status = v_new_status, updated_at = now()
  where id = v_payment.order_id;

  perform log_activity('void_order_payment', 'order', v_payment.order_id,
    jsonb_build_object('payment_id', p_payment_id, 'reason', p_reason,
                       'new_status', v_new_status));

  return jsonb_build_object('ok', true, 'payment_status', v_new_status);
end;
$$;

revoke execute on function void_order_payment(uuid, text) from public;
grant  execute on function void_order_payment(uuid, text) to authenticated;
