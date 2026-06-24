import { Flame } from 'lucide-react'
import { formatPrice, calcDiscountedPrice } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, PhotoPlaceholder } from './flyerChrome'

function BrandBadge() {
  return (
    <div style={{
      position: 'absolute', top: 44, right: 44,
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(28,43,54,0.68)',
      padding: '10px 22px 10px 10px', borderRadius: 999,
    }}>
      <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2.5px solid ${C.amarillo}` }}>
        <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 28, letterSpacing: 0.5 }}>
        Celestina Cocina
      </span>
    </div>
  )
}

export default function DishFlyer({ item, categoryName }) {
  if (!item) return null

  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.tinta, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Foto hero — 72% del canvas */}
      <div style={{ position: 'relative', height: 1380, flexShrink: 0 }}>
        {item.image_url
          ? <img src={item.image_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <PhotoPlaceholder />}

        {/* Degradado foto → sección oscura */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(28,43,54,0.12) 0%, transparent 18%, transparent 42%, rgba(28,43,54,0.55) 65%, rgba(28,43,54,0.90) 84%, #1c2b36 100%)',
        }} />

        <BrandBadge />

        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 44, left: 44,
            background: C.amarillo, color: C.tinta,
            fontWeight: 800, fontSize: 48, lineHeight: 1,
            padding: '16px 32px', borderRadius: 999,
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
          }}>
            {item.discount_pct}% OFF
          </div>
        )}

        {/* Texto sobre el degradado */}
        <div style={{ position: 'absolute', bottom: 56, left: 64, right: 64 }}>
          {categoryName && (
            <div style={{
              color: C.azulClaro, fontWeight: 700, fontSize: 24,
              letterSpacing: 5, textTransform: 'uppercase', marginBottom: 16,
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            }}>
              {categoryName}
            </div>
          )}
          <div style={{
            fontFamily: 'Fraunces, serif', fontWeight: 700,
            color: '#fff', fontSize: 90, lineHeight: 1.0,
            textShadow: '0 4px 24px rgba(0,0,0,0.45)',
          }}>
            {item.name}
          </div>
          {item.notes && (
            <div style={{
              display: 'inline-block', marginTop: 22,
              background: 'rgba(255,255,255,0.16)',
              color: '#fff', fontWeight: 600, fontSize: 26,
              padding: '10px 24px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.22)',
            }}>
              {item.notes}
            </div>
          )}
        </div>
      </div>

      {/* Sección oscura — precio y datos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px 52px' }}>

        {/* Precio */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 16 }}>
          {hasDiscount && (
            <span style={{ color: '#64748b', fontSize: 48, textDecoration: 'line-through' }}>
              {formatPrice(item.price)}
            </span>
          )}
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.amarillo, fontSize: 110, lineHeight: 1 }}>
            {formatPrice(effective)}
          </span>
        </div>

        {item.description && (
          <div style={{ color: '#94a3b8', fontSize: 30, lineHeight: 1.55, maxWidth: 900, marginBottom: 24 }}>
            {item.description}
          </div>
        )}

        {item.is_popular && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: C.amarillo, color: C.tinta,
            fontWeight: 700, fontSize: 28, padding: '12px 28px', borderRadius: 999,
            alignSelf: 'flex-start',
          }}>
            <Flame size={28} strokeWidth={2.5} /> Más pedido
          </div>
        )}

        <div style={{ color: '#334155', fontSize: 22, marginTop: 'auto', paddingTop: 36, letterSpacing: 1 }}>
          celestina-cocina.vercel.app
        </div>
      </div>
    </div>
  )
}
