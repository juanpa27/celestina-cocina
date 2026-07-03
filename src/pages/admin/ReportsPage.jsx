import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { FileBarChart } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { formatPrice } from '../../lib/utils'
import { computeReportStats } from '../../lib/reportStats'
import { STATUS_META } from '../../lib/orderStatus'
import PeriodFilterBar from '../../components/admin/PeriodFilterBar'
import { Ticket, DotLeaderRow, PAPER, INK, AZUL, GRIS } from '../../components/admin/reports/ticketUI'
// ReportsPage ya está lazy-loaded a nivel de ruta (App.jsx) — este import
// directo no vuelve a meter react-pdf/html-to-image en el bundle público.
import OrdersSummaryModal from '../../components/admin/reports/OrdersSummaryModal'

const rise = {
  hidden: { opacity: 0, y: 14 },
  show:   (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.36, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GRIS }}>
      {children}
    </p>
  )
}

// Página de reportes — el foco es la plata (facturado, ticket promedio, cuánto
// se perdió en cancelaciones, cómo se distribuye por día/estado), no la
// cantidad de platos vendidos (esa métrica vive en "Más vendidos" del
// Dashboard). Reusa los mismos filtros de período + agrega Rango.
export default function ReportsPage() {
  const filter = usePeriodFilter('today')
  const { periodLabel, filterKey } = filter
  const [showModal, setShowModal] = useState(false)

  const { data: orders, isLoading } = useOrders()
  const inPeriod = filter.filterOrders(orders)
  const stats = computeReportStats(inPeriod)
  const { facturado, pedidos, ticket, montoCancelado, byDay, statusCounts } = stats

  return (
    <div style={{ minHeight: '100%', background: PAPER }}>
      <div className="p-5 max-w-lg mx-auto flex flex-col gap-5">

        <div>
          <h1 className="font-display font-bold text-2xl leading-tight" style={{ color: INK }}>Reportes</h1>
          <p className="text-xs mt-0.5 font-semibold" style={{ color: GRIS }}>{periodLabel}</p>
        </div>

        <PeriodFilterBar filter={filter} allowRange />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(n => (
              <div key={n} className="rounded-2xl animate-pulse" style={{ height: 90, background: '#e9eef3' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filterKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="flex flex-col gap-5"
            >
              {/* Hero: el monto facturado, resaltado */}
              <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: AZUL, letterSpacing: 2 }}>
                  Facturado
                </p>
                <p className="ticket-highlight figures font-display font-bold" style={{ fontSize: 44, color: INK, lineHeight: 1.05 }}>
                  {formatPrice(facturado)}
                </p>
                <p className="text-xs mt-1.5" style={{ color: GRIS }}>
                  {pedidos === 0 ? 'Sin ventas en este período' : `${pedidos} pedido${pedidos === 1 ? '' : 's'} · no incluye cancelados`}
                </p>
              </motion.div>

              {/* Ticket resumen */}
              <motion.div variants={rise} initial="hidden" animate="show" custom={1}>
                <Ticket holeColor={PAPER}>
                  <div className="px-5 py-4">
                    <DotLeaderRow label="Facturado" value={formatPrice(facturado)} />
                    <DotLeaderRow label="Pedidos" value={String(pedidos)} />
                    <DotLeaderRow label="Ticket promedio" value={ticket ? formatPrice(ticket) : '—'} />
                    {montoCancelado > 0 && (
                      <DotLeaderRow label="Cancelado (perdido)" value={formatPrice(montoCancelado)} muted />
                    )}
                  </div>
                </Ticket>
              </motion.div>

              {/* Facturación por día — solo si el período abarca más de un día */}
              {byDay.length > 1 && (
                <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
                  <SectionLabel>Facturación por día</SectionLabel>
                  <Ticket holeColor={PAPER}>
                    <div className="px-5 py-4">
                      {byDay.map(({ date, monto }) => (
                        <DotLeaderRow
                          key={date.toISOString()}
                          label={format(date, 'EEE d MMM', { locale: es })}
                          value={formatPrice(monto)}
                          bold={false}
                        />
                      ))}
                    </div>
                  </Ticket>
                </motion.div>
              )}

              {/* Facturación por estado */}
              {statusCounts.length > 0 && (
                <motion.div variants={rise} initial="hidden" animate="show" custom={3}>
                  <SectionLabel>Facturación por estado</SectionLabel>
                  <Ticket holeColor={PAPER}>
                    <div className="px-5 py-4">
                      {statusCounts.map(({ s, n, monto }) => (
                        <DotLeaderRow
                          key={s}
                          label={`${STATUS_META[s].label} (${n})`}
                          value={formatPrice(monto)}
                          muted={s === 'cancelado'}
                          bold={s !== 'cancelado'}
                        />
                      ))}
                    </div>
                  </Ticket>
                </motion.div>
              )}

              {/* CTA: detalle de pedidos + exportar */}
              <motion.button
                variants={rise} initial="hidden" animate="show" custom={4}
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.99]"
                style={{ background: INK, color: '#f2c14e', boxShadow: '0 6px 20px rgba(28,43,54,0.2)' }}
              >
                <FileBarChart size={17} /> Ver pedidos y exportar
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
