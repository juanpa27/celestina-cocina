import { Flame } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, PhotoPlaceholder } from './flyerChrome'

const MAX_ITEMS = 4

function pickItems(items = []) {
  return [...items]
    .filter(i => i.available !== false)
    .sort((a, b) => {
      const score = i => (i.is_popular ? 2 : 0) + (i.discount_pct > 0 ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, MAX_ITEMS)
}

function GridCell({ item }) {
  if (!item) {
    return (
      <div style={{ flex: 1, background: '#1a2838', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PhotoPlaceholder />
      </div>
    )
  }

  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {item.image_url
        ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: C.azulejo }}><PhotoPlaceholder /></div>}

      {/* Degradado inferior */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(to bottom, transparent, rgba(28,43,54,0.97))',
      }} />

      {/* Badges arriba */}
      {hasDiscount && (
        <div style={{
          position: 'absolute', top: 18, left: 18,
          background: C.amarillo, color: C.tinta,
          fontWeight: 800, fontSize: 26, padding: '7px 16px', borderRadius: 999,
        }}>
          {item.discount_pct}% OFF
        </div>
      )}
      {item.is_popular && (
        <div style={{
          position: 'absolute', top: 18, right: 18,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(242,193,78,0.95)', color: C.tinta,
          fontWeight: 700, fontSize: 22, padding: '6px 14px', borderRadius: 999,
        }}>
          <Flame size={18} strokeWidth={2.5} /> Top
        </div>
      )}

      {/* Texto abajo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 28px' }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 700,
          color: '#fff', fontSize: 38, lineHeight: 1.1, marginBottom: 8,
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          {item.name}
        </div>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 700,
          color: C.amarillo, fontSize: 34,
        }}>
          {formatPrice(effective)}
        </div>
      </div>
    </div>
  )
}

export default function CategoryFlyer({ category }) {
  if (!category) return null
  const picked = pickItems(category.items)

  // Siempre 4 slots para que el grid quede completo
  const slots = [0, 1, 2, 3].map(i => picked[i] ?? null)

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.tinta, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Header oscuro */}
      <div style={{ padding: '60px 64px 48px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>

          {/* Título */}
          <div>
            <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 22, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 16 }}>
              Nuestro menú
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 96, lineHeight: 0.92 }}>
              {category.name}
            </div>
          </div>

          {/* Marca */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            background: 'rgba(255,255,255,0.07)',
            padding: '10px 20px 10px 10px', borderRadius: 999, marginTop: 6,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.amarillo}` }}>
              <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 24 }}>
              Celestina
            </span>
          </div>
        </div>
      </div>

      {/* Grid 2×2 — ocupa todo el espacio restante */}
      <div style={{ display: 'flex', flex: 1, gap: 3 }}>
        {/* Columna izquierda */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <GridCell item={slots[0]} />
          <GridCell item={slots[2]} />
        </div>
        {/* Columna derecha */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <GridCell item={slots[1]} />
          <GridCell item={slots[3]} />
        </div>
      </div>

      {/* Pie mínimo */}
      <div style={{ flexShrink: 0, padding: '18px 64px', display: 'flex', justifyContent: 'center' }}>
        <span style={{ color: '#334155', fontSize: 20, letterSpacing: 1 }}>
          celestina-cocina.vercel.app
        </span>
      </div>
    </div>
  )
}
