import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

const COLORS = {
  pageviews: '#0f6fb0', // vistas — azul de marca, saturado para que se vea nítido en un trazo fino
  visitors: '#2f8f6e',  // visitantes — verde, separado del azul (ver validate_palette.js)
}

const shortDay = (iso) => format(parseISO(iso), 'd MMM', { locale: es })
const fullDay = (iso) => {
  const s = format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: '#1c2b36', boxShadow: '0 8px 24px rgba(20,40,60,0.25)' }}>
      <p className="text-[11px] font-bold mb-1.5" style={{ color: '#a9c8de' }}>{fullDay(label)}</p>
      <div className="flex flex-col gap-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2.5 h-0.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="font-bold text-white tabular-nums">{p.value}</span>
            <span style={{ color: '#94a3b8' }}>{p.dataKey === 'pageviews' ? 'vistas' : 'visitantes'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Punto visible solo en el último día (hoy) — ancla visual, como el "Today" del ejemplo de Vercel.
function makeEndDot(color) {
  return (props) => {
    const { cx, cy, index, points } = props
    if (index !== points.length - 1) return null
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
  }
}

export default function VisitasChart({ days }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={days} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDay}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={{ stroke: '#eef2f6' }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="pageviews"
          stroke={COLORS.pageviews}
          strokeWidth={2}
          dot={makeEndDot(COLORS.pageviews)}
          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="visitors"
          stroke={COLORS.visitors}
          strokeWidth={2}
          dot={makeEndDot(COLORS.visitors)}
          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export { COLORS }
