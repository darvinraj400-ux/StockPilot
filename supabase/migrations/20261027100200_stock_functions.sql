-- Read helpers -------------------------------------------------------------
-- These run with the caller's privileges so RLS remains in force for every
-- aggregated read.

create or replace function public.get_dashboard_summary()
returns table (
  total_active_products bigint,
  inventory_value numeric,
  low_stock_count bigint,
  out_of_stock_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*)::bigint as total_active_products,
    coalesce(sum(p.quantity_on_hand * p.cost_price), 0)::numeric as inventory_value,
    count(*) filter (where p.quantity_on_hand <= p.reorder_level)::bigint as low_stock_count,
    count(*) filter (where p.quantity_on_hand = 0)::bigint as out_of_stock_count
  from public.products p
  where p.user_id = (select auth.uid())
    and p.is_active;
$$;

create or replace function public.get_inventory_alerts(p_limit integer default 8)
returns table (
  id uuid,
  name text,
  sku text,
  unit text,
  quantity_on_hand integer,
  reorder_level integer,
  cost_price numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.sku,
    p.unit,
    p.quantity_on_hand,
    p.reorder_level,
    p.cost_price
  from public.products p
  where p.user_id = (select auth.uid())
    and p.is_active
    and p.quantity_on_hand <= p.reorder_level
  order by
    (p.quantity_on_hand = 0) desc,
    p.quantity_on_hand asc,
    p.name asc
  limit least(greatest(coalesce(p_limit, 8), 1), 50);
$$;

create or replace function public.get_daily_movement_series(p_days integer default 14)
returns table (
  day date,
  stock_in integer,
  stock_out integer,
  net integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select (current_date - (least(greatest(coalesce(p_days, 14), 1), 90) - 1)) as start_day
  ),
  days as (
    select generate_series(b.start_day, current_date, interval '1 day')::date as day
    from bounds b
  )
  select
    d.day,
    coalesce(sum(case when m.movement_type = 'stock_in' then m.quantity_delta else 0 end), 0)::integer as stock_in,
    coalesce(sum(case when m.movement_type = 'stock_out' then -m.quantity_delta else 0 end), 0)::integer as stock_out,
    coalesce(sum(m.quantity_delta), 0)::integer as net
  from days d
  left join public.stock_movements m
    on m.user_id = (select auth.uid())
    and m.created_at >= (d.day::timestamp at time zone 'UTC')
    and m.created_at < ((d.day + 1)::timestamp at time zone 'UTC')
  group by d.day
  order by d.day asc;
$$;

create or replace function public.get_category_product_counts()
returns table (
  category_id uuid,
  active_product_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.category_id, count(*)::bigint as active_product_count
  from public.products p
  where p.user_id = (select auth.uid())
    and p.is_active
    and p.category_id is not null
  group by p.category_id;
$$;

create or replace function public.get_supplier_product_counts()
returns table (
  supplier_id uuid,
  active_product_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.supplier_id, count(*)::bigint as active_product_count
  from public.products p
  where p.user_id = (select auth.uid())
    and p.is_active
    and p.supplier_id is not null
  group by p.supplier_id;
$$;

-- Transactional stock movement --------------------------------------------
-- The only sanctioned way to change products.quantity_on_hand.
-- Locks the product row, validates direction and resulting quantity, updates
-- the product and appends the audit row in a single transaction.

create or replace function public.record_stock_movement(
  p_product_id uuid,
  p_movement_type public.stock_movement_type,
  p_quantity_delta integer,
  p_note text default null
)
returns public.stock_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_product public.products%rowtype;
  v_quantity_after integer;
  v_note text;
  v_movement public.stock_movements%rowtype;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to record stock movements.'
      using errcode = '42501';
  end if;

  if p_movement_type is null then
    raise exception 'Movement type is required.'
      using errcode = '22023';
  end if;

  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'Quantity change must be a non-zero whole number.'
      using errcode = '22023';
  end if;

  if p_movement_type = 'stock_in' and p_quantity_delta < 0 then
    raise exception 'Stock-in quantity must be positive.'
      using errcode = '22023';
  end if;

  if p_movement_type = 'stock_out' and p_quantity_delta > 0 then
    raise exception 'Stock-out quantity must be negative.'
      using errcode = '22023';
  end if;

  select *
  into v_product
  from public.products p
  where p.id = p_product_id
    and p.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Product not found.'
      using errcode = 'P0002';
  end if;

  if not v_product.is_active then
    raise exception 'Archived products cannot receive stock movements.'
      using errcode = '22023';
  end if;

  v_quantity_after := v_product.quantity_on_hand + p_quantity_delta;

  if v_quantity_after < 0 then
    raise exception 'Insufficient stock: only % % on hand.',
      v_product.quantity_on_hand,
      v_product.unit
      using errcode = '22023';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');

  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'Note must be 500 characters or fewer.'
      using errcode = '22023';
  end if;

  perform set_config('stockpilot.stock_adjustment', 'on', true);

  update public.products
  set quantity_on_hand = v_quantity_after
  where id = v_product.id
    and user_id = v_user_id;

  insert into public.stock_movements (
    user_id,
    product_id,
    movement_type,
    quantity_delta,
    quantity_before,
    quantity_after,
    note
  )
  values (
    v_user_id,
    v_product.id,
    p_movement_type,
    p_quantity_delta,
    v_product.quantity_on_hand,
    v_quantity_after,
    v_note
  )
  returning * into v_movement;

  return v_movement;
end;
$$;

-- Function privileges ------------------------------------------------------

revoke all on function public.get_dashboard_summary() from public;
revoke all on function public.get_inventory_alerts(integer) from public;
revoke all on function public.get_daily_movement_series(integer) from public;
revoke all on function public.get_category_product_counts() from public;
revoke all on function public.get_supplier_product_counts() from public;
revoke all on function public.record_stock_movement(uuid, public.stock_movement_type, integer, text) from public;

grant execute on function public.get_dashboard_summary() to authenticated;
grant execute on function public.get_inventory_alerts(integer) to authenticated;
grant execute on function public.get_daily_movement_series(integer) to authenticated;
grant execute on function public.get_category_product_counts() to authenticated;
grant execute on function public.get_supplier_product_counts() to authenticated;
grant execute on function public.record_stock_movement(uuid, public.stock_movement_type, integer, text) to authenticated;

comment on function public.record_stock_movement(uuid, public.stock_movement_type, integer, text)
  is 'Atomically changes a product quantity and appends an immutable stock movement for the authenticated owner.';
