-- ─────────────────────────────────────────
-- TABLA app_config
-- ─────────────────────────────────────────
create table app_config (
  key        text primary key,
  value      text not null default '',
  label      text,
  updated_at timestamptz default now()
);

-- Actualizar updated_at automáticamente
create or replace function update_app_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_config_updated_at
  before update on app_config
  for each row execute function update_app_config_timestamp();

-- RLS
alter table app_config enable row level security;

create policy "app_config_select_public"
  on app_config for select
  to anon, authenticated using (true);

create policy "app_config_update_auth"
  on app_config for update
  to authenticated using (true);

create policy "app_config_insert_auth"
  on app_config for insert
  to authenticated with check (true);

-- ─────────────────────────────────────────
-- SEED
-- ─────────────────────────────────────────
insert into app_config (key, value, label) values
  ('whatsapp_negocio', '595986818441', 'WhatsApp Celestina Cocina'),
  ('whatsapp_ajaka',   '595976444335', 'WhatsApp Ajaka (delivery)');
