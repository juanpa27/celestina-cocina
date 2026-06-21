import { Flame } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, AzulejoBand, FlyerHeader, FlyerFooter, PhotoPlaceholder } from './flyerChrome'

// Flyer de un solo plato (1080×1920). Spotlight de la foto + nombre, precio y badges.
export default function DishFlyer({ item, categoryName }) {
  if (!item) return null

  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' }}>
      <AzulejoBand />
      <FlyerHeader />

      {/* Hero — foto del plato */}
      <div style={{ position: 'relative', height: 880, background: C.azulejo, flexShrink: 0 }}>
        {item.image_url
          ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <PhotoPlaceholder />}

        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 40, left: 40, background: C.azul, color: '#fff',
            fontWeight: 800, fontSize: 50, lineHeight: 1, padding: '20px 34px', borderRadius: 999,
            boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
          }}>
            {item.discount_pct}% OFF
          </div>
        )}

        {item.is_popular && (
          <div style={{
            position: 'absolute', top: 40, right: 40, background: C.amarillo, color: C.tinta,
            display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 34,
            padding: '16px 28px', borderRadius: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
          }}>
            <Flame size={34} strokeWidth={2.5} /> Más pedido
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px' }}>
        {categoryName && (
          <div style={{ color: C.azul, fontWeight: 700, fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16 }}>
            {categoryName}
          </div>
        )}

        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 82, lineHeight: 1.02 }}>
          {item.name}
        </div>

        {item.notes && (
          <div style={{ alignSelf: 'flex-start', marginTop: 24, background: C.azulejo, color: C.azul, fontWeight: 600, fontSize: 26, padding: '10px 24px', borderRadius: 999 }}>
            {item.notes}
          </div>
        )}

        {item.description && (
          <div style={{ color: C.gris, fontSize: 32, lineHeight: 1.4, marginTop: 28, maxWidth: 920 }}>
            {item.description}
          </div>
        )}

        {/* Precio */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 44 }}>
          {hasDiscount && (
            <span style={{ color: C.gris, fontSize: 46, textDecoration: 'line-through' }}>
              {formatPrice(item.price)}
            </span>
          )}
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azul, fontSize: 88, lineHeight: 1 }}>
            {formatPrice(effective)}
          </span>
        </div>
      </div>

      <FlyerFooter />
      <AzulejoBand />
    </div>
  )
}
