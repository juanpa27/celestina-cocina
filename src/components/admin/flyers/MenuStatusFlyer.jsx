import { useRef, useState, useLayoutEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { formatPrice, calcDiscountedPrice, stripTrailingCategoryWord, formatLocalPhone } from '../../../lib/utils'
import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { useConfig } from '../../../hooks/useConfig'
import { C } from './flyerChrome'

// Menú completo para postear como estado/historia de WhatsApp: TODOS los platos
// activos (sin bebidas), con los colores y la tipografía de la carta (crema +
// azul + azulejo amarillo, Fraunces / DM Sans). Lienzo fijo 1080×1920 (9:16)
// para que entre exacto en un estado sin barras negras — el cuerpo se auto-
// escala para que todos los platos quepan en el alto disponible.

const COLS = 3
const GAP = 24
// Alto de foto FIJO en px (no aspect-ratio): html-to-image serializa el DOM a
// SVG/foreignObject y rasteriza contra el layout en el momento exacto de la
// captura — un aspect-ratio necesita una pasada de layout para resolverse a un
// alto real, y en la práctica eso rompía justo la primera fila (foto en blanco
// o desbordada) en el archivo exportado, aunque el DOM en vivo se veía bien.
// Un alto en px queda resuelto de entrada, sin ambigüedad de layout.
const CARD_W = (FLYER_W - 96 - GAP * (COLS - 1)) / COLS
const PHOTO_H = Math.round(CARD_W * 0.75)

function Card({ item, categoryName }) {
  const effective = calcDiscountedPrice(item.price, item.discount_pct)
  const hasDiscount = item.discount_pct > 0
  const isPopular = item.is_popular
  const displayName = stripTrailingCategoryWord(item.name, categoryName)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fff',
      borderRadius: 18,
      overflow: 'hidden',
      border: isPopular ? `3px solid ${C.amarillo}` : '1px solid #e7eef3',
      boxShadow: isPopular ? '0 8px 22px rgba(242,193,78,0.35)' : '0 6px 18px rgba(29,94,140,0.08)',
    }}>
      <div style={{ position: 'relative', width: '100%', height: PHOTO_H, flexShrink: 0 }}>
        {item.image_url
          ? <img
              src={item.image_url}
              crossOrigin="anonymous"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          : (
            <div style={{ width: '100%', height: '100%', background: C.azulejo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 48, color: '#c4dcea' }}>
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: C.azul, color: C.crema,
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
            padding: '3px 10px', borderRadius: 999,
          }}>
            {item.discount_pct}% OFF
          </div>
        )}
        {isPopular && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: C.amarillo, color: C.tinta,
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13,
            padding: '3px 11px', borderRadius: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
          }}>
            🔥 Más pedido
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          color: C.tinta, fontSize: 16, lineHeight: 1.2, marginBottom: 6,
        }}>
          {displayName}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 'auto' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color: C.azul, fontSize: 19 }}>
            {formatPrice(effective)}
          </span>
          {hasDiscount && (
            <span style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'line-through' }}>
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

  const { data: config } = useConfig()
  const phone = config?.whatsapp_negocio || '595986818441'

  // Auto-fit: escala el cuerpo para que todos los platos entren en el alto
  // disponible del lienzo 9:16. La foto usa aspect-ratio (no un alto fijo en
  // px), así que su altura ya depende del ancho de la tarjeta y no hace falta
  // re-medir cuando cargan las imágenes.
  const bodyRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const body = bodyRef.current
    const content = contentRef.current
    if (!body || !content) return
    const avail = body.clientHeight
    const natural = content.scrollHeight
    setScale(natural > avail ? avail / natural : 1)
  }, [categories])

  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Header — logo a la izquierda */}
      <div style={{ position: 'relative', background: C.azul, padding: '48px 48px 42px', display: 'flex', alignItems: 'center', gap: 30, flexShrink: 0 }}>
        <div style={{ width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${C.crema}`, flexShrink: 0, boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
          <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 24, letterSpacing: 7, textTransform: 'uppercase', marginBottom: 12 }}>
            Nuestro menú
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.crema, fontSize: 72, lineHeight: 0.96 }}>
            Celestina Cocina
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 22, letterSpacing: 1, marginTop: 12 }}>
            Pastas caseras y más · Caaguazú
          </div>
        </div>
        {/* Contacto — pill a la derecha, a la altura del subtítulo. Antes vivía en
            un footer al pie del flyer; se movió acá para que el flyer cierre con
            la última tarjeta y el dato de contacto quede junto a la marca.
            `position:absolute` a propósito: así no ocupa espacio en el flex y no
            comprime el bloque de texto (si no, el título "Celestina Cocina" se
            partía en dos líneas). */}
        <div style={{
          position: 'absolute', right: 48, bottom: 44,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(242,193,78,0.45)',
          borderRadius: 999, padding: '9px 20px',
        }}>
          <MessageCircle size={24} color={C.amarillo} strokeWidth={2.5} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: C.amarillo, fontSize: 26, letterSpacing: 0.5 }}>
            {formatLocalPhone(phone)}
          </span>
        </div>
      </div>

      {/* Banda azulejo con amarillo */}
      <div style={{ display: 'flex', height: 16, overflow: 'hidden', flexShrink: 0 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <div style={{ width: 40, height: 16, background: C.azul }} />
            <div style={{ width: 8, height: 16, background: C.amarillo }} />
            <div style={{ width: 40, height: 16, background: C.azulClaro }} />
            <div style={{ width: 8, height: 16, background: C.amarillo }} />
          </div>
        ))}
      </div>

      {/* Cuerpo: categorías con grilla, auto-escalado para caber en el 9:16 */}
      <div ref={bodyRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '44px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div ref={contentRef} style={{ width: '100%', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          {cats.map((cat, ci) => (
            <div key={cat.id} style={{ marginTop: ci === 0 ? 0 : 46 }}>
              {/* Título de categoría */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azul, fontSize: 46, lineHeight: 1 }}>
                  {cat.name}
                </span>
                <div style={{ flex: 1, height: 3, background: C.azulejo, borderRadius: 2 }} />
              </div>
              {/* Grilla 3 columnas — gridAutoRows/stretch para que el precio quede
                  a la misma altura entre tarjetas de una fila aunque el nombre
                  de alguna ocupe más líneas */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: GAP }}>
                {cat.items.map(item => <Card key={item.id} item={item} categoryName={cat.name} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
