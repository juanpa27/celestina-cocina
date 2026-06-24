import { FLYER_W, FLYER_H } from '../../../lib/flyer'
import { C, AzulejoBand, FlyerHeader, FlyerFooter } from './flyerChrome'

export default function PaymentBanner({ paymentName, paymentAlias, paymentBank, logoUrl }) {
  return (
    <div style={{ width: FLYER_W, height: FLYER_H, background: C.crema, display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' }}>
      <AzulejoBand />
      <FlyerHeader />
      <AzulejoBand height={18} />

      {/* Cuerpo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 88px' }}>

        {/* Label */}
        <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 26, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 18 }}>
          Formas de pago
        </div>

        {/* Título */}
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 94, lineHeight: 1, textAlign: 'center', marginBottom: 22 }}>
          Transferencia
        </div>

        {/* Divisor dorado */}
        <div style={{ width: 110, height: 6, background: C.amarillo, borderRadius: 3, marginBottom: 56 }} />

        {/* Logo del banco */}
        <div style={{
          width: 300, height: 180, background: '#fff', borderRadius: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 36px rgba(29,94,140,0.13)',
          border: `1.5px solid ${C.azulejo}`,
          padding: 28, marginBottom: 22, flexShrink: 0,
        }}>
          {logoUrl
            ? <img src={logoUrl} crossOrigin="anonymous" alt={paymentBank ?? 'logo'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            : <span style={{ color: C.azulClaro, fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 40 }}>{paymentBank || '🏦'}</span>
          }
        </div>

        {/* Nombre del banco */}
        {paymentBank ? (
          <div style={{ color: C.azulClaro, fontWeight: 700, fontSize: 30, marginBottom: 52, textAlign: 'center' }}>
            {paymentBank}
          </div>
        ) : (
          <div style={{ marginBottom: 52 }} />
        )}

        {/* Tarjeta de datos */}
        <div style={{
          width: '100%', background: '#fff', borderRadius: 40,
          border: `2px solid ${C.azulejo}`,
          padding: '52px 64px',
          display: 'flex', flexDirection: 'column', gap: 38,
          boxShadow: '0 4px 24px rgba(29,94,140,0.07)',
        }}>
          {/* Titular */}
          <div>
            <div style={{ color: C.gris, fontSize: 20, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Titular
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.tinta, fontSize: 52, lineHeight: 1.1 }}>
              {paymentName || '—'}
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: C.azulejo }} />

          {/* Alias */}
          <div>
            <div style={{ color: C.gris, fontSize: 20, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
              Alias
            </div>
            <div style={{
              background: C.azulejo, borderRadius: 16,
              padding: '18px 28px',
              fontFamily: 'monospace', fontWeight: 700, color: C.azul,
              fontSize: 56, letterSpacing: 1, lineHeight: 1,
            }}>
              {paymentAlias || '—'}
            </div>
          </div>
        </div>

        {/* Métodos aceptados */}
        <div style={{ marginTop: 48, textAlign: 'center', color: C.gris, fontSize: 26, lineHeight: 1.5 }}>
          Aceptamos Tigo Money · Ueno{'\n'}transferencia bancaria y efectivo
        </div>
      </div>

      <AzulejoBand height={18} />
      <FlyerFooter />
      <AzulejoBand />
    </div>
  )
}
