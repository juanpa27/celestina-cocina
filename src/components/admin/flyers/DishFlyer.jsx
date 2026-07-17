import { Flame } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { useConfig } from '../../../hooks/useConfig'
import { C, BrandHeader, AzulejoStripe, PhotoPlaceholder } from './flyerChrome'

// Flyer de un plato, estilo de marca claro (crema + azulejo), consistente con
// el "Menú (estado)" y la Carta: cabecera azul con logo, banda de azulejos, y
// el plato como protagonista sobre fondo crema (foto grande + precio azul).
export default function DishFlyer({ item, categoryName }) {
  const { data: config } = useConfig()
  const phone = config?.whatsapp_negocio || '595986818441'

  if (!item) return null

  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      <BrandHeader phone={phone} />
      <AzulejoStripe />

      {/* Cuerpo — plato protagonista sobre crema */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '52px 56px 48px' }}>

        {/* Categoría + nombre */}
        {categoryName && (
          <div style={{ color: C.azul, fontWeight: 700, fontSize: 26, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 14 }}>
            {categoryName}
          </div>
        )}
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 82, lineHeight: 1.0 }}>
          {item.name}
        </div>
        {item.notes && (
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start', marginTop: 18,
            background: C.azulejo, color: C.azul, fontWeight: 600, fontSize: 26,
            padding: '9px 22px', borderRadius: 999, border: `1.5px solid ${C.azulClaro}`,
          }}>
            {item.notes}
          </div>
        )}

        {/* Foto grande */}
        <div style={{
          flex: 1, minHeight: 0, marginTop: 32, position: 'relative',
          borderRadius: 32, overflow: 'hidden',
          border: `1px solid #e7eef3`, boxShadow: '0 18px 44px rgba(29,94,140,0.16)',
        }}>
          {item.image_url
            ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <PhotoPlaceholder />}

          {hasDiscount && (
            <div style={{
              position: 'absolute', top: 24, left: 24,
              background: C.amarillo, color: C.tinta,
              fontWeight: 800, fontSize: 40, lineHeight: 1,
              padding: '12px 26px', borderRadius: 999,
              boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
            }}>
              {item.discount_pct}% OFF
            </div>
          )}
          {item.is_popular && (
            <div style={{
              position: 'absolute', bottom: 24, left: 24,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: C.amarillo, color: C.tinta,
              fontWeight: 700, fontSize: 30, padding: '11px 26px', borderRadius: 999,
              boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
            }}>
              <Flame size={30} strokeWidth={2.5} /> Más pedido
            </div>
          )}
        </div>

        {/* Precio */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azul, fontSize: 104, lineHeight: 1 }}>
              {formatPrice(effective)}
            </span>
            {hasDiscount && (
              <span style={{ color: C.gris, fontSize: 44, textDecoration: 'line-through' }}>
                {formatPrice(item.price)}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <div style={{ color: C.gris, fontSize: 28, lineHeight: 1.5, maxWidth: 880, marginTop: 18 }}>
            {item.description}
          </div>
        )}
      </div>
    </div>
  )
}
