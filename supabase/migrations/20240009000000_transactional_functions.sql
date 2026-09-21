-- ============================================================
-- 0009 — Transactional RPC Functions
-- ============================================================
-- All functions:
--   - Run inside a single transaction (ATOMIC)
--   - Use SECURITY DEFINER with fixed search_path
--   - Validate authorization before doing anything
--   - Are idempotent where stated (safe to retry)
--   - Log to activity_log
--   - Revoke public execute; grant only to authenticated

-- ── Helper: log activity ──────────────────────────────────────
create or replace function log_activity(
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid default null,
  p_metadata    jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into activity_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;

-- ── 1. confirm_merchandise_entry ─────────────────────────────
-- Idempotent: calling twice on an already-confirmed entry is a no-op error.
create or replace function confirm_merchandise_entry(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry         merchandise_entries%rowtype;
  v_item          merchandise_entry_items%rowtype;
  v_prev_qty      integer;
  v_new_qty       integer;
  v_prev_avg_cost numeric(12,2);
  v_prev_qty_hand integer;
begin
  -- Authorization
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Lock the entry row to prevent concurrent confirmations
  select * into v_entry
  from merchandise_entries
  where id = p_entry_id
  for update;

  if not found then
    raise exception 'Merchandise entry not found' using errcode = 'P0404';
  end if;

  if v_entry.status = 'confirmed' then
    raise exception 'Entry already confirmed' using errcode = 'P0409';
  end if;

  if v_entry.status = 'cancelled' then
    raise exception 'Cannot confirm a cancelled entry' using errcode = 'P0409';
  end if;

  -- Process each item
  for v_item in
    select * from merchandise_entry_items where merchandise_entry_id = p_entry_id
  loop
    -- Get or initialize inventory level
    insert into inventory_levels (variant_id, quantity_on_hand)
    values (v_item.variant_id, 0)
    on conflict (variant_id) do nothing;

    select quantity_on_hand into v_prev_qty
    from inventory_levels where variant_id = v_item.variant_id for update;

    v_new_qty := v_prev_qty + v_item.quantity;

    -- Update inventory level
    update inventory_levels
    set quantity_on_hand = v_new_qty, updated_at = now()
    where variant_id = v_item.variant_id;

    -- Create movement record
    insert into inventory_movements (
      variant_id, movement_type, quantity_delta,
      previous_quantity, resulting_quantity,
      reference_type, reference_id, created_by
    ) values (
      v_item.variant_id, 'merchandise_entry', v_item.quantity,
      v_prev_qty, v_new_qty,
      'merchandise_entry', p_entry_id, auth.uid()
    );

    -- Update variant costs (weighted average)
    insert into variant_costs (variant_id, average_cost, last_cost)
    values (v_item.variant_id, v_item.unit_cost, v_item.unit_cost)
    on conflict (variant_id) do update set
      average_cost = case
        when (inventory_levels.quantity_on_hand - v_item.quantity) <= 0 then
          v_item.unit_cost
        else
          (
            (select average_cost from variant_costs vc where vc.variant_id = v_item.variant_id)
            * (inventory_levels.quantity_on_hand - v_item.quantity)
            + v_item.unit_cost * v_item.quantity
          ) / inventory_levels.quantity_on_hand
        end,
      last_cost = v_item.unit_cost,
      updated_at = now()
    from inventory_levels
    where inventory_levels.variant_id = v_item.variant_id;
  end loop;

  -- Mark entry as confirmed
  update merchandise_entries
  set status = 'confirmed', confirmed_at = now(), updated_at = now()
  where id = p_entry_id;

  perform log_activity('confirm_merchandise_entry', 'merchandise_entry', p_entry_id,
    jsonb_build_object('entry_reference', v_entry.reference));

  return jsonb_build_object('ok', true, 'entry_id', p_entry_id);
end;
$$;

-- ── 2. create_order_with_items ───────────────────────────────
create or replace function create_order_with_items(
  p_customer_id   uuid,
  p_items         jsonb,   -- [{product_id, variant_id, quantity}]
  p_notes         text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id   uuid;
  v_item       jsonb;
  v_product    products%rowtype;
  v_variant    product_variants%rowtype;
  v_price      numeric(12,2);
  v_cost       numeric(12,2);
  v_subtotal   numeric(12,2) := 0;
  v_cust_name  text := '';
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  -- Resolve customer name
  if p_customer_id is not null then
    select name into v_cust_name from customers where id = p_customer_id;
  end if;

  -- Create the order
  insert into orders (customer_id, customer_name_snapshot, notes, created_by)
  values (p_customer_id, coalesce(v_cust_name, ''), p_notes, auth.uid())
  returning id into v_order_id;

  -- Process items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from products
    where id = (v_item->>'product_id')::uuid and status = 'active';

    if not found then
      raise exception 'Product % not found or inactive', v_item->>'product_id'
        using errcode = 'P0404';
    end if;

    select * into v_variant from product_variants
    where id = (v_item->>'variant_id')::uuid and product_id = v_product.id and active = true;

    if not found then
      raise exception 'Variant % not found or inactive', v_item->>'variant_id'
        using errcode = 'P0404';
    end if;

    -- Use first active purchase option price, or product base price
    select coalesce(
      (select price from product_purchase_options
       where product_id = v_product.id and active = true
       order by sort_order limit 1),
      -- Fall back to the product's lowest purchase option, or 0 if none
      0
    ) into v_price;

    -- Get cost snapshot
    select coalesce(average_cost, 0) into v_cost
    from variant_costs where variant_id = v_variant.id;

    insert into order_items (
      order_id, product_id, variant_id,
      product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot,
      unit_price, quantity, unit_cost_snapshot
    ) values (
      v_order_id, v_product.id, v_variant.id,
      v_product.name, coalesce(v_variant.sku, v_product.sku),
      v_variant.size, v_variant.color,
      v_price, (v_item->>'quantity')::integer, v_cost
    );

    v_subtotal := v_subtotal + v_price * (v_item->>'quantity')::integer;
  end loop;

  -- Update order totals
  update orders set subtotal = v_subtotal, total = v_subtotal
  where id = v_order_id;

  perform log_activity('create_order', 'order', v_order_id,
    jsonb_build_object('item_count', jsonb_array_length(p_items)));

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

-- ── 3. confirm_order ─────────────────────────────────────────
create or replace function confirm_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   orders%rowtype;
  v_item    order_items%rowtype;
  v_prev    integer;
  v_new     integer;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0404';
  end if;

  if v_order.status != 'new' then
    raise exception 'Order cannot be confirmed from status: %', v_order.status
      using errcode = 'P0409';
  end if;

  -- Check inventory availability
  for v_item in select * from order_items where order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      select coalesce(quantity_on_hand, 0) into v_prev
      from inventory_levels where variant_id = v_item.variant_id for update;

      if v_prev < v_item.quantity then
        raise exception 'Insufficient stock for variant %. Have %, need %',
          v_item.variant_id, v_prev, v_item.quantity
          using errcode = 'P0409';
      end if;

      v_new := v_prev - v_item.quantity;

      update inventory_levels
      set quantity_on_hand = v_new, updated_at = now()
      where variant_id = v_item.variant_id;

      insert into inventory_movements (
        variant_id, movement_type, quantity_delta,
        previous_quantity, resulting_quantity,
        reference_type, reference_id, created_by
      ) values (
        v_item.variant_id, 'sale', -v_item.quantity,
        v_prev, v_new,
        'order', p_order_id, auth.uid()
      );
    end if;
  end loop;

  update orders
  set status = 'confirmed', inventory_deducted_at = now(), updated_at = now()
  where id = p_order_id;

  perform log_activity('confirm_order', 'order', p_order_id, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;

-- ── 4. cancel_order ──────────────────────────────────────────
create or replace function cancel_order(p_order_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item  order_items%rowtype;
  v_prev  integer;
  v_new   integer;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0404';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Order already cancelled' using errcode = 'P0409';
  end if;

  -- Restore inventory only if it was previously deducted
  if v_order.inventory_deducted_at is not null then
    for v_item in select * from order_items where order_id = p_order_id
    loop
      if v_item.variant_id is not null then
        select coalesce(quantity_on_hand, 0) into v_prev
        from inventory_levels where variant_id = v_item.variant_id for update;

        v_new := v_prev + v_item.quantity;

        update inventory_levels
        set quantity_on_hand = v_new, updated_at = now()
        where variant_id = v_item.variant_id;

        insert into inventory_movements (
          variant_id, movement_type, quantity_delta,
          previous_quantity, resulting_quantity,
          reference_type, reference_id, notes, created_by
        ) values (
          v_item.variant_id, 'cancellation_restore', v_item.quantity,
          v_prev, v_new,
          'order', p_order_id, p_reason, auth.uid()
        );
      end if;
    end loop;
  end if;

  update orders
  set status = 'cancelled', cancelled_at = now(),
      inventory_deducted_at = null, updated_at = now()
  where id = p_order_id;

  perform log_activity('cancel_order', 'order', p_order_id,
    jsonb_build_object('reason', coalesce(p_reason, '')));

  return jsonb_build_object('ok', true);
end;
$$;

-- ── 5. register_order_payment ────────────────────────────────
create or replace function register_order_payment(
  p_order_id      uuid,
  p_amount        numeric(12,2),
  p_method        payment_method,
  p_date          date default current_date,
  p_reference     text default null,
  p_notes         text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order      orders%rowtype;
  v_total_paid numeric(12,2);
  v_new_status payment_status;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  if p_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = 'P0400';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0404';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Cannot register payment on a cancelled order' using errcode = 'P0409';
  end if;

  insert into order_payments (order_id, amount, payment_date, payment_method, reference, notes, created_by)
  values (p_order_id, p_amount, p_date, p_method, p_reference, p_notes, auth.uid());

  select coalesce(sum(amount), 0) into v_total_paid
  from order_payments where order_id = p_order_id;

  v_new_status := case
    when v_total_paid >= v_order.total then 'paid'::payment_status
    when v_total_paid > 0 then 'partial'::payment_status
    else 'pending'::payment_status
  end;

  update orders
  set payment_status = v_new_status, updated_at = now()
  where id = p_order_id;

  perform log_activity('register_payment', 'order', p_order_id,
    jsonb_build_object('amount', p_amount, 'method', p_method, 'new_status', v_new_status));

  return jsonb_build_object('ok', true, 'payment_status', v_new_status);
end;
$$;

-- ── 6. adjust_inventory ──────────────────────────────────────
create or replace function adjust_inventory(
  p_variant_id uuid,
  p_delta      integer,
  p_reason     text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev integer;
  v_new  integer;
  v_type movement_type;
begin
  if not is_active_admin() then
    raise exception 'Unauthorized' using errcode = 'P0401';
  end if;

  if p_delta = 0 then
    raise exception 'Delta must be non-zero' using errcode = 'P0400';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Adjustment reason is required' using errcode = 'P0400';
  end if;

  insert into inventory_levels (variant_id, quantity_on_hand)
  values (p_variant_id, 0)
  on conflict (variant_id) do nothing;

  select quantity_on_hand into v_prev
  from inventory_levels where variant_id = p_variant_id for update;

  v_new := v_prev + p_delta;

  if v_new < 0 then
    raise exception 'Adjustment would result in negative stock (% + % = %)',
      v_prev, p_delta, v_new using errcode = 'P0409';
  end if;

  v_type := case when p_delta > 0 then 'adjustment_in'::movement_type
                 else 'adjustment_out'::movement_type end;

  update inventory_levels
  set quantity_on_hand = v_new, updated_at = now()
  where variant_id = p_variant_id;

  insert into inventory_movements (
    variant_id, movement_type, quantity_delta,
    previous_quantity, resulting_quantity,
    reference_type, notes, created_by
  ) values (
    p_variant_id, v_type, p_delta,
    v_prev, v_new,
    'manual', p_reason, auth.uid()
  );

  perform log_activity('adjust_inventory', 'product_variant', p_variant_id,
    jsonb_build_object('delta', p_delta, 'reason', p_reason));

  return jsonb_build_object('ok', true, 'previous', v_prev, 'new', v_new);
end;
$$;

-- ── Revoke public execute; grant to authenticated ─────────────
revoke execute on function log_activity(text, text, uuid, jsonb) from public;
revoke execute on function confirm_merchandise_entry(uuid) from public;
revoke execute on function create_order_with_items(uuid, jsonb, text) from public;
revoke execute on function confirm_order(uuid) from public;
revoke execute on function cancel_order(uuid, text) from public;
revoke execute on function register_order_payment(uuid, numeric, payment_method, date, text, text) from public;
revoke execute on function adjust_inventory(uuid, integer, text) from public;

grant execute on function confirm_merchandise_entry(uuid) to authenticated;
grant execute on function create_order_with_items(uuid, jsonb, text) to authenticated;
grant execute on function confirm_order(uuid) to authenticated;
grant execute on function cancel_order(uuid, text) to authenticated;
grant execute on function register_order_payment(uuid, numeric, payment_method, date, text, text) to authenticated;
grant execute on function adjust_inventory(uuid, integer, text) to authenticated;
