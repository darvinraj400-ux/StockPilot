-- Row Level Security and explicit API privileges.
-- Every tenant-owned table is readable and writable only by its owner.
-- Stock movements are append-only from the server's perspective: clients may
-- read them but never insert, update, or delete them directly.

alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

-- Categories ---------------------------------------------------------------

drop policy if exists categories_select_own on public.categories;
create policy categories_select_own
  on public.categories for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own
  on public.categories for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own
  on public.categories for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Suppliers ----------------------------------------------------------------

drop policy if exists suppliers_select_own on public.suppliers;
create policy suppliers_select_own
  on public.suppliers for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists suppliers_insert_own on public.suppliers;
create policy suppliers_insert_own
  on public.suppliers for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists suppliers_update_own on public.suppliers;
create policy suppliers_update_own
  on public.suppliers for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Products -----------------------------------------------------------------

drop policy if exists products_select_own on public.products;
create policy products_select_own
  on public.products for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists products_insert_own on public.products;
create policy products_insert_own
  on public.products for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists products_update_own on public.products;
create policy products_update_own
  on public.products for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Stock movements: read-only for clients. Inserts happen inside the
-- SECURITY DEFINER function below / in the stock RPC migration.
drop policy if exists stock_movements_select_own on public.stock_movements;
create policy stock_movements_select_own
  on public.stock_movements for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Privileges ---------------------------------------------------------------
-- Reset Supabase's default table grants first, then grant the smallest set of
-- permissions the application needs. No client role may delete records.

revoke all on table public.categories from anon, authenticated;
revoke all on table public.suppliers from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.stock_movements from anon, authenticated;

grant select, insert, update on table public.categories to authenticated;
grant select, insert, update on table public.suppliers to authenticated;

grant select, insert on table public.products to authenticated;
grant update (
  category_id,
  supplier_id,
  sku,
  name,
  description,
  unit,
  cost_price,
  selling_price,
  reorder_level,
  is_active
) on table public.products to authenticated;

grant select on table public.stock_movements to authenticated;
