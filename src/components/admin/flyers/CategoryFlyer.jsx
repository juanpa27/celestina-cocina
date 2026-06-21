import { Flame } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, AzulejoBand, FlyerHeader, FlyerFooter, PhotoPlaceholder } from './flyerChrome'

const MAX_ITEMS = 4

// Prioriza los platos más "vendibles": destacados y con descuento primero.
function pickItems(items = []) {
  return [...items]
    .filter(i => i.available !== false)
    .sort((a, b) => {
      const score = i => (i.is_popular ? 2 : 0) + (i.discount_pct > 0 ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, MAX_ITEMS)
}

function Row({ item }) {
  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '28px 0', borderBottom: `2px solid ${C.azulejo}` }}>
      <div style={{ width: 184, height: 184, borderRadius: 28, overflow: 'hidden', flexShrink: 0, background: C.azulejo, position: 'relative' }}>
        {item.image_url
          ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <PhotoPlaceholder />}
        {hasDiscount && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: C.azul, color: '#fff', fontWeight: 800, fontSize: 24, lineHeight: 1, padding: '8px 14px', borderRadius: 999 }}>
            {item.discount_pct}%
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 46, lineHeight: 1.05 }}>
            {item.name}
          </span>
          {item.is_popular && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.amarillo, color: C.tinta, fontWeight: 700, fontSize: 22, padding: '6px 14px', borderRadius: 999, flexShrink: 0 }}>
              <Flame size={20} strokeWidth={2.5} /> Top
            </span>
          )}
        </div>
        {item.notes && <div style={{ color: C.gris, fontSize: 26, marginTop: 8 }}>{item.notes}</div>}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {hasDiscount && (
          <div style={{ color: C.gris, fontSize: 28, textDecoration: 'line-through', lineHeight: 1 }}>
            {formatPrice(item.price)}
          </div>
        )}
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azul, fontSize: 50, lineHeight: 1.1, marginTop: hasDiscount ? 6 : 0 }}>
          {formatPrice(effective)}
        </div>
      </div>
    </div>
  )
}

// Flyer de una categoría (1080×1920). Lista hasta 4 platos destacados.
export default function CategoryFlyer({ category }) {
  if (!category) return null
  const items = pickItems(category.items)

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' }}>
      <AzulejoBand />
      <FlyerHeader />

      {/* Título de categoría */}
      <div style={{ padding: '56px 64px 24px' }}>
        <div style={{ color: C.azul, fontWeight: 700, fontSize: 28, letterSpacing: 5, textTransform: 'uppercase' }}>
          Nuestro menú
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 92, lineHeight: 1.0, marginTop: 12 }}>
          {category.name}
        </div>
      </div>

      {/* Lista de platos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px' }}>
        {items.map(item => <Row key={item.id} item={item} />)}
      </div>

      <FlyerFooter />
      <AzulejoBand />
    </div>
  )
}
