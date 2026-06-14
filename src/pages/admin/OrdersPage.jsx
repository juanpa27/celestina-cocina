import { useState, useCallback, useRef } from 'react'
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns'
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

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch { /* AudioContext bloqueado por el navegador */ }
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState(null)
  const [dateFilter, setDateFilter] = useState('today')

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
    <div className="p-5 max-w-3xl mx-auto">

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
        {DATE_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setDateFilter(f.value)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
            style={
              dateFilter === f.value
                ? { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
                : { background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setStatusFilter(f.value)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
            style={
              statusFilter === f.value
                ? { background: '#1d5e8c', color: '#fff', border: '1px solid #1d5e8c' }
                : { background: '#fff', color: '#1d5e8c', border: '1px solid #dbe9f0' }
            }
          >
            {f.label}
          </button>
        ))}
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
            <p className="text-sm text-center py-12" style={{ color: '#6b7280' }}>
              No hay pedidos{statusFilter ? ` con estado "${statusFilter}"` : ''}{dateFilter ? ` en este período` : ''}.
            </p>
          )}
          {visible?.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
