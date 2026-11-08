create type public.app_role as enum ('owner','admin','editor','inventory_manager');
create type public.product_status as enum ('draft','published','hidden','archived');
create type public.availability_status as enum ('in_stock','out_of_stock','ask_to_confirm');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.current_role_of(_uid uuid) returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = _uid and is_active limit 1
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role and is_active)
$$;

create or replace function public.can(_uid uuid, _perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(case public.current_role_of(_uid)
    when 'owner' then true
    when 'admin' then _perm <> all (array['product:delete','admins:manage'])
    when 'editor' then _perm = any (array['product:read','product:create','product:edit','product:visibility','inventory:edit','branch:read','stats:view'])
    when 'inventory_manager' then _perm = any (array['product:read','inventory:edit','branch:read','stats:view'])
    else false end, false)
$$;

create policy "read own role or managers read all" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.can(auth.uid(),'admins:manage'));

create or replace function public.handle_first_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'owner') then
    insert into public.user_roles(user_id, role, display_name) values (new.id, 'owner', new.email);
  end if;
  return new;
end $$;
create trigger on_auth_user_first_owner after insert on auth.users
for each row execute function public.handle_first_owner();

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text not null default '',
  phone text,
  whatsapp text,
  email text,
  maps_url text,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.branches to anon, authenticated;
grant insert, update, delete on public.branches to authenticated;
grant all on public.branches to service_role;
alter table public.branches enable row level security;
create policy "public active branches" on public.branches for select to anon, authenticated
using (is_active or public.can(auth.uid(),'branch:read'));
create policy "manage branches" on public.branches for all to authenticated
using (public.can(auth.uid(),'branch:edit')) with check (public.can(auth.uid(),'branch:edit'));

create sequence public.product_code_seq;
grant usage on sequence public.product_code_seq to authenticated, service_role;
create or replace function public.next_product_code() returns text language sql volatile set search_path = public as $$
  select 'WSF-' || lpad(nextval('public.product_code_seq')::text, 6, '0')
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique default public.next_product_code(),
  name text not null,
  brand text not null,
  model text,
  description text,
  specifications jsonb not null default '{}'::jsonb,
  price numeric,
  currency text,
  images jsonb not null default '[]'::jsonb,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  search_text text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index products_identity_active on public.products (lower(trim(brand)), lower(trim(coalesce(nullif(model,''), name)))) where status <> 'archived';
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public published products" on public.products for select to anon, authenticated
using (status = 'published' or public.can(auth.uid(),'product:read'));
create policy "create products" on public.products for insert to authenticated with check (public.can(auth.uid(),'product:create'));
create policy "edit products" on public.products for update to authenticated
using (public.can(auth.uid(),'product:edit') or public.can(auth.uid(),'product:visibility'))
with check (public.can(auth.uid(),'product:edit') or public.can(auth.uid(),'product:visibility'));
create policy "delete products" on public.products for delete to authenticated using (public.can(auth.uid(),'product:delete'));

create or replace function public.products_before_write() returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if tg_op = 'UPDATE' and new.status = 'archived' and old.status <> 'archived' and auth.uid() is not null and not public.can(auth.uid(),'product:archive') then
    raise exception 'لا تملك صلاحية الأرشفة';
  end if;
  return new;
end $$;
create trigger products_before_write before insert or update on public.products for each row execute function public.products_before_write();

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  status public.availability_status not null default 'ask_to_confirm',
  quantity int,
  updated_at timestamptz not null default now(),
  unique (product_id, branch_id)
);
grant select on public.inventory to anon, authenticated;
grant insert, update, delete on public.inventory to authenticated;
grant all on public.inventory to service_role;
alter table public.inventory enable row level security;
create policy "public inventory" on public.inventory for select to anon, authenticated using (true);
create policy "manage inventory" on public.inventory for all to authenticated
using (public.can(auth.uid(),'inventory:edit')) with check (public.can(auth.uid(),'inventory:edit'));

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  cta_label text,
  cta_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.offers to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "public offers" on public.offers for select to anon, authenticated using (is_active or public.can(auth.uid(),'offers:edit'));
create policy "manage offers" on public.offers for all to authenticated
using (public.can(auth.uid(),'offers:edit')) with check (public.can(auth.uid(),'offers:edit'));

create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'الوسوف للاتصالات',
  about text not null default 'اكتشف أحدث الهواتف الذكية وتواصل مع فروع الوسوف بسهولة.',
  show_prices boolean not null default true,
  show_quantities boolean not null default false,
  currency text not null default 'ل.س',
  contact_phone text,
  contact_email text,
  contact_address text,
  whatsapp_channel_url text,
  hero_image_url text,
  updated_at timestamptz not null default now()
);
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "public settings" on public.store_settings for select to anon, authenticated using (true);
create policy "edit settings" on public.store_settings for update to authenticated
using (public.can(auth.uid(),'settings:edit')) with check (public.can(auth.uid(),'settings:edit'));

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('search','whatsapp_click','product_view')),
  term text check (char_length(term) <= 120),
  product_code text check (char_length(product_code) <= 40),
  created_at timestamptz not null default now()
);
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "anyone logs events" on public.analytics_events for insert to anon, authenticated with check (true);
create policy "staff view stats" on public.analytics_events for select to authenticated using (public.can(auth.uid(),'stats:view'));

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,
  entity text not null,
  entity_label text,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "managers read audit" on public.audit_logs for select to authenticated using (public.can(auth.uid(),'settings:edit'));

create or replace function public.write_audit() returns trigger language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  j := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.audit_logs(actor_id, actor_name, action, entity, entity_label)
  values (auth.uid(), (select display_name from public.user_roles where user_id = auth.uid()), lower(tg_op), tg_table_name,
    coalesce(j->>'name', j->>'title', j->>'store_name'));
  return null;
end $$;
create trigger audit_products after insert or update or delete on public.products for each row execute function public.write_audit();
create trigger audit_branches after insert or update or delete on public.branches for each row execute function public.write_audit();
create trigger audit_offers after insert or update or delete on public.offers for each row execute function public.write_audit();
create trigger audit_settings after update on public.store_settings for each row execute function public.write_audit();

insert into public.store_settings (id) values (1);
insert into public.branches (code, name, address, sort_order) values
  ('MAIN', 'الفرع الرئيسي', 'دمشق', 1),
  ('BR2', 'الفرع الثاني', 'دمشق', 2);