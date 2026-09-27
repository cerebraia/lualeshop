-- ============================================================
-- 0017 — Accounts Payable (cuentas por pagar)
-- ============================================================
-- Creates:
--   payable_status enum
--   payables       — debts Luale owes to suppliers / creditors
--   payable_payments — individual payments against a payable
--
-- RPCs:
--   create_payable(...)
--   register_payable_payment(...)  — atomic: creates expense + payment
--   void_payable_payment(...)      — voids payment + archives expense
--   cancel_payable(...)
--
-- RLS: admin/owner only. No anon access.
-- Idempotent.

-- ── Enum ─────────────────────────────────────────────────────
do $$ begin
  create type payable_status as enum ('pending', 'partial', 'paid', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ── payables ──────────────────────────────────────────────────
create table if not exists payables (
  id              uuid            primary key default gen_random_uuid(),
  supplier_id     uuid            references suppliers(id) on delete set null,
  creditor_name   text            not null,              -- free-text if no supplier
  description     text            not null,
  category_id     uuid            references expense_categories(id) on delete set null,
  original_amount numeric(12,2)   not null check (original_amount > 0),
  currency        text            not null default 'EUR',
  issue_date      date            not null default current_date,
  due_date        date,
  status          payable_status  not null default 'pending',
  notes           text,
  created_by      uuid            references auth.users(id) on delete set null,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now(),
  cancelled_at    timestamptz
);

create index if not exists payables_status_idx   on payables (status);
create index if not exists payables_due_date_idx on payables (due_date) where due_date is not null and status != 'cancelled';
create index if not exists payables_supplier_idx on payables (supplier_id) where supplier_id is not null;

create or replace trigger payables_updated_at
  before update on payables
  for each row execute procedure touch_updated_at();

-- ── payable_payments ──────────────────────────────────────────
create table if not exists payable_payments (
  id              uuid            primary key default gen_random_uuid(),
  payable_id      uuid            not null references payables(id) on delete cascade,
  amount          numeric(12,2)   not null check (amount > 0),
  payment_date    date            not null default current_date,
  payment_method  payment_method  not null,
  reference       text,
  notes           text,
  expense_id      uuid            references expenses(id) on delete set null,
  created_by      uuid            references auth.users(id) on delete set null,
  created_at      timestamptz     not null default now(),
  voided_at       timestamptz,
  void_reason     text
);

create index if not exists payable_payments_payable_idx on payable_payments (payable_id);
create index if not exists payable_payments_valid_idx   on payable_payments (payable_id) where voided_at is null;

-- ── RLS ───────────────────────────────────────────────────────
alter table payables         enable row level security;
alter table payable_payments enable row level security;

-- Only active admins/owners can access payables data
create policy "payables_admin_all"
  on payables for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

create policy "payable_payments_admin_all"
  on payable_payments for all
  to authenticated
  using (is_active_admin())
  with check (is_active_admin());

-- ── Helper: recalculate payable status ───────────────────────
create or replace function _refresh_payable_status(p_payable_id uuid)
returns payable_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable payables%rowtype;
  v_paid    numeric(12,2);
  v_new     payable_status;
begin
  select * into v_payable from payables where id = p_payable_id for update;
  if v_payable.status = 'cancelled' then return 'cancelled'; end if;

  select coalesce(sum(amount), 0) into v_paid
  from payable_payments
  where payable_id = p_payable_id and voided_at is null;

  v_new := case
    when v_paid >= v_payable.original_amount then 'paid'::payable_status
    when v_paid > 0                          then 'partial'::payable_status
    else                                          'pending'::payable_status
  end;

  update payables set status = v_new, updated_at = now() where id = p_payable_id;
  return v_new;
end;
$$;

-- ── RPC: create_payable ───────────────────────────────────────
create or replace function create_payable(
  p_creditor_name   text,
  p_description     text,
  p_original_amount numeric(12,2),
  p_issue_date      date    default current_date,
  p_due_date        date    default null,
  p_supplier_id     uuid    default null,
  p_category_id     uuid    default null,
  p_notes           text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;
  if p_original_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0400';
  end if;
  if trim(p_creditor_name) = '' then
    raise exception 'Creditor name is required' using errcode = 'P0400';
  end if;

  insert into payables (
    creditor_name, description, original_amount,
    issue_date, due_date, supplier_id, category_id, notes, created_by
  ) values (
    p_creditor_name, p_description, p_original_amount,
    p_issue_date, p_due_date, p_supplier_id, p_category_id, p_notes, auth.uid()
  ) returning id into v_id;

  perform log_activity('create_payable', 'payable', v_id,
    jsonb_build_object('creditor', p_creditor_name, 'amount', p_original_amount));

  return jsonb_build_object('ok', true, 'payable_id', v_id);
end;
$$;

revoke execute on function create_payable(text, text, numeric, date, date, uuid, uuid, text) from public;
grant  execute on function create_payable(text, text, numeric, date, date, uuid, uuid, text) to authenticated;

-- ── RPC: register_payable_payment ────────────────────────────
-- Atomic: creates payable_payment + linked expense record.
create or replace function register_payable_payment(
  p_payable_id    uuid,
  p_amount        numeric(12,2),
  p_method        payment_method,
  p_date          date   default current_date,
  p_reference     text   default null,
  p_notes         text   default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable   payables%rowtype;
  v_paid      numeric(12,2);
  v_balance   numeric(12,2);
  v_exp_id    uuid;
  v_pay_id    uuid;
  v_new_status payable_status;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = 'P0400';
  end if;

  select * into v_payable from payables where id = p_payable_id for update;
  if not found then
    raise exception 'Payable not found' using errcode = 'P0404';
  end if;
  if v_payable.status = 'cancelled' then
    raise exception 'Cannot pay a cancelled payable' using errcode = 'P0409';
  end if;

  -- Validate amount does not exceed balance
  select coalesce(sum(amount), 0) into v_paid
  from payable_payments
  where payable_id = p_payable_id and voided_at is null;

  v_balance := v_payable.original_amount - v_paid;
  if p_amount > v_balance then
    raise exception 'Payment amount (%) exceeds outstanding balance (%)',
      p_amount, v_balance using errcode = 'P0409';
  end if;

  -- Create linked expense record
  insert into expenses (
    expense_date, category_id, description, amount, payment_method,
    notes, created_by
  ) values (
    p_date,
    v_payable.category_id,
    coalesce(p_notes, 'Pago: ' || v_payable.description),
    p_amount,
    p_method,
    p_reference,
    auth.uid()
  ) returning id into v_exp_id;

  -- Create payable payment linked to the expense
  insert into payable_payments (
    payable_id, amount, payment_date, payment_method,
    reference, notes, expense_id, created_by
  ) values (
    p_payable_id, p_amount, p_date, p_method,
    p_reference, p_notes, v_exp_id, auth.uid()
  ) returning id into v_pay_id;

  -- Refresh status
  v_new_status := _refresh_payable_status(p_payable_id);

  perform log_activity('register_payable_payment', 'payable', p_payable_id,
    jsonb_build_object('payment_id', v_pay_id, 'expense_id', v_exp_id,
                       'amount', p_amount, 'new_status', v_new_status));

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_pay_id,
    'expense_id', v_exp_id,
    'status', v_new_status
  );
end;
$$;

revoke execute on function register_payable_payment(uuid, numeric, payment_method, date, text, text) from public;
grant  execute on function register_payable_payment(uuid, numeric, payment_method, date, text, text) to authenticated;

-- ── RPC: void_payable_payment ─────────────────────────────────
-- Voids a payable payment and archives the linked expense.
create or replace function void_payable_payment(p_payment_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment  payable_payments%rowtype;
  v_new_status payable_status;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Void reason is required' using errcode = 'P0400';
  end if;

  select * into v_payment from payable_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0404';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'Payment already voided' using errcode = 'P0409';
  end if;

  -- Void the payment
  update payable_payments
  set voided_at = now(), void_reason = p_reason
  where id = p_payment_id;

  -- Archive the linked expense to avoid double-counting
  if v_payment.expense_id is not null then
    update expenses
    set archived_at = now()
    where id = v_payment.expense_id and archived_at is null;
  end if;

  -- Refresh payable status
  v_new_status := _refresh_payable_status(v_payment.payable_id);

  perform log_activity('void_payable_payment', 'payable', v_payment.payable_id,
    jsonb_build_object('payment_id', p_payment_id, 'reason', p_reason,
                       'new_status', v_new_status));

  return jsonb_build_object('ok', true, 'status', v_new_status);
end;
$$;

revoke execute on function void_payable_payment(uuid, text) from public;
grant  execute on function void_payable_payment(uuid, text) to authenticated;

-- ── RPC: cancel_payable ───────────────────────────────────────
create or replace function cancel_payable(p_payable_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable payables%rowtype;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  select * into v_payable from payables where id = p_payable_id for update;
  if not found then
    raise exception 'Payable not found' using errcode = 'P0404';
  end if;
  if v_payable.status = 'cancelled' then
    raise exception 'Payable already cancelled' using errcode = 'P0409';
  end if;
  if v_payable.status = 'paid' then
    raise exception 'Cannot cancel a fully paid payable' using errcode = 'P0409';
  end if;

  update payables
  set status = 'cancelled', cancelled_at = now(), notes = coalesce(p_reason, notes), updated_at = now()
  where id = p_payable_id;

  perform log_activity('cancel_payable', 'payable', p_payable_id,
    jsonb_build_object('reason', coalesce(p_reason, '')));

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function cancel_payable(uuid, text) from public;
grant  execute on function cancel_payable(uuid, text) to authenticated;

-- ── RPC: update_payable ───────────────────────────────────────
create or replace function update_payable(
  p_payable_id      uuid,
  p_creditor_name   text   default null,
  p_description     text   default null,
  p_due_date        date   default null,
  p_notes           text   default null,
  p_clear_due_date  boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable payables%rowtype;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  select * into v_payable from payables where id = p_payable_id for update;
  if not found then raise exception 'Payable not found' using errcode = 'P0404'; end if;
  if v_payable.status in ('paid', 'cancelled') then
    raise exception 'Cannot edit a paid or cancelled payable' using errcode = 'P0409';
  end if;

  update payables set
    creditor_name = coalesce(p_creditor_name, creditor_name),
    description   = coalesce(p_description,   description),
    due_date      = case when p_clear_due_date then null else coalesce(p_due_date, due_date) end,
    notes         = coalesce(p_notes, notes),
    updated_at    = now()
  where id = p_payable_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function update_payable(uuid, text, text, date, text, boolean) from public;
grant  execute on function update_payable(uuid, text, text, date, text, boolean) to authenticated;
