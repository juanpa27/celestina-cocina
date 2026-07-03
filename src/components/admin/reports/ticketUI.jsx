// Vocabulario visual compartido de "Reportes": la métrica que más le importa
// a la dueña es la plata, así que estas piezas imitan un recibo/comanda de
// cocina — perforación, líneas de puntos, cifras en tipografía de máquina —
// en vez del lenguaje de "tarjeta con sombra" del resto del admin. Los
// colores de fondo SÍ se mantienen iguales al resto del admin (gris/blanco
// frío, no crema/kraft) para no romper la consonancia visual entre páginas.
export const PAPER   = '#eef3f9' // fondo de Reportes — el extremo del gradient que ya usan Dashboard/Pedidos
export const TICKET  = '#ffffff' // superficie de cada ticket individual (blanco, como el resto de las cards del admin)
export const INK     = '#1c2b36'
export const AZUL    = '#1d5e8c'
export const AZUL_CL = '#5b96bf'
export const AMARILLO = '#f2c14e'
export const GRIS    = '#9ca3af'
export const LINEA   = '#e5e7eb' // hairlines/divisores — mismo gris que usa el resto del admin

// Borde perforado (arriba o abajo de un ticket) — el color de los "agujeros"
// debe coincidir con lo que hay detrás del ticket (normalmente PAPER).
export function PerfEdge({ holeColor = PAPER, position = 'top', size = 18 }) {
  const r = size / 2 - 2
  return (
    <div
      aria-hidden
      style={{
        height: size / 2,
        marginTop: position === 'bottom' ? -1 : 0,
        marginBottom: position === 'top' ? -1 : 0,
        backgroundImage: `radial-gradient(circle ${r}px at ${size / 2}px ${position === 'top' ? size / 2 : 0}px, ${holeColor} ${r}px, transparent ${r + 0.5}px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundRepeat: 'repeat-x',
        flexShrink: 0,
      }}
    />
  )
}

// Fila "etiqueta ..... valor" — la línea clásica de un recibo/factura.
export function DotLeaderRow({ label, value, muted = false, bold = true, size = 14 }) {
  const color = muted ? GRIS : INK
  return (
    <div className="flex items-end gap-1.5" style={{ padding: '3px 0' }}>
      <span style={{ color, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
      <span
        style={{
          flex: 1, height: 3, marginBottom: 3,
          backgroundImage: `radial-gradient(circle, ${muted ? '#d7dce3' : '#b7c0cc'} 1.1px, transparent 1.3px)`,
          backgroundSize: '6px 3px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left center',
        }}
      />
      <span className="figures" style={{ color, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', fontWeight: bold ? 700 : 400 }}>
        {value}
      </span>
    </div>
  )
}

// Agujero de "arrancado del espiche" — decorativo, esquina de cada ticket.
export function PunchHole({ holeColor = PAPER }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', top: 10, left: 14, width: 9, height: 9, borderRadius: '50%',
        background: holeColor, boxShadow: 'inset 0 1px 2px rgba(28,43,54,0.15)', zIndex: 2,
      }}
    />
  )
}

// Envoltorio completo de un "ticket" de papel: perforación arriba/abajo +
// superficie + sombra suave. `rotate` para el efecto de pila apilada a mano.
export function Ticket({ children, holeColor = PAPER, rotate = 0, punch = false, style }) {
  return (
    <div style={{ position: 'relative', transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}>
      {punch && <PunchHole holeColor={holeColor} />}
      <PerfEdge holeColor={holeColor} position="top" />
      <div style={{ background: TICKET, boxShadow: '0 1px 2px rgba(28,43,54,0.07), 0 5px 16px rgba(28,43,54,0.09)' }}>
        {children}
      </div>
      <PerfEdge holeColor={holeColor} position="bottom" />
    </div>
  )
}
