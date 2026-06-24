// Edge Function: notify-new-order
// Disparada por un Database Webhook en INSERT de la tabla orders.
// Envía una push notification a todos los dispositivos suscritos.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    // El webhook de Supabase envía { type, table, schema, record, old_record }
    const order = payload.record

    if (!order) return new Response('no record', { status: 400 })

    // Configurar VAPID
    webpush.setVapidDetails(
      'mailto:jbellenzier@gmail.com',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    )

    // Cliente con service role para leer suscripciones
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')

    if (error) throw error
    if (!rows?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

    const total = Number(order.total ?? 0)
    const notification = JSON.stringify({
      title:       '🛍 Nuevo pedido',
      body:        `#${order.order_number} · ${order.customer_name} · Gs ${total.toLocaleString('es-PY')}`,
      url:         '/admin/pedidos',
      orderNumber: order.order_number,
    })

    const results = await Promise.allSettled(
      rows.map(({ id, subscription }) =>
        webpush.sendNotification(subscription, notification).catch(async err => {
          // 410 Gone = suscripción expirada → limpiar
          if (err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', id)
          }
          throw err
        })
      )
    )

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent
    console.log(`Push enviado: ${sent} ok, ${failed} fallidos`)

    return new Response(
      JSON.stringify({ sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[notify-new-order]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
