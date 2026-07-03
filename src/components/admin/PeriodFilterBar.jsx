import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { NOW, THIS_YEAR, YEARS, QUICK, MONTH_SHORT, toInputDate } from '../../lib/period'

const pickerVariants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' },
  show:   { opacity: 1, height: 'auto', overflow: 'visible',
            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, height: 0, overflow: 'hidden',
            transition: { duration: 0.18 } },
}

const pillOn  = { background: '#1c2b36', color: '#f2c14e', border: '1px solid #1c2b36' }
const pillOff = { background: '#fff',    color: '#6b7280', border: '1px solid #e5e7eb' }

// Barra de filtros de período reutilizada por Dashboard y Reportes.
// `filter` = objeto devuelto por usePeriodFilter(). `allowRange` habilita el
// picker de rango de fechas (solo tiene sentido para generar reportes).
export default function PeriodFilterBar({ filter, allowRange = false }) {
  const {
    mode, picker, customMonth, customYear, customDay, rangeStart, rangeEnd,
    dayDraft, setDayDraft, rangeStartDraft, setRangeStartDraft, rangeEndDraft, setRangeEndDraft,
    togglePicker, pickQuick, pickMonth, pickDay, pickRange, setCustomYear,
    isCustom, isDay, isRange,
  } = filter

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK.map(p => {
          const on = mode === p.value
          return (
            <button
              key={String(p.value)}
              onClick={() => pickQuick(p.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
              style={on ? pillOn : pillOff}
            >
              {p.label}
            </button>
          )
        })}

        <button
          onClick={() => togglePicker('day')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
          style={isDay ? pillOn : pillOff}
        >
          <CalendarDays size={12} />
          {isDay ? format(customDay, 'dd/MM/yy') : 'Por día'}
        </button>

        <button
          onClick={() => togglePicker('month')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
          style={isCustom ? pillOn : pillOff}
        >
          <Calendar size={12} />
          {isCustom ? `${MONTH_SHORT[customMonth]} ${customYear}` : 'Por mes'}
        </button>

        {allowRange && (
          <button
            onClick={() => togglePicker('range')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
            style={isRange ? pillOn : pillOff}
          >
            <CalendarRange size={12} />
            {isRange ? `${toInputDate(rangeStart).slice(5)} → ${toInputDate(rangeEnd).slice(5)}` : 'Rango'}
          </button>
        )}
      </div>

      {/* ── Picker de día ── */}
      <AnimatePresence>
        {picker === 'day' && (
          <motion.div
            key="day-picker" variants={pickerVariants} initial="hidden" animate="show" exit="exit"
            className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}
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
              {[{ label: 'Hoy', v: toInputDate(NOW) }, { label: 'Ayer', v: toInputDate(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1)) }].map(({ label, v }) => (
                <button
                  key={label}
                  onClick={() => pickDay(v)}
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
            key="month-picker" variants={pickerVariants} initial="hidden" animate="show" exit="exit"
            className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}
          >
            <div className="flex gap-2 mb-3">
              {YEARS.map(yr => (
                <button
                  key={yr}
                  onClick={() => setCustomYear(yr)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={customYear === yr ? { background: '#1c2b36', color: '#f2c14e' } : { background: '#f3f4f6', color: '#6b7280' }}
                >
                  {yr}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_SHORT.map((m, i) => {
                const isFuture = customYear > THIS_YEAR || (customYear === THIS_YEAR && i > NOW.getMonth())
                const isSelected = isCustom && i === customMonth
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
                    {isCurrent && !isSelected && (
                      <span style={{
                        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                        width: 4, height: 4, borderRadius: '50%', background: '#1d5e8c', display: 'block',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Picker de rango (solo Reportes) ── */}
      <AnimatePresence>
        {picker === 'range' && (
          <motion.div
            key="range-picker" variants={pickerVariants} initial="hidden" animate="show" exit="exit"
            className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}
          >
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>
              Rango de fechas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={rangeStartDraft}
                max={toInputDate(NOW)}
                onChange={(e) => setRangeStartDraft(e.target.value)}
                className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold min-w-0"
                style={{ background: '#f3f4f6', color: '#1c2b36', border: '1px solid #e5e7eb' }}
              />
              <span className="text-xs font-bold flex-shrink-0" style={{ color: '#9ca3af' }}>a</span>
              <input
                type="date"
                value={rangeEndDraft}
                max={toInputDate(NOW)}
                onChange={(e) => setRangeEndDraft(e.target.value)}
                className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold min-w-0"
                style={{ background: '#f3f4f6', color: '#1c2b36', border: '1px solid #e5e7eb' }}
              />
            </div>
            <button
              onClick={() => pickRange(rangeStartDraft, rangeEndDraft)}
              disabled={!rangeStartDraft || !rangeEndDraft}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: '#1d5e8c', color: '#fff' }}
            >
              Ver rango
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
