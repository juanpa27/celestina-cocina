import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Wallet, Receipt, ArrowRight, Clock,
  CheckCircle2, TrendingUp, FileBarChart,
} from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { formatPrice } from '../../lib/utils'
import { STATUS_META } from '../../lib/orderStatus'
import { computeReportStats } from '../../lib/reportStats'
import PeriodFilterBar from '../../components/admin/PeriodFilterBar'
// Carga diferida: arrastra react-pdf / html-to-image, fuera del bundle eager del Dashboard.
const OrdersSummaryModal = lazy(() => import('../../components/admin/reports/OrdersSummaryModal'))

// ── Counter animado (la única animación cara de la página) ─────────
function useCountUp(target, duration = 750) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const e = 1 - (1 - p) ** 3            // ease-out cúbico
      setValue(Math.round(target * e))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// ── Variantes de animación ─────────────────────────────────────────
const rise = {
  hidden: { opacity: 0, y: 16 },
  show:   (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const filter = usePeriodFilter('today')
  const { isDay, periodLabel, filterKey } = filter
  const [showReport, setShowReport] = useState(false)

  const { data: orders, isLoading } = useOrders()

  // Datos filtrados
  const inPeriod  = filter.filterOrders(orders)
  const stats = computeReportStats(inPeriod)
  const { facturado, pedidos, ticket, topProducts, statusCounts } = stats
  const topMax = topProducts[0]?.[1] ?? 1
  const pendientes = orders?.filter(o => o.status === 'pendiente').length ?? 0

  // Números animados
  const animFacturado = useCountUp(facturado)
  const animTicket    = useCountUp(ticket)

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg,#f7f9fc 0%,#eef3f9 100%)' }}>
      <div className="p-5 max-w-3xl mx-auto flex flex-col gap-5">

        {/* ── Encabezado + filtros ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-2xl leading-tight" style={{ color: '#1c2b36' }}>Resumen</h1>
              <p className="text-xs mt-0.5 font-semibold" style={{ color: '#9ca3af' }}>{periodLabel}</p>
            </div>
          </div>

          <PeriodFilterBar filter={filter} />

          {/* Ver reporte del día */}
          {isDay && (
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.99]"
              style={{ background: '#fff', color: '#1d5e8c', border: '1.5px solid #1d5e8c' }}
            >
              <FileBarChart size={16} /> Ver reporte del día
            </button>
          )}
        </div>

        {/* ── Contenido principal ── */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(n => (
              <div key={n} className="rounded-2xl animate-pulse" style={{ height: n === 1 ? 64 : 80, background: '#e9eef3' }} />
            ))}
          </div>
        ) : (
          /* AnimatePresence con key por filterKey: re-anima el contenido al cambiar período */
          <AnimatePresence mode="wait">
            <motion.div
              key={filterKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="flex flex-col gap-4"
            >
              {/* Acceso rápido pedidos */}
              <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
                <Link
                  to="/admin/pedidos"
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform active:scale-[0.99]"
                  style={{
                    background: pendientes > 0
                      ? 'linear-gradient(100deg,#1d5e8c,#16486b)'
                      : '#1c2b36',
                    boxShadow: pendientes > 0
                      ? '0 6px 20px rgba(29,94,140,0.3)'
                      : '0 2px 10px rgba(20,40,60,0.15)',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <ShoppingBag size={22} color="#fff" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-white text-base leading-tight">Ver pedidos</p>
                    <p className="text-xs" style={{ color: '#cfe0ec' }}>
                      {pendientes > 0
                        ? `${pendientes} pendiente${pendientes > 1 ? 's' : ''} por atender`
                        : <span className="inline-flex items-center gap-1">Todo al día <CheckCircle2 size={13} /></span>
                      }
                    </p>
                  </div>
                  {pendientes > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1"
                      style={{ background: '#f2c14e', color: '#1c2b36' }}>
                      <Clock size={11} /> {pendientes}
                    </span>
                  )}
                  <ArrowRight size={18} color="#fff" className="flex-shrink-0" />
                </Link>
              </motion.div>

              {/* Hero Facturado — número cuenta desde 0 */}
              <motion.div
                variants={rise} initial="hidden" animate="show" custom={1}
                className="rounded-2xl px-5 py-5 relative overflow-hidden"
                style={{ background: '#1d5e8c', boxShadow: '0 6px 22px rgba(29,94,140,0.25)' }}
              >
                {/* Patrón decorativo azulejo */}
                <div
                  className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-[0.15]"
                  style={{ background: 'repeating-conic-gradient(#5b96bf 0% 25%, transparent 0% 50%) 0 0 / 18px 18px' }}
                />
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#cfe0ec' }}>
                  <Wallet size={13} /> Facturado · {periodLabel}
                </div>
                <p className="font-display font-bold text-white" style={{ fontSize: 32 }}>
                  {formatPrice(animFacturado)}
                </p>
                <p className="text-xs mt-1" style={{ color: '#a9c8de' }}>
                  {pedidos === 0
                    ? 'Sin ventas en este período'
                    : `${pedidos} pedido${pedidos === 1 ? '' : 's'} · no incluye cancelados`}
                </p>
              </motion.div>

              {/* KPIs secundarios */}
              <motion.div
                variants={rise} initial="hidden" animate="show" custom={2}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { icon: ShoppingBag, label: 'Pedidos',       val: pedidos,                          formatted: String(pedidos) },
                  { icon: Receipt,     label: 'Ticket prom.',  val: ticket,                           formatted: ticket ? formatPrice(animTicket) : '—' },
                ].map(({ icon: Icon, label, formatted }) => (
                  <div key={label} className="bg-white rounded-2xl p-4 flex flex-col gap-1"
                    style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                      style={{ color: '#9ca3af' }}>
                      <Icon size={13} style={{ color: '#1d5e8c' }} /> {label}
                    </div>
                    <p className="font-display font-bold text-xl" style={{ color: '#1c2b36' }}>{formatted}</p>
                  </div>
                ))}
              </motion.div>

              {/* Desglose por estado */}
              {statusCounts.length > 0 && (
                <motion.div
                  variants={rise} initial="hidden" animate="show" custom={3}
                  className="bg-white rounded-2xl p-4"
                  style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                    Por estado
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {statusCounts.map(({ s, n }) => {
                      const meta = STATUS_META[s]
                      const Icon = meta.Icon
                      return (
                        <span key={s}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: meta.bg, color: meta.text }}>
                          <Icon size={12} strokeWidth={2.5} /> {meta.label} · {n}
                        </span>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Top productos */}
              <motion.div
                variants={rise} initial="hidden" animate="show" custom={4}
                className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                  Más vendidos
                </p>

                {topProducts.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <TrendingUp size={30} style={{ color: '#e5e7eb' }} />
                    <p className="text-sm" style={{ color: '#9ca3af' }}>Sin ventas en este período.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {topProducts.map(([name, units], i) => (
                      <div key={name} className="flex items-center gap-3">
                        {/* Medalla */}
                        <span className="text-sm w-5 text-center flex-shrink-0 leading-none">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉'
                            : <span style={{ fontSize: 11, fontWeight: 700, color: '#d1d5db' }}>{i + 1}</span>}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1.5">
                            <span className="text-sm font-semibold truncate" style={{ color: '#1c2b36' }}>{name}</span>
                            <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: '#1d5e8c' }}>
                              {units} u.
                            </span>
                          </div>
                          {/* Barra animada */}
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#eef2f6' }}>
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(units / topMax) * 100}%` }}
                              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                              style={{ background: i === 0 ? '#1d5e8c' : '#5b96bf' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {showReport && (
        <Suspense fallback={null}>
          <OrdersSummaryModal
            periodLabel={periodLabel}
            orders={inPeriod}
            stats={stats}
            onClose={() => setShowReport(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
