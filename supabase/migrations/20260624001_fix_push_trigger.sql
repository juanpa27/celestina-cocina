-- 1. Habilitar pg_net (necesario para net.http_post)
create extension if not exists pg_net;

-- 2. Recrear la función con manejo de errores:
--    si la push falla por cualquier motivo, el pedido se guarda igual.
create or replace function public.handle_new_order_push()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
begin
  begin
    perform net.http_post(
      url     := 'https://imroxoqkmhwiqasponci.supabase.co/functions/v1/notify-new-order',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltcm94b3FrbWh3aXFhc3BvbmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDQ5NTEsImV4cCI6MjA5NzAyMDk1MX0.ygUztyZPayRWTtrHmjJ_JfupdA2HTKnG8pJXXDqfTtc'
      ),
      body := jsonb_build_object(
        'type',       'INSERT',
        'table',      'orders',
        'schema',     'public',
        'record',     to_jsonb(NEW),
        'old_record', null
      )
    );
  exception when others then
    -- La push nunca bloquea la creación del pedido
    raise warning '[push] notificación falló para pedido %: %', NEW.order_number, sqlerrm;
  end;
  return NEW;
end;
$$;
