import { MessageCircle } from 'lucide-react'
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from '../../../lib/config'
import { formatLocalPhone } from '../../../lib/utils'

// Paleta y patrón de marca, escalados al lienzo del flyer (1080px de ancho).
export const C = {
  azul: '#1d5e8c',
  azulClaro: '#5b96bf',
  amarillo: '#f2c14e',
  crema: '#fdfbf6',
  tinta: '#1c2b36',
  azulejo: '#eaf3f8',
  gris: '#7c8a93',
  oro: '#c9a020',
}

// Mismo patrón "azulejo" del header del menú, ampliado ~2.2x para que lea a escala del flyer.
export const AZULEJO_BG =
  'repeating-linear-gradient(90deg, #1d5e8c 0 62px, #f2c14e 62px 70px, #5b96bf 70px 132px, #f2c14e 132px 140px)'

export function AzulejoBand({ height = 30 }) {
  return <div style={{ height, background: AZULEJO_BG, flexShrink: 0 }} />
}

// Banda azulejo bicolor de firma (azul / azul claro con separadores amarillos).
// Compartida por los flyers de estilo claro (Menú estado, Por plato, Categoría)
// para que la franja se lea idéntica en los tres.
export function AzulejoStripe({ height = 16 }) {
  return (
    <div style={{ display: 'flex', height, overflow: 'hidden', flexShrink: 0 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <div style={{ width: 40, height, background: C.azul }} />
          <div style={{ width: 8, height, background: C.amarillo }} />
          <div style={{ width: 40, height, background: C.azulClaro }} />
          <div style={{ width: 8, height, background: C.amarillo }} />
        </div>
      ))}
    </div>
  )
}

// Cabecera de marca clara: logo circular a la izquierda + eyebrow "NUESTRO MENÚ"
// + nombre del negocio (Fraunces) + subtítulo, sobre el azul de marca. Si se le
// pasa `phone`, agrega el pill de contacto (ícono + teléfono en formato local)
// a la derecha, a la altura del subtítulo — con `position:absolute` a propósito,
// para no comprimir el bloque de texto y evitar que el nombre se parta en dos
// líneas. Compartida por los flyers de estilo claro para consistencia total.
export function BrandHeader({ phone, eyebrow = 'Nuestro menú' }) {
  return (
    <div style={{ position: 'relative', background: C.azul, padding: '48px 48px 42px', display: 'flex', alignItems: 'center', gap: 30, flexShrink: 0 }}>
      <div style={{ width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${C.crema}`, flexShrink: 0, boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
        <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 24, letterSpacing: 7, textTransform: 'uppercase', marginBottom: 12 }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.crema, fontSize: 72, lineHeight: 0.96 }}>
          {BUSINESS_NAME}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 22, letterSpacing: 1, marginTop: 12 }}>
          {BUSINESS_SUBTITLE} · Caaguazú
        </div>
      </div>
      {phone && (
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
      )}
    </div>
  )
}

export function FlyerHeader() {
  return (
    <div style={{ background: C.tinta, padding: '34px 56px', display: 'flex', alignItems: 'center', gap: 26, flexShrink: 0 }}>
      <div
        style={{
          width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: `3px solid ${C.oro}`, boxShadow: '0 0 0 5px rgba(201,160,32,0.22)',
        }}
      >
        <img src="/logo_v2.jpeg" crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 48, lineHeight: 1 }}>
          {BUSINESS_NAME}
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', color: C.azulClaro, fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', marginTop: 10 }}>
          {BUSINESS_SUBTITLE}
        </div>
      </div>
    </div>
  )
}

export function FlyerFooter() {
  return (
    <div style={{ background: C.azul, padding: '36px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircle size={44} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
          <div style={{ color: '#bcd7ea', fontSize: 24 }}>Hacé tu pedido por</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#fff', fontSize: 44, lineHeight: 1.05 }}>WhatsApp</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ color: '#fff', fontSize: 30, fontWeight: 700 }}>Pedí online</div>
        <div style={{ color: '#bcd7ea', fontSize: 22, marginTop: 4 }}>celestina-cocina.vercel.app</div>
      </div>
    </div>
  )
}

// Placeholder cuando un plato no tiene foto (mismo damero del menú).
export function PhotoPlaceholder() {
  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'repeating-conic-gradient(#dbe9f0 0% 25%, #eaf3f8 0% 50%) 0 0 / 64px 64px',
      }}
    >
      <svg width="110" height="110" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.35 }}>
        <circle cx="20" cy="20" r="18" stroke="#1d5e8c" strokeWidth="2" />
        <path d="M13 14v4a4 4 0 0 0 3 3.87V28h2v-6.13A4 4 0 0 0 21 18v-4h-2v4a2 2 0 0 1-4 0v-4h-2z" fill="#1d5e8c" />
        <path d="M25 14c0 0 2 2 2 6s-2 6-2 6v2h2V14h-2z" fill="#1d5e8c" />
      </svg>
    </div>
  )
}
