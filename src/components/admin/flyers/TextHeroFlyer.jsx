import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C } from './flyerChrome'

// Divide una palabra larga en chunks de ~4 chars para máximo impacto visual.
export function autoSplitHeroName(name) {
  const upper = name.toUpperCase().trim()
  const words = upper.split(/\s+/).filter(Boolean)

  if (words.length === 1 && words[0].length > 6) {
    const w = words[0]
    const n = w.length <= 8
      ? 2
      : w.length <= 12
        ? Math.ceil(w.length / 4)
        : Math.ceil(w.length / 5)
    const size = Math.ceil(w.length / n)
    const chunks = []
    for (let i = 0; i < w.length; i += size) chunks.push(w.slice(i, i + size))
    return chunks.join('\n')
  }
  return words.join('\n')
}

// Font-size que hace que la línea más larga llene aprox el ancho útil.
// Titan One: ~0.63 de ancho por char a 1em.
function calcFontSize(lines) {
  const maxLen = Math.max(...lines.map(l => l.length), 1)
  const available = FLYER_W - 80  // 40px padding cada lado
  return Math.min(380, Math.max(100, Math.floor(available / (maxLen * 0.63))))
}

// Patrón de rombos SVG — más liviano que muchos polígonos
function DiamondPattern() {
  const S = 100
  const cols = Math.ceil(FLYER_W / S) + 2
  const rows = Math.ceil(FLYER_H / S) + 2
  const shapes = []
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * S + (r % 2 === 0 ? 0 : S / 2)
      const cy = r * S
      shapes.push(
        <polygon
          key={`${r}-${c}`}
          points={`${cx},${cy - S * 0.45} ${cx + S * 0.45},${cy} ${cx},${cy + S * 0.45} ${cx - S * 0.45},${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      )
    }
  }
  return (
    <svg
      width={FLYER_W} height={FLYER_H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'block' }}
    >
      {shapes}
    </svg>
  )
}

export default function TextHeroFlyer({ item, displayName }) {
  if (!item) return null

  const raw = displayName?.trim() ? displayName : autoSplitHeroName(item.name)
  const lines = raw.split(/[\n\r]+/).map(l => l.toUpperCase().trim()).filter(Boolean)
  const fontSize = calcFontSize(lines)
  const effective = calcDiscountedPrice(item.price, item.discount_pct)

  return (
    <div style={{
      width: FLYER_W,
      height: FLYER_H,
      position: 'relative',
      overflow: 'hidden',
      background: '#13527e',
    }}>

      {/* ── Capa 1: foto full-bleed ── */}
      {item.image_url && (
        <img
          src={item.image_url}
          crossOrigin="anonymous"
          alt=""
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* ── Capa 2: overlay azul de marca sobre la foto ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(19,82,126,0.72)',
      }} />

      {/* ── Capa 3: patrón de rombos ── */}
      <DiamondPattern />

      {/* ── Capa 4: vignette radial (oscurece bordes) ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, rgba(8,28,50,0.6) 100%)',
      }} />

      {/* ── Capa 5: TEXTO GIGANTE centrado ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '240px 40px 200px',
      }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: '"Titan One", serif',
              fontSize,
              lineHeight: 0.88,
              color: '#ffffff',
              textAlign: 'center',
              letterSpacing: -1,
              textShadow: '0 6px 40px rgba(0,0,0,0.55)',
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* ── Capa 6: degradados top/bottom para legibilidad ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 380,
        background: 'linear-gradient(to bottom, rgba(8,28,50,0.75) 0%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 420,
        background: 'linear-gradient(to top, rgba(8,28,50,0.85) 0%, transparent 100%)',
      }} />

      {/* ── Capa 7: logo medallón ── */}
      <div style={{
        position: 'absolute',
        top: 64,
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <div style={{
          width: 184,
          height: 184,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#fff',
          border: `5px solid ${C.amarillo}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <img
            src="/logo-source.png"
            crossOrigin="anonymous"
            alt="Celestina Cocina"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* ── Capa 8: precio + CTA ── */}
      <div style={{
        position: 'absolute',
        bottom: 72,
        left: 0,
        right: 0,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: '"Titan One", serif',
          fontSize: 112,
          color: C.amarillo,
          lineHeight: 1,
          textShadow: '0 4px 28px rgba(0,0,0,0.7)',
        }}>
          {formatPrice(effective)}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 30,
          letterSpacing: 5,
          marginTop: 18,
          textTransform: 'uppercase',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Pedí por WhatsApp
        </div>
      </div>

    </div>
  )
}
