-- ─────────────────────────────────────────
-- DROP (en orden inverso de dependencias)
-- ─────────────────────────────────────────
drop table if exists order_item_modifiers cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists menu_item_modifier_groups cascade;
drop table if exists modifiers cascade;
drop table if exists modifier_groups cascade;
drop table if exists menu_items cascade;
drop table if exists categories cascade;

-- ─────────────────────────────────────────
-- TABLAS
-- ─────────────────────────────────────────

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,0) not null,
  image_url text,
  notes text,
  subcategory text,
  available boolean not null default true,
  is_popular boolean default false,
  discount_pct smallint default 0 check (discount_pct is null or (discount_pct >= 0 and discount_pct <= 100)),
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  selection_type text not null default 'single'
    check (selection_type in ('single','multiple')),
  required boolean not null default false,
  sort_order int not null default 0
);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references modifier_groups(id) on delete cascade,
  name text not null,
  description text,
  extra_price numeric(12,0) not null default 0,
  sort_order int not null default 0
);

create table menu_item_modifier_groups (
  menu_item_id uuid references menu_items(id) on delete cascade,
  modifier_group_id uuid references modifier_groups(id) on delete cascade,
  primary key (menu_item_id, modifier_group_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  is_pickup boolean not null default false, -- true = retiro en el local (sin delivery, sin lat/lng)
  notes text,
  total numeric(12,0) not null,
  status text not null default 'pendiente'
    check (status in ('pendiente','preparando','enviado','entregado','cancelado')),
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,
  item_price numeric(12,0) not null,
  quantity int not null check (quantity > 0)
);

create table order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  modifier_name text not null,
  extra_price numeric(12,0) not null default 0
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
create index idx_menu_items_category on menu_items(category_id);
create index idx_modifiers_group on modifiers(group_id);
create index idx_menu_item_modifier_groups_item on menu_item_modifier_groups(menu_item_id);
create index idx_order_items_order on order_items(order_id);
create index idx_order_item_modifiers_item on order_item_modifiers(order_item_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at desc);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table categories                enable row level security;
alter table menu_items                enable row level security;
alter table modifier_groups           enable row level security;
alter table modifiers                 enable row level security;
alter table menu_item_modifier_groups enable row level security;
alter table orders                    enable row level security;
alter table order_items               enable row level security;
alter table order_item_modifiers      enable row level security;

-- categories
create policy "categories_select_public" on categories for select to anon, authenticated using (true);
create policy "categories_insert_auth"   on categories for insert to authenticated with check (true);
create policy "categories_update_auth"   on categories for update to authenticated using (true);
create policy "categories_delete_auth"   on categories for delete to authenticated using (true);

-- menu_items
create policy "menu_items_select_public" on menu_items for select to anon, authenticated using (true);
create policy "menu_items_insert_auth"   on menu_items for insert to authenticated with check (true);
create policy "menu_items_update_auth"   on menu_items for update to authenticated using (true);
create policy "menu_items_delete_auth"   on menu_items for delete to authenticated using (true);

-- modifier_groups
create policy "modifier_groups_select_public" on modifier_groups for select to anon, authenticated using (true);
create policy "modifier_groups_insert_auth"   on modifier_groups for insert to authenticated with check (true);
create policy "modifier_groups_update_auth"   on modifier_groups for update to authenticated using (true);
create policy "modifier_groups_delete_auth"   on modifier_groups for delete to authenticated using (true);

-- modifiers
create policy "modifiers_select_public" on modifiers for select to anon, authenticated using (true);
create policy "modifiers_insert_auth"   on modifiers for insert to authenticated with check (true);
create policy "modifiers_update_auth"   on modifiers for update to authenticated using (true);
create policy "modifiers_delete_auth"   on modifiers for delete to authenticated using (true);

-- menu_item_modifier_groups
create policy "mimgroups_select_public" on menu_item_modifier_groups for select to anon, authenticated using (true);
create policy "mimgroups_insert_auth"   on menu_item_modifier_groups for insert to authenticated with check (true);
create policy "mimgroups_update_auth"   on menu_item_modifier_groups for update to authenticated using (true);
create policy "mimgroups_delete_auth"   on menu_item_modifier_groups for delete to authenticated using (true);

-- orders (insert público, el resto solo auth)
create policy "orders_insert_public" on orders for insert to anon, authenticated with check (true);
create policy "orders_select_auth"   on orders for select to authenticated using (true);
create policy "orders_update_auth"   on orders for update to authenticated using (true);
create policy "orders_delete_auth"   on orders for delete to authenticated using (true);

-- order_items
create policy "order_items_insert_public" on order_items for insert to anon, authenticated with check (true);
create policy "order_items_select_auth"   on order_items for select to authenticated using (true);
create policy "order_items_update_auth"   on order_items for update to authenticated using (true);
create policy "order_items_delete_auth"   on order_items for delete to authenticated using (true);

-- order_item_modifiers
create policy "order_item_mod_insert_public" on order_item_modifiers for insert to anon, authenticated with check (true);
create policy "order_item_mod_select_auth"   on order_item_modifiers for select to authenticated using (true);
create policy "order_item_mod_update_auth"   on order_item_modifiers for update to authenticated using (true);
create policy "order_item_mod_delete_auth"   on order_item_modifiers for delete to authenticated using (true);
