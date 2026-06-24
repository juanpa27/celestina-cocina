import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, AzulejoBand, FlyerHeader } from './flyerChrome'

export default function PaymentBanner({ paymentName, paymentAlias, paymentBank, logoUrl }) {
  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' }}>
      <AzulejoBand />
      <FlyerHeader />
      <AzulejoBand height={18} />

      {/* Cuerpo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 88px' }}>

        {/* Label */}
        <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 28, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 18 }}>
          Formas de pago
        </div>

        {/* Título */}
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 100, lineHeight: 1, textAlign: 'center', marginBottom: 24 }}>
          Transferencia
        </div>

        {/* Divisor dorado */}
        <div style={{ width: 110, height: 6, background: C.amarillo, borderRadius: 3, marginBottom: 60 }} />

        {/* Logo del banco */}
        <div style={{
          width: 280, height: 160, background: '#fff', borderRadius: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 36px rgba(29,94,140,0.13)',
          border: `1.5px solid ${C.azulejo}`,
          padding: 28, marginBottom: 60, flexShrink: 0,
        }}>
          {logoUrl
            ? <img src={logoUrl} crossOrigin="anonymous" alt={paymentBank ?? 'logo'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            : <span style={{ color: C.azulClaro, fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 40 }}>{paymentBank || '🏦'}</span>
          }
        </div>

        {/* Tarjeta de datos — orden: Alias → Nombre → Entidad */}
        <div style={{
          width: '100%', background: '#fff', borderRadius: 40,
          border: `2px solid ${C.azulejo}`,
          padding: '56px 68px',
          display: 'flex', flexDirection: 'column', gap: 42,
          boxShadow: '0 4px 24px rgba(29,94,140,0.07)',
        }}>

          {/* 1. Alias — el más importante */}
          <div>
            <div style={{ color: C.gris, fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>
              Alias
            </div>
            <div style={{
              background: C.azulejo, borderRadius: 18,
              padding: '22px 32px',
              fontFamily: 'monospace', fontWeight: 700, color: C.azul,
              fontSize: 72, letterSpacing: 2, lineHeight: 1,
            }}>
              {paymentAlias || '—'}
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: 1.5, background: C.azulejo }} />

          {/* 2. Nombre */}
          <div>
            <div style={{ color: C.gris, fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
              Titular
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 64, lineHeight: 1.1 }}>
              {paymentName || '—'}
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: 1.5, background: C.azulejo }} />

          {/* 3. Entidad */}
          <div>
            <div style={{ color: C.gris, fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
              Entidad
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.azulClaro, fontSize: 52, lineHeight: 1.1 }}>
              {paymentBank || '—'}
            </div>
          </div>

        </div>
      </div>

      {/* Sin footer — solo franja inferior */}
      <AzulejoBand />
    </div>
  )
}
