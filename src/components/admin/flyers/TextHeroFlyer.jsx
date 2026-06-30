import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C } from './flyerChrome'

// Calcula el font-size para que la palabra más larga llene aprox. el ancho del canvas.
// Titan One tiene un ratio de ~0.62 por caracter (empírico).
function calcFontSize(words) {
  const maxLen = Math.max(...words.map(w => w.length), 1)
  return Math.min(370, Math.max(120, Math.floor(920 / (maxLen * 0.62))))
}

// Patrón geométrico de fondo — SVG inline (más confiable que CSS gradients en html-to-image)
function AzulejoBg() {
  const SIZE = 90
  const lines = []
  // Grilla de rombos con líneas diagonales sutiles
  for (let x = -SIZE; x < FLYER_W + SIZE; x += SIZE) {
    for (let y = -SIZE; y < FLYER_H + SIZE; y += SIZE) {
      lines.push(
        <polygon
          key={`${x}-${y}`}
          points={`${x},${y + SIZE / 2} ${x + SIZE / 2},${y} ${x + SIZE},${y + SIZE / 2} ${x + SIZE / 2},${y + SIZE}`}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1.2"
        />
      )
    }
  }
  return (
    <svg
      width={FLYER_W}
      height={FLYER_H}
      style={{ position: 'absolute', inset: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {lines}
    </svg>
  )
}

export default function TextHeroFlyer({ item, displayName }) {
  if (!item) return null

  const rawName = (displayName || item.name).toUpperCase()
  const words = rawName.split(/\s+/).filter(Boolean)
  const fontSize = calcFontSize(words)
  const effective = calcDiscountedPrice(item.price, item.discount_pct)

  return (
    <div style={{
      width: FLYER_W,
      height: FLYER_H,
      position: 'relative',
      overflow: 'hidden',
      background: '#15527d',
      fontFamily: 'DM Sans, sans-serif',
    }}>

      {/* Fondo geométrico */}
      <AzulejoBg />

      {/* Degradado radial — da profundidad al fondo */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(29,94,140,0.6) 0%, rgba(10,32,54,0.75) 100%)',
      }} />

      {/* ── Texto gigante ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '220px 48px 180px',
        zIndex: 1,
      }}>
        {words.map((word, i) => (
          <div
            key={i}
            style={{
              fontFamily: '"Titan One", serif',
              fontSize,
              lineHeight: 0.86,
              color: '#ffffff',
              textAlign: 'center',
              letterSpacing: -2,
              textShadow: '0 4px 32px rgba(0,0,0,0.25)',
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* ── Foto del plato con mix-blend-mode: multiply ──
           Multiply sobre blanco = conserva colores de la foto
           Multiply sobre azul oscuro = satura/oscurece el fondo             */}
      {item.image_url && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
        }}>
          <img
            src={item.image_url}
            crossOrigin="anonymous"
            alt=""
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'cover',
              mixBlendMode: 'multiply',
              filter: 'brightness(1.12) contrast(1.08)',
            }}
          />
        </div>
      )}

      {/* ── Vignette en bordes (por encima de la foto) ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(10,32,54,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Logo medallón en el top ── */}
      <div style={{
        position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
        zIndex: 4,
      }}>
        <div style={{
          width: 186, height: 186,
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

      {/* ── Precio + CTA en el bottom ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '48px 64px 80px',
        textAlign: 'center',
        zIndex: 4,
        background: 'linear-gradient(to top, rgba(10,28,48,0.88) 0%, transparent 100%)',
      }}>
        <div style={{
          fontFamily: '"Titan One", serif',
          fontSize: 108,
          color: C.amarillo,
          lineHeight: 1,
          textShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}>
          {formatPrice(effective)}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 28,
          letterSpacing: 5,
          marginTop: 16,
          textTransform: 'uppercase',
        }}>
          Pedí por WhatsApp
        </div>
      </div>

    </div>
  )
}
