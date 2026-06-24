-- ─────────────────────────────────────────────────────────────────
-- MIGRACIÓN: Método de pago — transferencia
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ─────────────────────────────────────────────────────────────────

-- Nuevas claves en app_config
insert into app_config (key, value, label) values
  ('payment_name',         '', 'Nombre del titular de la transferencia'),
  ('payment_alias',        '', 'Alias (CI o celular)'),
  ('payment_bank',         '', 'Entidad bancaria'),
  ('payment_bank_logo_url','', 'URL del logo del banco')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────
-- STORAGE: Bucket "logos" (crear manualmente en Supabase Dashboard)
-- ─────────────────────────────────────────────────────────────────
-- 1. Ir a Storage > New bucket
-- 2. Nombre: logos
-- 3. Marcar como "Public bucket"
-- 4. Guardar
--
-- Políticas sugeridas (ejecutar aquí después de crear el bucket):

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'logos');

create policy "logos_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logos');

create policy "logos_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'logos');
