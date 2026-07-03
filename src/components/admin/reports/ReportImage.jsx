import { forwardRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FlyerHeader, AzulejoBand, C } from '../flyers/flyerChrome'
import { formatPrice } from '../../../lib/utils'
import { STATUS_META } from '../../../lib/orderStatus'
import { FLYER_W } from '../../../lib/flyer'

function lineSubtotal(item) {
  const extra = (item.order_item_modifiers ?? []).reduce((n, m) => n + Number(m.extra_price), 0)
  return (Number(item.item_price) + extra) * item.quantity
}

function OrderCard({ order }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pendiente
  const hora = format(new Date(order.created_at), 'HH:mm')
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '24px 28px', marginBottom: 16,
      border: `1px solid ${C.azulejo}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 26, color: C.tinta }}>
            #{order.order_number} · {order.customer_name}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 17, color: C.gris, marginTop: 3 }}>
            {hora} hs · {order.customer_phone}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14,
            padding: '5px 14px', borderRadius: 999, background: meta.bg, color: meta.text,
          }}>
            {meta.label}
          </span>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 24, color: C.azul }}>
            {formatPrice(order.total)}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px dashed ${C.azulejo}`, paddingTop: 10, marginTop: 6 }}>
        {(order.order_items ?? []).map(it => {
          const mods = (it.order_item_modifiers ?? []).map(m => m.modifier_name).join(', ')
          return (
            <div key={it.id} style={{
              display: 'flex', justifyContent: 'space-between', gap: 10,
              fontFamily: 'DM Sans, sans-serif', fontSize: 17, color: C.tinta, padding: '3px 0',
            }}>
              <span>{it.quantity}x {it.item_name}{mods ? ` (${mods})` : ''}</span>
              <span style={{ flexShrink: 0, color: C.gris }}>{formatPrice(lineSubtotal(it))}</span>
            </div>
          )
        })}
      </div>

      {order.notes && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: C.gris, marginTop: 8, fontStyle: 'italic' }}>
          Nota: {order.notes}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${C.azulejo}` }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.gris }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 30, color: C.tinta, marginTop: 4 }}>
        {value}
      </div>
    </div>
  )
}

// Imagen del reporte de ventas (PNG), 1080px de ancho fijo, alto dinámico según
// la cantidad de pedidos — reusa el header de marca de los flyers.
const ReportImage = forwardRef(function ReportImage({ periodLabel, stats, orders }, ref) {
  const { facturado, pedidos, ticket } = stats
  const generadoEl = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })

  return (
    <div ref={ref} style={{ width: FLYER_W, background: '#f7f9fc', fontFamily: 'DM Sans, sans-serif' }}>
      <FlyerHeader />
      <AzulejoBand height={22} />

      <div style={{ padding: '36px 44px' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 3, textTransform: 'uppercase', color: C.azul }}>
          Reporte de ventas
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 40, color: C.tinta, marginTop: 4 }}>
          {periodLabel}
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: C.gris, marginTop: 4 }}>
          Generado el {generadoEl}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 26, marginBottom: 30 }}>
          <Kpi label="Facturado" value={formatPrice(facturado)} />
          <Kpi label="Pedidos" value={pedidos} />
          <Kpi label="Ticket prom." value={ticket ? formatPrice(ticket) : '—'} />
        </div>

        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0', fontFamily: 'DM Sans, sans-serif',
            fontSize: 20, color: C.gris,
          }}>
            Sin pedidos en este período.
          </div>
        ) : (
          orders.map(o => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  )
})

export default ReportImage
