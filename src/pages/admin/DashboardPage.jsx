import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { startOfDay, startOfWeek, startOfMonth, isAfter, isSameDay, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Wallet, Receipt, ArrowRight, Clock,
  CheckCircle2, Calendar, CalendarDays, TrendingUp,
} from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { formatPrice } from '../../lib/utils'
import { STATUS_META } from '../../lib/orderStatus'

// ── Constantes de tiempo ──────────────────────────────────────────
const NOW       = new Date()
const YESTERDAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1)
const THIS_YEAR = NOW.getFullYear()
const YEARS    = [THIS_YEAR, THIS_YEAR + 1]

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTH_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const QUICK = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: null,    label: 'Todo' },
]
const ALL_STATUSES = ['pendiente','preparando','enviado','entregado','cancelado']

// ── Filtrado ──────────────────────────────────────────────────────
function applyFilter(orders, mode, month, year, day) {
  if (!orders) return []
  const now = new Date()
  if (mode === 'today')  return orders.filter(o => isAfter(new Date(o.created_at), startOfDay(now)))
  if (mode === 'week')   return orders.filter(o => isAfter(new Date(o.created_at), startOfWeek(now, { weekStartsOn: 1 })))
  if (mode === 'month')  return orders.filter(o => isAfter(new Date(o.created_at), startOfMonth(now)))
  if (mode === 'day')    return orders.filter(o => isSameDay(new Date(o.created_at), day))
  if (mode === 'custom') return orders.filter(o => {
    const d = new Date(o.created_at)
    return d.getMonth() === month && d.getFullYear() === year
  })
  return orders
}

// Label largo de un día: "Viernes 3 de julio de 2026" (+ " · Hoy" si es hoy)
function dayLabel(d) {
  const s = format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  const cap = s.charAt(0).toUpperCase() + s.slice(1)
  return isSameDay(d, new Date()) ? `${cap} · Hoy` : cap
}
const toInputDate = (d) => format(d, 'yyyy-MM-dd')

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

const pickerVariants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' },
  show:   { opacity: 1, height: 'auto', overflow: 'visible',
            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, height: 0, overflow: 'hidden',
            transition: { duration: 0.18 } },
}

// ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [mode,        setMode]        = useState('today')
  const [picker,      setPicker]      = useState(null) // null | 'month' | 'day'
  const [customMonth, setCustomMonth] = useState(NOW.getMonth())
  const [customYear,  setCustomYear]  = useState(THIS_YEAR)
  const [customDay,   setCustomDay]   = useState(NOW)
  const [dayDraft,    setDayDraft]    = useState(toInputDate(NOW))

  const { data: orders, isLoading } = useOrders()

  const isCustom  = mode === 'custom'
  const isDay     = mode === 'day'
  const filterKey = isCustom ? `m-${customYear}-${customMonth}`
                  : isDay    ? `d-${toInputDate(customDay)}`
                  : String(mode)

  function pickQuick(val) { setMode(val); setPicker(null) }

  function pickMonth(month, year) {
    setCustomMonth(month)
    setCustomYear(year)
    setMode('custom')
    setPicker(null)
  }

  function pickDay(dateStr) {
    if (!dateStr) return
    const [y, m, d] = dateStr.split('-').map(Number)
    setCustomDay(new Date(y, m - 1, d))
    setMode('day')
    setPicker(null)
  }

  // Datos filtrados
  const inPeriod  = applyFilter(orders, mode, customMonth, customYear, customDay)
  const billable  = inPeriod.filter(o => o.status !== 'cancelado')
  const facturado = billable.reduce((n, o) => n + Number(o.total), 0)
  const pedidos   = billable.length
  const ticket    = pedidos ? Math.round(facturado / pedidos) : 0
  const pendientes = orders?.filter(o => o.status === 'pendiente').length ?? 0

  // Top productos
  const productMap = {}
  for (const o of billable)
    for (const it of o.order_items ?? [])
      productMap[it.item_name] = (productMap[it.item_name] ?? 0) + it.quantity
  const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topMax = topProducts[0]?.[1] ?? 1

  const statusCounts = ALL_STATUSES
    .map(s => ({ s, n: inPeriod.filter(o => o.status === s).length }))
    .filter(x => x.n > 0)

  // Números animados
  const animFacturado = useCountUp(facturado)
  const animTicket    = useCountUp(ticket)

  const periodLabel = isCustom
    ? `${MONTH_FULL[customMonth]} ${customYear}`
    : isDay
    ? dayLabel(customDay)
    : QUICK.find(q => q.value === mode)?.label ?? 'Todo'

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

            {/* Pills de período rápido + botón calendario */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK.map(p => {
                const on = mode === p.value
                return (
                  <button
                    key={String(p.value)}
                    onClick={() => pickQuick(p.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                    style={on
                      ? { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
                      : { background: '#fff',    color: '#6b7280',  border: '1px solid #e5e7eb' }}
                  >
                    {p.label}
                  </button>
                )
              })}

              {/* Botón selector de día */}
              <button
                onClick={() => setPicker(p => {
                  if (p === 'day') return null
                  setDayDraft(toInputDate(customDay))
                  return 'day'
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={isDay
                  ? { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
                  : { background: '#fff',    color: '#6b7280',  border: '1px solid #e5e7eb' }}
              >
                <CalendarDays size={12} />
                {isDay ? format(customDay, 'dd/MM/yy') : 'Por día'}
              </button>

              {/* Botón selector de mes/año */}
              <button
                onClick={() => setPicker(p => p === 'month' ? null : 'month')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={isCustom
                  ? { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
                  : { background: '#fff',    color: '#6b7280',  border: '1px solid #e5e7eb' }}
              >
                <Calendar size={12} />
                {isCustom ? `${MONTH_SHORT[customMonth]} ${customYear}` : 'Por mes'}
              </button>
            </div>
          </div>

          {/* ── Picker de día ── */}
          <AnimatePresence>
            {picker === 'day' && (
              <motion.div
                key="day-picker"
                variants={pickerVariants}
                initial="hidden" animate="show" exit="exit"
                className="rounded-2xl p-4"
                style={{ background: '#fff', border: '1px solid #e5e7eb' }}
              >
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>
                  Elegí un día
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dayDraft}
                    max={toInputDate(NOW)}
                    onChange={(e) => setDayDraft(e.target.value)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold min-w-0"
                    style={{ background: '#f3f4f6', color: '#1c2b36', border: '1px solid #e5e7eb' }}
                  />
                  <button
                    onClick={() => pickDay(dayDraft)}
                    disabled={!dayDraft}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: '#1d5e8c', color: '#fff' }}
                  >
                    Ver
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[
                    { label: 'Hoy',  date: NOW },
                    { label: 'Ayer', date: YESTERDAY },
                  ].map(({ label, date }) => (
                    <button
                      key={label}
                      onClick={() => pickDay(toInputDate(date))}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{ background: '#f3f4f6', color: '#374151' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Picker de mes ── */}
          <AnimatePresence>
            {picker === 'month' && (
              <motion.div
                key="month-picker"
                variants={pickerVariants}
                initial="hidden" animate="show" exit="exit"
                className="rounded-2xl p-4"
                style={{ background: '#fff', border: '1px solid #e5e7eb' }}
              >
                {/* Selector de año */}
                <div className="flex gap-2 mb-3">
                  {YEARS.map(yr => (
                    <button
                      key={yr}
                      onClick={() => setCustomYear(yr)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                      style={customYear === yr
                        ? { background: '#1c2b36', color: '#f2c14e' }
                        : { background: '#f3f4f6', color: '#6b7280' }}
                    >
                      {yr}
                    </button>
                  ))}
                </div>

                {/* Grilla 4×3 de meses */}
                <div className="grid grid-cols-4 gap-1.5">
                  {MONTH_SHORT.map((m, i) => {
                    const isFuture = customYear > THIS_YEAR ||
                                     (customYear === THIS_YEAR && i > NOW.getMonth())
                    const isSelected = isCustom && i === customMonth && customYear === (isCustom ? customYear : THIS_YEAR)
                    const isCurrent  = i === NOW.getMonth() && customYear === THIS_YEAR
                    return (
                      <button
                        key={m}
                        onClick={() => pickMonth(i, customYear)}
                        className="py-2 rounded-xl text-xs font-bold transition-all relative"
                        style={{
                          background: isSelected ? '#1d5e8c' : '#f3f4f6',
                          color: isSelected ? '#fff' : isFuture ? '#c9cdd4' : '#374151',
                        }}
                      >
                        {m}
                        {/* Punto indicador de mes actual */}
                        {isCurrent && !isSelected && (
                          <span style={{
                            position: 'absolute', bottom: 4, left: '50%',
                            transform: 'translateX(-50%)',
                            width: 4, height: 4, borderRadius: '50%',
                            background: '#1d5e8c', display: 'block',
                          }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
    </div>
  )
}
