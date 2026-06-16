import { useState } from 'react'
import { Link } from 'react-router-dom'
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns'
import { ShoppingBag, Wallet, Receipt, ArrowRight, Clock } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { formatPrice } from '../../lib/utils'
import { STATUS_META } from '../../lib/orderStatus'

const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: null,    label: 'Todo' },
]

const ALL_STATUSES = ['pendiente', 'preparando', 'enviado', 'entregado', 'cancelado']

function applyPeriod(orders, period) {
  if (!period || !orders) return orders
  const now = new Date()
  const since =
    period === 'today' ? startOfDay(now) :
    period === 'week'  ? startOfWeek(now, { weekStartsOn: 1 }) :
    period === 'month' ? startOfMonth(now) : null
  if (!since) return orders
  return orders.filter(o => isAfter(new Date(o.created_at), since))
}

function KpiCard({ icon: Icon, label, value, accent = '#1d5e8c' }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-1" style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
        <Icon size={13} style={{ color: accent }} /> {label}
      </div>
      <p className="font-display font-bold text-xl" style={{ color: '#1c2b36' }}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('today')
  const { data: orders, isLoading } = useOrders()

  const inPeriod = applyPeriod(orders, period) ?? []
  const billable = inPeriod.filter(o => o.status !== 'cancelado')

  const facturado = billable.reduce((n, o) => n + Number(o.total), 0)
  const pedidos = billable.length
  const ticket = pedidos ? Math.round(facturado / pedidos) : 0
  // Pendientes es un dato "de ahora": no se filtra por período.
  const pendientes = orders?.filter(o => o.status === 'pendiente').length ?? 0

  // Top productos por unidades vendidas en el período (excluye cancelados).
  const productMap = {}
  for (const o of billable) {
    for (const it of o.order_items ?? []) {
      productMap[it.item_name] = (productMap[it.item_name] ?? 0) + it.quantity
    }
  }
  const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topMax = topProducts[0]?.[1] ?? 1

  const statusCounts = ALL_STATUSES
    .map(s => ({ s, n: inPeriod.filter(o => o.status === s).length }))
    .filter(x => x.n > 0)

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg,#f7f9fc 0%,#eef3f9 100%)' }}>
      <div className="p-5 max-w-3xl mx-auto flex flex-col gap-5">

        {/* Encabezado + período */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl" style={{ color: '#1c2b36' }}>Resumen</h1>
          <div className="flex gap-1.5">
            {PERIODS.map(p => {
              const on = period === p.value
              return (
                <button
                  key={String(p.value)}
                  onClick={() => setPeriod(p.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
                  style={on
                    ? { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
                    : { background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' }
                  }
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-20 rounded-2xl animate-pulse" style={{ background: '#e5e7eb' }} />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3].map(n => <div key={n} className="h-20 rounded-2xl animate-pulse" style={{ background: '#e5e7eb' }} />)}
            </div>
          </div>
        ) : (
          <>
            {/* Acceso rápido a pedidos */}
            <Link
              to="/admin/pedidos"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform active:scale-[0.99]"
              style={{
                background: pendientes > 0 ? 'linear-gradient(100deg,#1d5e8c,#16486b)' : '#1c2b36',
                boxShadow: pendientes > 0 ? '0 6px 20px rgba(29,94,140,0.3)' : '0 2px 10px rgba(20,40,60,0.15)',
              }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <ShoppingBag size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-white text-base leading-tight">Ver pedidos</p>
                <p className="text-xs" style={{ color: '#cfe0ec' }}>
                  {pendientes > 0
                    ? `${pendientes} pendiente${pendientes > 1 ? 's' : ''} por atender`
                    : 'Todo al día 🎉'}
                </p>
              </div>
              {pendientes > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1" style={{ background: '#f2c14e', color: '#1c2b36' }}>
                  <Clock size={11} /> {pendientes}
                </span>
              )}
              <ArrowRight size={18} className="text-white flex-shrink-0" />
            </Link>

            {/* KPI hero: Facturado */}
            <div
              className="rounded-2xl px-5 py-5 relative overflow-hidden"
              style={{ background: '#1d5e8c', boxShadow: '0 6px 22px rgba(29,94,140,0.25)' }}
            >
              <div
                className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20"
                style={{ background: 'repeating-conic-gradient(#5b96bf 0% 25%, transparent 0% 50%) 0 0 / 18px 18px' }}
              />
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#cfe0ec' }}>
                <Wallet size={13} /> Facturado
              </div>
              <p className="font-display font-bold text-white text-3xl">{formatPrice(facturado)}</p>
              <p className="text-xs mt-1" style={{ color: '#a9c8de' }}>
                {pedidos} pedido{pedidos === 1 ? '' : 's'} · no incluye cancelados
              </p>
            </div>

            {/* KPIs secundarios */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard icon={ShoppingBag} label="Pedidos" value={pedidos} />
              <KpiCard icon={Receipt} label="Ticket promedio" value={formatPrice(ticket)} />
            </div>

            {/* Desglose por estado */}
            {statusCounts.length > 0 && (
              <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Pedidos por estado</p>
                <div className="flex flex-wrap gap-2">
                  {statusCounts.map(({ s, n }) => {
                    const meta = STATUS_META[s]
                    const Icon = meta.Icon
                    return (
                      <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: meta.bg, color: meta.text }}>
                        <Icon size={12} strokeWidth={2.5} /> {meta.label} · {n}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Top productos */}
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Más vendidos</p>
              {topProducts.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#9ca3af' }}>Sin ventas en este período.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {topProducts.map(([name, units]) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-semibold truncate" style={{ color: '#1c2b36' }}>{name}</span>
                          <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: '#1d5e8c' }}>{units} u.</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#eef2f6' }}>
                          <div className="h-full rounded-full" style={{ width: `${(units / topMax) * 100}%`, background: '#5b96bf' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
