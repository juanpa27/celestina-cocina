import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W } from '../../../lib/flyer'
import { C } from './flyerChrome'

// Menú completo para postear como estado de WhatsApp: TODOS los platos activos
// (sin bebidas), con los colores y la tipografía de la carta (crema + azul +
// azulejo amarillo, Fraunces / DM Sans). Ancho fijo 1080; la altura crece con
// el contenido.

const CARD_W = (FLYER_W - 96 - 30) / 2   // padding 48*2, gap 30

function Card({ item }) {
  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0
  const isPopular = item.is_popular

  return (
    <div style={{
      width: CARD_W,
      background: '#fff',
      borderRadius: 22,
      overflow: 'hidden',
      border: isPopular ? `3px solid ${C.amarillo}` : '1px solid #e7eef3',
      boxShadow: isPopular ? '0 8px 22px rgba(242,193,78,0.35)' : '0 6px 18px rgba(29,94,140,0.08)',
    }}>
      <div style={{ position: 'relative', height: 250 }}>
        {item.image_url
          ? <img
              src={item.image_url}
              crossOrigin="anonymous"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          : (
            <div style={{ width: '100%', height: '100%', background: C.azulejo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 72, color: '#c4dcea' }}>
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: C.azul, color: C.crema,
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
            padding: '5px 13px', borderRadius: 999,
          }}>
            {item.discount_pct}% OFF
          </div>
        )}
        {isPopular && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: C.amarillo, color: C.tinta,
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
            padding: '5px 14px', borderRadius: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            🔥 Más pedido
          </div>
        )}
      </div>
      <div style={{ padding: '16px 20px 18px' }}>
        <div style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600,
          color: C.tinta, fontSize: 28, lineHeight: 1.12, marginBottom: 8,
        }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: C.azul, fontSize: 30 }}>
            {formatPrice(effective)}
          </span>
          {hasDiscount && (
            <span style={{ color: '#9ca3af', fontSize: 20, textDecoration: 'line-through' }}>
              {formatPrice(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MenuStatusFlyer({ categories }) {
  const cats = (categories ?? [])
    .filter(c => c.active && !/bebida/i.test(c.name))
    .map(c => ({ ...c, items: (c.items ?? []).filter(i => i.available !== false) }))
    .filter(c => c.items.length)

  return (
    <div style={{ width: FLYER_W, background: C.crema, fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: C.azul, padding: '52px 48px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 24, letterSpacing: 7, textTransform: 'uppercase', marginBottom: 14 }}>
            Nuestro menú
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.crema, fontSize: 76, lineHeight: 0.96 }}>
            Celestina Cocina
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 22, letterSpacing: 1, marginTop: 12 }}>
            Pastas caseras y más · Caaguazú
          </div>
        </div>
        <div style={{ width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${C.crema}`, flexShrink: 0, boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
          <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Banda azulejo con amarillo */}
      <div style={{ display: 'flex', height: 16, overflow: 'hidden' }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <div style={{ width: 40, height: 16, background: C.azul }} />
            <div style={{ width: 8, height: 16, background: C.amarillo }} />
            <div style={{ width: 40, height: 16, background: C.azulClaro }} />
            <div style={{ width: 8, height: 16, background: C.amarillo }} />
          </div>
        ))}
      </div>

      {/* Cuerpo: categorías con grilla */}
      <div style={{ padding: '44px 48px 52px' }}>
        {cats.map((cat, ci) => (
          <div key={cat.id} style={{ marginTop: ci === 0 ? 0 : 46 }}>
            {/* Título de categoría */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azul, fontSize: 46, lineHeight: 1 }}>
                {cat.name}
              </span>
              <div style={{ flex: 1, height: 3, background: C.azulejo, borderRadius: 2 }} />
            </div>
            {/* Grilla 2 columnas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30 }}>
              {cat.items.map(item => <Card key={item.id} item={item} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
