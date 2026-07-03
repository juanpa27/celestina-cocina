import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileBarChart, Wallet, ShoppingBag, Receipt, TrendingUp } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { formatPrice } from '../../lib/utils'
import { computeReportStats } from '../../lib/reportStats'
import PeriodFilterBar from '../../components/admin/PeriodFilterBar'
import OrdersSummaryModal from '../../components/admin/reports/OrdersSummaryModal'

const rise = {
  hidden: { opacity: 0, y: 16 },
  show:   (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
}

// Página de reportes: replica los filtros de período del Dashboard (+ Rango,
// útil para exportar un tramo arbitrario de fechas) y permite ver/exportar
// el resumen de pedidos del período en PDF o imagen.
export default function ReportsPage() {
  const filter = usePeriodFilter('today')
  const { periodLabel, filterKey } = filter
  const [showModal, setShowModal] = useState(false)

  const { data: orders, isLoading } = useOrders()
  const inPeriod = filter.filterOrders(orders)
  const stats = computeReportStats(inPeriod)
  const { facturado, pedidos, ticket, topProducts } = stats

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg,#f7f9fc 0%,#eef3f9 100%)' }}>
      <div className="p-5 max-w-3xl mx-auto flex flex-col gap-5">

        <div>
          <h1 className="font-display font-bold text-2xl leading-tight" style={{ color: '#1c2b36' }}>Reportes</h1>
          <p className="text-xs mt-0.5 font-semibold" style={{ color: '#9ca3af' }}>{periodLabel}</p>
        </div>

        <PeriodFilterBar filter={filter} allowRange />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2].map(n => (
              <div key={n} className="rounded-2xl animate-pulse" style={{ height: 80, background: '#e9eef3' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filterKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="flex flex-col gap-4"
            >
              {/* KPIs */}
              <motion.div variants={rise} initial="hidden" animate="show" custom={0} className="grid grid-cols-3 gap-3">
                {[
                  { icon: Wallet,      label: 'Facturado',    val: formatPrice(facturado) },
                  { icon: ShoppingBag, label: 'Pedidos',      val: String(pedidos) },
                  { icon: Receipt,     label: 'Ticket prom.', val: ticket ? formatPrice(ticket) : '—' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="bg-white rounded-2xl p-3.5 flex flex-col gap-1"
                    style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      <Icon size={12} style={{ color: '#1d5e8c' }} /> {label}
                    </div>
                    <p className="font-display font-bold text-base leading-tight" style={{ color: '#1c2b36' }}>{val}</p>
                  </div>
                ))}
              </motion.div>

              {/* Más vendidos */}
              <motion.div
                variants={rise} initial="hidden" animate="show" custom={1}
                className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Más vendidos</p>
                {topProducts.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <TrendingUp size={30} style={{ color: '#e5e7eb' }} />
                    <p className="text-sm" style={{ color: '#9ca3af' }}>Sin ventas en este período.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {topProducts.map(([name, units], i) => (
                      <div key={name} className="flex justify-between items-baseline text-sm">
                        <span className="font-semibold truncate" style={{ color: '#1c2b36' }}>{i + 1}. {name}</span>
                        <span className="font-bold flex-shrink-0 ml-2" style={{ color: '#1d5e8c' }}>{units} u.</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* CTA reporte */}
              <motion.button
                variants={rise} initial="hidden" animate="show" custom={2}
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.99]"
                style={{ background: '#1c2b36', color: '#f2c14e', boxShadow: '0 6px 20px rgba(20,40,60,0.2)' }}
              >
                <FileBarChart size={17} /> Ver reporte
              </motion.button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {showModal && (
        <OrdersSummaryModal
          periodLabel={periodLabel}
          orders={inPeriod}
          stats={stats}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
