import { Clock } from 'lucide-react'

export default function ClosedBanner() {
  return (
    <div
      className="flex items-center gap-3 mx-5 mt-4 px-4 py-3 rounded-xl"
      style={{
        background: '#fdf6ec',
        border: '1px solid #f0dfc0',
        borderLeft: '4px solid #d4924a',
      }}
    >
      <Clock size={16} strokeWidth={2} style={{ color: '#d4924a', flexShrink: 0 }} />
      <div className="min-w-0">
        <p className="font-semibold text-sm leading-tight" style={{ color: '#5c3d1e' }}>
          Cerrado por ahora
        </p>
        <p className="text-xs mt-0.5 leading-snug" style={{ color: '#a07850' }}>
          Podés ver el menú, pero no tomamos pedidos en este momento.
        </p>
      </div>
    </div>
  )
}
