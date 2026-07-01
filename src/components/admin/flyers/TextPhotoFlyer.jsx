import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C } from './flyerChrome'
import { autoSplitHeroName, calcFontSize, DiamondPattern } from './TextHeroFlyer'

// Variante de "Texto Hero": fondo sólido + patrón (sin foto de fondo), texto
// gigante detrás, y la foto subida flota en una franja central por encima del
// texto con los bordes superior/inferior difuminados — así cualquier foto
// (no hace falta un recorte con transparencia) queda "asomando" entre las
// letras en vez de tapar todo el cartel.
export default function TextPhotoFlyer({ item, displayName, photoUrl }) {
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
      background: '#153a5c',
    }}>

      {/* ── Capa 1: patrón geométrico sobre fondo sólido ── */}
      <DiamondPattern />

      {/* ── Capa 2: vignette suave para profundidad ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 90% 70% at 50% 42%, transparent 40%, rgba(6,20,36,0.55) 100%)',
      }} />

      {/* ── Capa 3: TEXTO GIGANTE, detrás de la foto ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '230px 40px 190px',
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
              textShadow: '0 6px 30px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* ── Capa 4: foto en tarjeta, centrada sobre el texto del medio ──
          Un fundido/máscara translúcida se ve mal con fotos de estudio de
          fondo blanco (deja un halo claro tipo caja, no funde con el azul).
          En vez de simularlo, se enmarca con borde+sombra netos: sin zona
          semitransparente, cero halo, sirve cualquier foto tal cual. */}
      {photoUrl && (
        <div style={{
          position: 'absolute',
          top: '36%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 620,
          height: 700,
          borderRadius: 36,
          overflow: 'hidden',
          border: `10px solid ${C.amarillo}`,
          boxShadow: '0 30px 70px rgba(2,10,20,0.55)',
        }}>
          <img
            src={photoUrl}
            crossOrigin="anonymous"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* ── Capa 5: logo medallón ── */}
      <div style={{
        position: 'absolute',
        top: 56,
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <div style={{
          width: 176,
          height: 176,
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

      {/* ── Capa 6: precio + CTA ── */}
      <div style={{
        position: 'absolute',
        bottom: 64,
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
