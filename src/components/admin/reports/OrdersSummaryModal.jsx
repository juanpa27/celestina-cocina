import { useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { X, FileText, ImageDown, Share2, Loader2, Receipt } from 'lucide-react'
import { useConfig } from '../../../hooks/useConfig'
import { formatPrice } from '../../../lib/utils'
import { STATUS_META } from '../../../lib/orderStatus'
import { exportFlyer, shareFlyer } from '../../../lib/flyer'
import { Ticket, DotLeaderRow, PAPER, INK, AZUL, GRIS, LINEA } from './ticketUI'
import ReportImage from './ReportImage'
import ReportDocument from './ReportDocument'

function lineSubtotal(item) {
  const extra = (item.order_item_modifiers ?? []).reduce((n, m) => n + Number(m.extra_price), 0)
  return (Number(item.item_price) + extra) * item.quantity
}

function OrderTicket({ order, rotate }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pendiente
  const hora = format(new Date(order.created_at), 'HH:mm')
  return (
    <Ticket holeColor={PAPER} rotate={rotate} punch>
      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="font-display font-bold text-[15px] truncate" style={{ color: INK }}>
              #{order.order_number} · {order.customer_name}
            </p>
            <p className="figures text-[11px] mt-0.5" style={{ color: GRIS }}>{hora} hs · {order.customer_phone}</p>
          </div>
          <span
            className="flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
            style={{ background: meta.bg, color: meta.text, transform: 'rotate(-2deg)' }}
          >
            {meta.label}
          </span>
        </div>

        <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${LINEA}` }}>
          {(order.order_items ?? []).map(it => {
            const mods = (it.order_item_modifiers ?? []).map(m => m.modifier_name).join(', ')
            return (
              <DotLeaderRow
                key={it.id}
                label={`${it.quantity}x ${it.item_name}${mods ? ` (${mods})` : ''}`}
                value={formatPrice(lineSubtotal(it))}
                bold={false}
                size={12.5}
              />
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: `1.5px solid ${INK}` }}>
          <span className="text-xs font-bold" style={{ color: INK }}>Total</span>
          <span className="figures text-sm font-bold" style={{ color: AZUL }}>{formatPrice(order.total)}</span>
        </div>

        {order.notes && (
          <p className="text-xs mt-1.5 italic" style={{ color: GRIS }}>Nota: {order.notes}</p>
        )}
      </div>
    </Ticket>
  )
}

// Modal de detalle de pedidos de un período + exportación a PDF / PNG.
// `orders` ya viene filtrado por el período elegido (usePeriodFilter). `stats`
// = computeReportStats(orders). Se abre desde el Dashboard (filtro Por día) y
// desde Reportes (cualquier período).
export default function OrdersSummaryModal({ periodLabel, orders, stats, onClose }) {
  const { data: config } = useConfig()
  const imgRef = useRef(null)
  const [busy, setBusy] = useState(null) // null | 'pdf' | 'png' | 'share'

  const logoUrl = `${window.location.origin}/logo-source.png`
  const generatedAt = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
  const fileBase = `reporte-celestina-${periodLabel}`

  async function handleDownloadPdf() {
    setBusy('pdf')
    try {
      const blob = await pdf(
        <ReportDocument
          periodLabel={periodLabel} generatedAt={generatedAt} stats={stats} orders={orders}
          logoUrl={logoUrl} whatsapp={config?.whatsapp_number}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileBase}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('No se pudo generar el PDF')
      console.error(e)
    } finally {
      setBusy(null)
    }
  }

  async function handleDownloadPng() {
    setBusy('png')
    try {
      await exportFlyer(imgRef.current, { format: 'jpg', fileName: fileBase, backgroundColor: PAPER })
    } catch (e) {
      toast.error('No se pudo generar la imagen')
      console.error(e)
    } finally {
      setBusy(null)
    }
  }

  async function handleShare() {
    setBusy('share')
    try {
      await shareFlyer(imgRef.current, { fileName: fileBase, title: `Reporte · ${periodLabel}`, backgroundColor: PAPER })
    } catch (e) {
      if (e.name !== 'AbortError') { toast.error('No se pudo compartir'); console.error(e) }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(20,30,40,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#fff', maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${LINEA}` }}>
          <div>
            <p className="font-display font-bold text-lg" style={{ color: INK }}>Pedidos</p>
            <p className="text-xs font-semibold" style={{ color: GRIS }}>{periodLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: '#f3f4f6' }} aria-label="Cerrar">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Ticket resumen (montos) */}
        <div className="px-5 pt-4 flex-shrink-0" style={{ background: PAPER }}>
          <Ticket holeColor={PAPER}>
            <div className="px-4 py-3">
              <DotLeaderRow label="Facturado" value={formatPrice(stats.facturado)} size={13} />
              <DotLeaderRow label="Pedidos" value={String(stats.pedidos)} size={13} />
              <DotLeaderRow label="Ticket promedio" value={stats.ticket ? formatPrice(stats.ticket) : '—'} size={13} />
              {stats.montoCancelado > 0 && (
                <DotLeaderRow label="Cancelado" value={formatPrice(stats.montoCancelado)} size={13} muted />
              )}
            </div>
          </Ticket>
        </div>

        {/* Lista de pedidos (espiche de tickets) */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5" style={{ background: PAPER }}>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Receipt size={30} style={{ color: '#dbe3ec' }} />
              <p className="text-sm" style={{ color: GRIS }}>Sin pedidos en este período.</p>
            </div>
          ) : (
            orders.map((o, i) => <OrderTicket key={o.id} order={o} rotate={i % 2 === 0 ? -0.5 : 0.5} />)
          )}
        </div>

        {/* Acciones de exportación */}
        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${LINEA}` }}>
          <button
            onClick={handleDownloadPdf}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: INK, color: '#fff' }}
          >
            {busy === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            PDF
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: AZUL, color: '#fff' }}
          >
            {busy === 'png' ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
            Imagen
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleShare}
              disabled={busy !== null}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: '#25D366', color: '#fff' }}
            >
              {busy === 'share' ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              Compartir
            </button>
          )}
        </div>
      </div>

      {/* Nodo off-screen usado como fuente para la exportación PNG/compartir */}
      <div style={{ position: 'fixed', top: 0, left: -99999, pointerEvents: 'none' }}>
        <ReportImage ref={imgRef} periodLabel={periodLabel} stats={stats} orders={orders} />
      </div>
    </div>
  )
}
