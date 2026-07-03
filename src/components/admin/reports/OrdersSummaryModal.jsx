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
import ReportImage from './ReportImage'
import ReportDocument from './ReportDocument'

function lineSubtotal(item) {
  const extra = (item.order_item_modifiers ?? []).reduce((n, m) => n + Number(m.extra_price), 0)
  return (Number(item.item_price) + extra) * item.quantity
}

function OrderRow({ order }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pendiente
  const hora = format(new Date(order.created_at), 'HH:mm')
  return (
    <div className="rounded-xl p-3.5" style={{ background: '#f7f9fc', border: '1px solid #e9eef3' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold text-sm truncate" style={{ color: '#1c2b36' }}>
            #{order.order_number} · {order.customer_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{hora} hs · {order.customer_phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: meta.bg, color: meta.text }}>
            {meta.label}
          </span>
          <span className="text-sm font-bold" style={{ color: '#1d5e8c' }}>{formatPrice(order.total)}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 flex flex-col gap-0.5" style={{ borderTop: '1px dashed #e5e7eb' }}>
        {(order.order_items ?? []).map(it => {
          const mods = (it.order_item_modifiers ?? []).map(m => m.modifier_name).join(', ')
          return (
            <div key={it.id} className="flex justify-between gap-2 text-xs" style={{ color: '#4b5563' }}>
              <span className="truncate">{it.quantity}x {it.item_name}{mods ? ` (${mods})` : ''}</span>
              <span className="flex-shrink-0" style={{ color: '#9ca3af' }}>{formatPrice(lineSubtotal(it))}</span>
            </div>
          )
        })}
      </div>
      {order.notes && (
        <p className="text-xs mt-1.5 italic" style={{ color: '#9ca3af' }}>Nota: {order.notes}</p>
      )}
    </div>
  )
}

// Modal de resumen de pedidos de un período + exportación a PDF / PNG.
// `orders` ya viene filtrado por el período elegido (usePeriodFilter). `stats`
// = computeReportStats(orders).
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
      await exportFlyer(imgRef.current, { format: 'jpg', fileName: fileBase })
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
      await shareFlyer(imgRef.current, { fileName: fileBase, title: `Reporte · ${periodLabel}` })
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
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e9eef3' }}>
          <div>
            <p className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>Resumen de pedidos</p>
            <p className="text-xs font-semibold" style={{ color: '#9ca3af' }}>{periodLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: '#f3f4f6' }} aria-label="Cerrar">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #e9eef3' }}>
          {[
            { label: 'Facturado', val: formatPrice(stats.facturado) },
            { label: 'Pedidos', val: String(stats.pedidos) },
            { label: 'Ticket prom.', val: stats.ticket ? formatPrice(stats.ticket) : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl px-2.5 py-2" style={{ background: '#f7f9fc' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{label}</p>
              <p className="font-display font-bold text-sm mt-0.5" style={{ color: '#1c2b36' }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Lista de pedidos */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Receipt size={30} style={{ color: '#e5e7eb' }} />
              <p className="text-sm" style={{ color: '#9ca3af' }}>Sin pedidos en este período.</p>
            </div>
          ) : (
            orders.map(o => <OrderRow key={o.id} order={o} />)
          )}
        </div>

        {/* Acciones de exportación */}
        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e9eef3' }}>
          <button
            onClick={handleDownloadPdf}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: '#1c2b36', color: '#fff' }}
          >
            {busy === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            PDF
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: '#1d5e8c', color: '#fff' }}
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
