import { Flame } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { useConfig } from '../../../hooks/useConfig'
import { C, BrandHeader, AzulejoStripe, PhotoPlaceholder } from './flyerChrome'

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
    return <div style={{ background: C.azulejo, borderRadius: 24, border: '1px solid #e7eef3' }} />
  }

  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0,
      background: '#fff', borderRadius: 24, overflow: 'hidden',
      border: item.is_popular ? `3px solid ${C.amarillo}` : '1px solid #e7eef3',
      boxShadow: item.is_popular ? '0 10px 26px rgba(242,193,78,0.35)' : '0 8px 22px rgba(29,94,140,0.10)',
    }}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {item.image_url
          ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: C.azulejo }}><PhotoPlaceholder /></div>}

        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 18, left: 18,
            background: C.amarillo, color: C.tinta,
            fontWeight: 800, fontSize: 28, padding: '7px 18px', borderRadius: 999,
            boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          }}>
            {item.discount_pct}% OFF
          </div>
        )}
        {item.is_popular && (
          <div style={{
            position: 'absolute', top: 18, right: 18,
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: C.amarillo, color: C.tinta,
            fontWeight: 700, fontSize: 24, padding: '6px 16px', borderRadius: 999,
            boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          }}>
            <Flame size={20} strokeWidth={2.5} /> Más pedido
          </div>
        )}
      </div>

      <div style={{ padding: '20px 26px 24px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 40, lineHeight: 1.08, marginBottom: 10 }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: C.azul, fontSize: 42 }}>
            {formatPrice(effective)}
          </span>
          {hasDiscount && (
            <span style={{ color: C.gris, fontSize: 28, textDecoration: 'line-through' }}>
              {formatPrice(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CategoryFlyer({ category }) {
  const { data: config } = useConfig()
  const phone = config?.whatsapp_negocio || '595986818441'

  if (!category) return null
  const picked = pickItems(category.items)
  const slots = [0, 1, 2, 3].map(i => picked[i] ?? null)

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      <BrandHeader phone={phone} />
      <AzulejoStripe />

      {/* Cuerpo — título de categoría + grilla 2×2 sobre crema */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '44px 48px 48px' }}>
        {/* Título de categoría */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 34, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azul, fontSize: 72, lineHeight: 1 }}>
            {category.name}
          </span>
          <div style={{ flex: 1, height: 4, background: C.azulejo, borderRadius: 2 }} />
        </div>

        {/* Grilla 2×2 */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 28 }}>
          {slots.map((item, i) => <GridCell key={item?.id ?? `empty-${i}`} item={item} />)}
        </div>
      </div>
    </div>
  )
}
