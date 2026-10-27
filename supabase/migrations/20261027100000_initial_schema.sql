-- StockPilot initial schema
-- All tenant-owned tables key off auth.users(id). Composite foreign keys make
-- cross-tenant references impossible at the database layer.

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

do $$
begin
  create type public.stock_movement_type as enum ('stock_in', 'stock_out', 'adjustment');
exception
  when duplicate_object then null;
end
$$;

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Categories ---------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint categories_description_length check (description is null or char_length(description) <= 500),
  constraint categories_id_user_unique unique (id, user_id)
);

create unique index if not exists categories_user_name_key
  on public.categories (user_id, lower(btrim(name)));

create index if not exists categories_user_active_idx
  on public.categories (user_id, is_active);

create index if not exists categories_name_trgm_idx
  on public.categories using gin (name extensions.gin_trgm_ops);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Suppliers ----------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint suppliers_contact_name_length check (contact_name is null or char_length(contact_name) <= 120),
  constraint suppliers_email_length check (email is null or char_length(email) <= 254),
  constraint suppliers_phone_length check (phone is null or char_length(phone) <= 40),
  constraint suppliers_address_length check (address is null or char_length(address) <= 500),
  constraint suppliers_notes_length check (notes is null or char_length(notes) <= 1000),
  constraint suppliers_id_user_unique unique (id, user_id)
);

create index if not exists suppliers_user_active_idx
  on public.suppliers (user_id, is_active);

create index if not exists suppliers_name_trgm_idx
  on public.suppliers using gin (name extensions.gin_trgm_ops);

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- Products -----------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid,
  supplier_id uuid,
  sku text not null,
  name text not null,
  description text,
  unit text not null default 'unit',
  cost_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  quantity_on_hand integer not null default 0,
  reorder_level integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  needs_reorder boolean generated always as (quantity_on_hand <= reorder_level) stored,
  constraint products_sku_length check (char_length(btrim(sku)) between 1 and 64),
  constraint products_name_length check (char_length(btrim(name)) between 1 and 160),
  constraint products_description_length check (description is null or char_length(description) <= 1000),
  constraint products_unit_length check (char_length(btrim(unit)) between 1 and 32),
  constraint products_cost_price_nonnegative check (cost_price >= 0),
  constraint products_selling_price_nonnegative check (selling_price >= 0),
  constraint products_quantity_nonnegative check (quantity_on_hand >= 0),
  constraint products_reorder_level_nonnegative check (reorder_level >= 0),
  constraint products_id_user_unique unique (id, user_id),
  constraint products_category_tenant_fk foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  constraint products_supplier_tenant_fk foreign key (supplier_id, user_id)
    references public.suppliers (id, user_id) on delete restrict
);

create unique index if not exists products_user_sku_key
  on public.products (user_id, lower(btrim(sku)));

create index if not exists products_user_active_idx
  on public.products (user_id, is_active);
create index if not exists products_user_category_idx
  on public.products (user_id, category_id);
create index if not exists products_user_supplier_idx
  on public.products (user_id, supplier_id);
create index if not exists products_user_quantity_idx
  on public.products (user_id, quantity_on_hand);
create index if not exists products_name_trgm_idx
  on public.products using gin (name extensions.gin_trgm_ops);
create index if not exists products_sku_trgm_idx
  on public.products using gin (sku extensions.gin_trgm_ops);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Quantity may only change through public.record_stock_movement(), which sets
-- a transaction-local flag before updating. Even if table grants regress, a
-- direct API update cannot silently rewrite on-hand stock.
create or replace function public.protect_product_quantity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.quantity_on_hand is distinct from 0 then
      raise exception 'New products must start with a quantity of zero.'
        using errcode = '22023';
    end if;
    return new;
  end if;

  if new.quantity_on_hand is distinct from old.quantity_on_hand then
    if coalesce(current_setting('stockpilot.stock_adjustment', true), 'off') <> 'on' then
      raise exception 'On-hand quantity can only change through a stock movement.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists products_protect_quantity on public.products;
create trigger products_protect_quantity
  before insert or update on public.products
  for each row execute function public.protect_product_quantity();

-- Stock movements ----------------------------------------------------------

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null,
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null,
  quantity_before integer not null,
  quantity_after integer not null,
  note text,
  created_at timestamptz not null default now(),
  constraint stock_movements_delta_nonzero check (quantity_delta <> 0),
  constraint stock_movements_before_nonnegative check (quantity_before >= 0),
  constraint stock_movements_after_nonnegative check (quantity_after >= 0),
  constraint stock_movements_arithmetic check (quantity_after = quantity_before + quantity_delta),
  constraint stock_movements_direction check (
    (movement_type = 'stock_in' and quantity_delta > 0)
    or (movement_type = 'stock_out' and quantity_delta < 0)
    or (movement_type = 'adjustment')
  ),
  constraint stock_movements_note_length check (note is null or char_length(note) <= 500),
  constraint stock_movements_product_tenant_fk foreign key (product_id, user_id)
    references public.products (id, user_id) on delete restrict
);

create index if not exists stock_movements_user_created_idx
  on public.stock_movements (user_id, created_at desc);
create index if not exists stock_movements_product_created_idx
  on public.stock_movements (product_id, created_at desc);
create index if not exists stock_movements_user_type_created_idx
  on public.stock_movements (user_id, movement_type, created_at desc);
