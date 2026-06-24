-- Trigger que dispara la Edge Function notify-new-order
-- cuando se inserta un pedido nuevo en la tabla orders.

create or replace function public.handle_new_order_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
  return NEW;
end;
$$;

create or replace trigger on_new_order_push
  after insert on public.orders
  for each row execute function public.handle_new_order_push();
