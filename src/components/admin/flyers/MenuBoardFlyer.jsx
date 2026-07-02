import { Flame, MessageCircle } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, PhotoPlaceholder } from './flyerChrome'

const MAX_ITEMS = 6

// Prioriza destacados y con descuento — lo mismo que hace CategoryFlyer.
function pickItems(items = []) {
  return [...items]
    .filter(i => i.available !== false)
    .sort((a, b) => {
      const score = i => (i.is_popular ? 2 : 0) + (i.discount_pct > 0 ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, MAX_ITEMS)
}

function Card({ item }) {
  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{
      flex: 1,
      position: 'relative',
      borderRadius: 28,
      overflow: 'hidden',
      background: '#22333f',
      boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
    }}>
      {item.image_url
        ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: C.azulejo }}><PhotoPlaceholder /></div>}

      {/* Degradado inferior para legibilidad del texto */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%',
        background: 'linear-gradient(to bottom, transparent, rgba(20,32,42,0.96))',
      }} />

      {/* Badges arriba */}
      {hasDiscount && (
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: C.amarillo, color: C.tinta,
          fontWeight: 800, fontSize: 24, padding: '6px 14px', borderRadius: 999,
        }}>
          {item.discount_pct}% OFF
        </div>
      )}
      {item.is_popular && !hasDiscount && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(242,193,78,0.95)', color: C.tinta,
          fontWeight: 700, fontSize: 20, padding: '5px 12px', borderRadius: 999,
        }}>
          <Flame size={16} strokeWidth={2.5} /> Top
        </div>
      )}

      {/* Nombre + precio abajo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 22px' }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 700,
          color: '#fff', fontSize: 34, lineHeight: 1.08, marginBottom: 8,
          textShadow: '0 2px 8px rgba(0,0,0,0.45)',
        }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.amarillo, fontSize: 36 }}>
            {formatPrice(effective)}
          </span>
          {hasDiscount && (
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 22, textDecoration: 'line-through' }}>
              {formatPrice(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MenuBoardFlyer({ category, whatsapp }) {
  if (!category) return null
  const picked = pickItems(category.items)
  if (!picked.length) return null

  // Agrupa en filas de 2 para la grilla (última fila puede quedar con 1).
  const rows = []
  for (let i = 0; i < picked.length; i += 2) rows.push(picked.slice(i, i + 2))

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.tinta, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '56px 56px 28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 22, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 12 }}>
            Nuestro menú
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 62, lineHeight: 0.98 }}>
            {category.name}
          </div>
        </div>
        <div style={{ width: 118, height: 118, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${C.amarillo}`, flexShrink: 0, boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}>
          <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Banda azulejo — firma de marca */}
      <div style={{ display: 'flex', height: 14, flexShrink: 0, overflow: 'hidden' }}>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <div style={{ width: 34, height: 14, background: C.azul }} />
            <div style={{ width: 6, height: 14, background: C.amarillo }} />
            <div style={{ width: 34, height: 14, background: C.azulClaro }} />
            <div style={{ width: 6, height: 14, background: C.amarillo }} />
          </div>
        ))}
      </div>

      {/* Grilla de tarjetas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 26, padding: '34px 56px' }}>
        {rows.map((row, r) => (
          <div key={r} style={{ flex: 1, display: 'flex', gap: 26 }}>
            {row.map(item => <Card key={item.id} item={item} />)}
            {row.length === 1 && <div style={{ flex: 1 }} />}
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{ flexShrink: 0, background: C.azul, padding: '30px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageCircle size={40} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ color: '#bcd7ea', fontSize: 22 }}>Pedí por WhatsApp</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 40, lineHeight: 1.1 }}>
              {whatsapp || 'celestina-cocina.vercel.app'}
            </div>
          </div>
        </div>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.amarillo, fontSize: 30 }}>Celestina</span>
      </div>
    </div>
  )
}
