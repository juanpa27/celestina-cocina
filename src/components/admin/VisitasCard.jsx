import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Table2 } from 'lucide-react'
import { useVercelAnalytics } from '../../hooks/useVercelAnalytics'
import { sliceLastNDays, sumRange } from '../../lib/analyticsStats'
import VisitasChart, { COLORS } from './VisitasChart'

const RANGES = [
  { key: 7, label: '7D' },
  { key: 14, label: '14D' },
  { key: 30, label: '30D' },
]

const LEGEND = [
  { key: 'pageviews', label: 'Vistas', color: COLORS.pageviews },
  { key: 'visitors', label: 'Visitantes', color: COLORS.visitors },
]

export default function VisitasCard() {
  const { data, isLoading, isError } = useVercelAnalytics()
  const [range, setRange] = useState(14)
  const [showTable, setShowTable] = useState(false)

  // Sin token de Vercel configurado todavía (o falla la API): no rompemos el dashboard, se oculta.
  if (isError) return null

  const days = sliceLastNDays(data?.days ?? [], range)
  const totals = sumRange(days)

  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
          <Eye size={13} style={{ color: '#1d5e8c' }} /> Visitas al menú
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors"
              style={range === r.key ? { background: '#1d5e8c', color: '#fff' } : { background: '#f1f5f9', color: '#64748b' }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-44 rounded-xl animate-pulse" style={{ background: '#e9eef3' }} />
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <Eye size={26} style={{ color: '#e5e7eb' }} />
          <p className="text-sm" style={{ color: '#9ca3af' }}>Todavía no hay datos de visitas.</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-4 mb-2">
            <div>
              <p className="font-display font-bold text-xl leading-tight" style={{ color: '#1c2b36' }}>{totals.pageviews}</p>
              <p className="text-[11px]" style={{ color: '#9ca3af' }}>vistas</p>
            </div>
            <div>
              <p className="font-display font-bold text-xl leading-tight" style={{ color: '#1c2b36' }}>{totals.visitors}</p>
              <p className="text-[11px]" style={{ color: '#9ca3af' }}>visitantes</p>
            </div>
          </div>

          <VisitasChart days={days} />

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              {LEGEND.map(l => (
                <div key={l.key} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#64748b' }}>
                  <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTable(s => !s)}
              className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: '#9ca3af' }}
            >
              <Table2 size={12} /> {showTable ? 'Ocultar tabla' : 'Ver tabla'}
            </button>
          </div>

          {showTable && (
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid #eef2f6' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th className="text-left px-3 py-1.5 font-bold" style={{ color: '#9ca3af' }}>Día</th>
                    <th className="text-right px-3 py-1.5 font-bold" style={{ color: '#9ca3af' }}>Vistas</th>
                    <th className="text-right px-3 py-1.5 font-bold" style={{ color: '#9ca3af' }}>Visitantes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...days].reverse().map(d => (
                    <tr key={d.date} style={{ borderTop: '1px solid #eef2f6' }}>
                      <td className="px-3 py-1.5 tabular-nums" style={{ color: '#1c2b36' }}>
                        {format(parseISO(d.date), "d MMM", { locale: es })}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold" style={{ color: '#1c2b36' }}>{d.pageviews}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold" style={{ color: '#1c2b36' }}>{d.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
