-- ─────────────────────────────────────────────────────────────────
-- MIGRACIÓN: Modo "Retirar en el local" (sin delivery)
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ─────────────────────────────────────────────────────────────────

-- Nuevas claves en app_config
--   pickup_only    : 'true' / 'false'  → toggle del modo retiro (como is_open)
--   pickup_message : texto que ve el cliente en el checkout
--   pickup_address : dirección / referencia del local para retirar
insert into app_config (key, value, label) values
  ('pickup_only',    'false', 'Modo solo retiro (sin delivery)'),
  ('pickup_message', 'Hoy no hacemos delivery. Podés pasar a retirar tu pedido por el local. ¡Gracias!', 'Mensaje de retiro (checkout)'),
  ('pickup_address', '', 'Dirección del local para retiro')
on conflict (key) do nothing;

-- Marca del pedido como "retiro en el local". Aditivo, default false → no
-- afecta pedidos existentes ni el flujo de delivery normal. delivery_address se
-- mantiene NOT NULL: en retiro se le escribe un texto ("Retiro en el local" o la
-- dirección del local) y delivery_lat/lng quedan null.
alter table orders add column if not exists is_pickup boolean not null default false;
