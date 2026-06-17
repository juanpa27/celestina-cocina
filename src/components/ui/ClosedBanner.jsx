import { Clock } from 'lucide-react'

export default function ClosedBanner() {
  return (
    <div
      className="sticky z-20 flex items-center gap-3 px-4 py-3.5"
      style={{
        top: 100, // debajo del header + tabs
        background: '#1c2b36',
        borderBottom: '3px solid #f2c14e',
      }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(242,193,78,0.15)' }}
      >
        <Clock size={18} color="#f2c14e" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm leading-tight" style={{ color: '#fff' }}>
          Estamos cerrados por ahora
        </p>
        <p className="text-xs mt-0.5 leading-snug" style={{ color: '#7c9db5' }}>
          Podés ver el menú, pero no se pueden tomar pedidos en este momento.
        </p>
      </div>
    </div>
  )
}
