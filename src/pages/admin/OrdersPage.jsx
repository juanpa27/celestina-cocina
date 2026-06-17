import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns'
import { ShoppingBag, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useOrders } from '../../hooks/useOrders'
import OrderCard from '../../components/admin/OrderCard'

const STATUS_FILTERS = [
  { value: null,         label: 'Todos' },
  { value: 'pendiente',  label: 'Pendientes' },
  { value: 'preparando', label: 'Preparando' },
  { value: 'enviado',    label: 'Enviados' },
  { value: 'entregado',  label: 'Entregados' },
  { value: 'cancelado',  label: 'Cancelados' },
]

const DATE_FILTERS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: null,    label: 'Todo' },
]

function applyDateFilter(orders, dateFilter) {
  if (!dateFilter || !orders) return orders
  const now = new Date()
  const since =
    dateFilter === 'today' ? startOfDay(now) :
    dateFilter === 'week'  ? startOfWeek(now, { weekStartsOn: 1 }) :
    dateFilter === 'month' ? startOfMonth(now) : null
  if (!since) return orders
  return orders.filter(o => isAfter(new Date(o.created_at), since))
}

// Contexto compartido — se crea una sola vez tras la primera interacción del usuario.
let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new AudioContext()
  return _audioCtx
}

function playBeep() {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch { /* ignorar */ }
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState(null)
  const [dateFilter, setDateFilter] = useState('today')
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  function unlockAudio() {
    try {
      const ctx = getAudioCtx()
      ctx.resume().then(() => {
        setAudioUnlocked(true)
        playBeep()
      }).catch(() => setAudioUnlocked(true))
    } catch {
      setAudioUnlocked(true)
    }
  }

  const onNewOrder = useCallback(order => {
    playBeep()
    toast(`🛍 Nuevo pedido #${order.order_number}`, {
      duration: 6000,
      style: { background: '#1d5e8c', color: '#fff', fontWeight: 700 },
    })
  }, [])

  const { data: orders, isLoading, error } = useOrders({ onNewOrder })

  const byDate   = applyDateFilter(orders, dateFilter)
  const visible  = statusFilter ? byDate?.filter(o => o.status === statusFilter) : byDate
  const pending  = orders?.filter(o => o.status === 'pendiente').length ?? 0

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg,#f7f9fc 0%,#eef3f9 100%)' }}>
    <div className="p-5 max-w-3xl mx-auto">

      {/* Banner desbloqueo de audio */}
      {!audioUnlocked && (
        <button
          onClick={unlockAudio}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold mb-4 transition-opacity hover:opacity-80"
          style={{ background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' }}
        >
          <BellOff size={13} />
          Tocá aquí para activar el sonido de pedidos nuevos
        </button>
      )}

      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display font-bold text-2xl" style={{ color: '#1c2b36' }}>Pedidos</h1>
        {pending > 0 && (
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse"
            style={{ background: '#f2c14e', color: '#1c2b36' }}
          >
            {pending} nuevo{pending > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filtro por fecha */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: 'none' }}>
        {DATE_FILTERS.map(f => {
          const count = applyDateFilter(orders, f.value)?.length ?? 0
          const on = dateFilter === f.value
          return (
            <button
              key={String(f.value)}
              onClick={() => setDateFilter(f.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
              style={on
                ? { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
                : { background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' }
              }
            >
              {f.label}
              <span
                className="px-1.5 rounded-full text-[10px] leading-[16px]"
                style={{ background: on ? 'rgba(242,193,78,0.2)' : '#f3f4f6', color: on ? '#f2c14e' : '#9ca3af' }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map(f => {
          const count = f.value
            ? (byDate?.filter(o => o.status === f.value).length ?? 0)
            : (byDate?.length ?? 0)
          const on = statusFilter === f.value
          return (
            <button
              key={String(f.value)}
              onClick={() => setStatusFilter(f.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
              style={on
                ? { background: '#1d5e8c', color: '#fff', border: '1px solid #1d5e8c' }
                : { background: '#fff', color: '#1d5e8c', border: '1px solid #dbe9f0' }
              }
            >
              {f.label}
              <span
                className="px-1.5 rounded-full text-[10px] leading-[16px]"
                style={{ background: on ? 'rgba(255,255,255,0.22)' : '#eaf3f8', color: on ? '#fff' : '#5b96bf' }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 rounded-2xl animate-pulse" style={{ background: '#e5e7eb' }} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-center py-12" style={{ color: '#6b7280' }}>
          Error al cargar pedidos. Recargá la página.
        </p>
      )}

      {!isLoading && !error && (
        <div className="flex flex-col gap-3 pb-4">
          {visible?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'repeating-conic-gradient(#e3edf2 0% 25%, #f2f7fb 0% 50%) 0 0 / 16px 16px' }}
              >
                <ShoppingBag size={30} style={{ color: '#5b96bf' }} />
              </div>
              <p className="text-sm text-center font-semibold" style={{ color: '#6b7280' }}>
                No hay pedidos{statusFilter ? ` "${statusFilter}"` : ''}{dateFilter ? ' en este período' : ''}.
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {visible?.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
    </div>
  )
}
