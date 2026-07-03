import { forwardRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FlyerHeader, AzulejoBand } from '../flyers/flyerChrome'
import { formatPrice } from '../../../lib/utils'
import { STATUS_META } from '../../../lib/orderStatus'
import { FLYER_W } from '../../../lib/flyer'
import { Ticket, DotLeaderRow, PAPER, INK, AZUL, GRIS, LINEA } from './ticketUI'

function lineSubtotal(item) {
  const extra = (item.order_item_modifiers ?? []).reduce((n, m) => n + Number(m.extra_price), 0)
  return (Number(item.item_price) + extra) * item.quantity
}

// Nota: el resaltador amarillo del monto principal se arma acá con un <div>
// real (no con el ::before de `.ticket-highlight`) — html-to-image clona el
// DOM y no hay que arriesgar que un pseudo-elemento no se capture al exportar.
function Highlighted({ children }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{
        position: 'absolute', left: '-0.1em', right: '-0.14em', bottom: '0.14em', height: '0.3em',
        background: '#f2c14e', opacity: 0.55, borderRadius: 3, transform: 'rotate(-1deg)', zIndex: 0,
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </span>
  )
}

function OrderTicket({ order, rotate }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pendiente
  const hora = format(new Date(order.created_at), 'HH:mm')
  return (
    <Ticket holeColor={PAPER} rotate={rotate} punch>
      <div style={{ padding: '22px 26px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 24, color: INK }}>
              #{order.order_number} · {order.customer_name}
            </div>
            <div className="figures" style={{ fontSize: 15, color: GRIS, marginTop: 3 }}>
              {hora} hs · {order.customer_phone}
            </div>
          </div>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.4,
            padding: '5px 13px', borderRadius: 999, background: meta.bg, color: meta.text,
            transform: 'rotate(-2deg)', flexShrink: 0,
          }}>
            {meta.label.toUpperCase()}
          </span>
        </div>

        <div style={{ borderTop: `1px dashed ${LINEA}`, paddingTop: 8, marginTop: 6 }}>
          {(order.order_items ?? []).map(it => {
            const mods = (it.order_item_modifiers ?? []).map(m => m.modifier_name).join(', ')
            return (
              <DotLeaderRow
                key={it.id}
                label={`${it.quantity}x ${it.item_name}${mods ? ` (${mods})` : ''}`}
                value={formatPrice(lineSubtotal(it))}
                bold={false}
                size={16}
              />
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${INK}`, marginTop: 8, paddingTop: 8 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, color: INK }}>Total</span>
          <span className="figures" style={{ fontWeight: 700, fontSize: 20, color: AZUL }}>{formatPrice(order.total)}</span>
        </div>

        {order.notes && (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: GRIS, marginTop: 8, fontStyle: 'italic' }}>
            Nota: {order.notes}
          </div>
        )}
      </div>
    </Ticket>
  )
}

// Imagen del reporte de ventas (PNG/JPG), 1080px de ancho fijo, alto dinámico
// según la cantidad de pedidos. Mismo header de marca que los flyers +
// vocabulario visual de "recibo" (papel, perforación, cifras en Space Mono).
const ReportImage = forwardRef(function ReportImage({ periodLabel, stats, orders }, ref) {
  const { facturado, pedidos, ticket, montoCancelado } = stats
  const generadoEl = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })

  return (
    <div ref={ref} style={{ width: FLYER_W, background: PAPER, fontFamily: 'DM Sans, sans-serif' }}>
      <FlyerHeader />
      <AzulejoBand height={22} />

      <div style={{ padding: '40px 48px' }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 3, textTransform: 'uppercase', color: AZUL }}>
          Facturado · {periodLabel}
        </div>
        <div className="figures" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 68, color: INK, marginTop: 8 }}>
          <Highlighted>{formatPrice(facturado)}</Highlighted>
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, color: GRIS, marginTop: 6 }}>
          Generado el {generadoEl}
        </div>

        <div style={{ marginTop: 30, marginBottom: 34 }}>
          <Ticket holeColor={PAPER}>
            <div style={{ padding: '20px 30px' }}>
              <DotLeaderRow label="Facturado" value={formatPrice(facturado)} size={19} />
              <DotLeaderRow label="Pedidos" value={String(pedidos)} size={19} />
              <DotLeaderRow label="Ticket promedio" value={ticket ? formatPrice(ticket) : '—'} size={19} />
              {montoCancelado > 0 && (
                <DotLeaderRow label="Cancelado" value={formatPrice(montoCancelado)} size={19} muted />
              )}
            </div>
          </Ticket>
        </div>

        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0', fontFamily: 'DM Sans, sans-serif',
            fontSize: 20, color: GRIS,
          }}>
            Sin pedidos en este período.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {orders.map((o, i) => <OrderTicket key={o.id} order={o} rotate={i % 2 === 0 ? -0.5 : 0.5} />)}
          </div>
        )}
      </div>
    </div>
  )
})

export default ReportImage
