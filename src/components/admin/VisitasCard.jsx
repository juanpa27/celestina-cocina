import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useVercelAnalytics } from '../../hooks/useVercelAnalytics'
import { summarizeVisits } from '../../lib/analyticsStats'

const TABS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
]

export default function VisitasCard() {
  const { data, isLoading, isError } = useVercelAnalytics()
  const [tab, setTab] = useState('today')

  // Sin token de Vercel configurado (o error de la API): no rompemos el dashboard, se oculta.
  if (isError) return null

  const summary = summarizeVisits(data?.days)
  const current = summary[tab]
  const last7 = (data?.days ?? []).slice(-7)
  const max = Math.max(1, ...last7.map(d => d.pageviews))

  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e9eef3', boxShadow: '0 1px 5px rgba(20,40,60,0.05)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
          <Eye size={13} style={{ color: '#1d5e8c' }} /> Visitas al menú
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors"
              style={tab === t.key ? { background: '#1d5e8c', color: '#fff' } : { background: '#f1f5f9', color: '#64748b' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-16 rounded-xl animate-pulse" style={{ background: '#e9eef3' }} />
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="font-display font-bold text-xl" style={{ color: '#1c2b36' }}>{current.pageviews}</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>vistas · {current.visitors} visitantes</p>
          </div>
          <div className="flex items-end gap-1 h-10">
            {last7.map(d => (
              <div
                key={d.date}
                className="flex-1 rounded-sm"
                style={{ height: `${Math.max(8, (d.pageviews / max) * 100)}%`, background: '#5b96bf' }}
                title={`${d.date}: ${d.pageviews} vistas`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
