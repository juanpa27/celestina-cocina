import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import '../../../lib/pdfFonts'
import { STATUS_META } from '../../../lib/orderStatus'

function fmtGs(n) {
  return 'Gs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function lineSubtotal(item) {
  const extra = (item.order_item_modifiers ?? []).reduce((n, m) => n + Number(m.extra_price), 0)
  return (Number(item.item_price) + extra) * item.quantity
}

const AZUL     = '#1d5e8c'
const AMARILLO = '#f2c14e'
const CREMA    = '#fdfbf6'
const AZ_CLARO = '#5b96bf'
const AZULEJO  = '#eaf3f8'
const TEXTO    = '#1c2b36'
const GRIS_L   = '#9ca3af'

const HEADER_H = 96

const S = StyleSheet.create({
  page: { backgroundColor: CREMA, paddingTop: HEADER_H, paddingBottom: 40 },

  headerFixed: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { backgroundColor: AZUL, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 14 },
  logo: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: CREMA, marginRight: 14, flexShrink: 0 },
  headerCenter: { flex: 1 },
  brand: { fontFamily: 'Fraunces', fontWeight: 700, fontSize: 25, color: CREMA, letterSpacing: -0.4 },
  tagline: { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 7.5, color: AZ_CLARO, letterSpacing: 2, marginTop: 3 },
  headerDate: { fontFamily: 'DM Sans', fontSize: 7.5, color: 'rgba(255,255,255,0.5)', textAlign: 'right' },

  azuStrip: { flexDirection: 'row', height: 9, overflow: 'hidden' },

  body: { paddingHorizontal: 22, paddingTop: 18 },

  title: { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: AZUL },
  period: { fontFamily: 'Fraunces', fontWeight: 700, fontSize: 20, color: TEXTO, marginTop: 2 },
  generated: { fontFamily: 'DM Sans', fontSize: 8, color: GRIS_L, marginTop: 2, marginBottom: 14 },

  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: AZULEJO, padding: 10 },
  kpiLabel: { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', color: GRIS_L },
  kpiValue: { fontFamily: 'Fraunces', fontWeight: 700, fontSize: 15, color: TEXTO, marginTop: 3 },

  sectionLabel: { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: GRIS_L, marginBottom: 8 },

  order: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: AZULEJO, padding: 12, marginBottom: 8 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderName: { fontFamily: 'Fraunces', fontWeight: 700, fontSize: 12, color: TEXTO },
  orderMeta: { fontFamily: 'DM Sans', fontSize: 8, color: GRIS_L, marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontFamily: 'Fraunces', fontWeight: 700, fontSize: 12, color: AZUL },
  statusPill: { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 7, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 4 },
  itemsBox: { borderTopWidth: 1, borderTopColor: AZULEJO, borderStyle: 'dashed', paddingTop: 6, marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1.5 },
  itemName: { fontFamily: 'DM Sans', fontSize: 8.5, color: TEXTO, flex: 1 },
  itemSubtotal: { fontFamily: 'DM Sans', fontSize: 8.5, color: GRIS_L },

  top: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: AZULEJO, padding: 12, marginTop: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  topName: { fontFamily: 'DM Sans', fontWeight: 500, fontSize: 9, color: TEXTO },
  topUnits: { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 9, color: AZUL },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: AZUL, paddingVertical: 8, paddingHorizontal: 22 },
  footerText: { fontFamily: 'DM Sans', fontSize: 7.5, color: CREMA, textAlign: 'center' },
  empty: { fontFamily: 'DM Sans', fontSize: 10, color: GRIS_L, textAlign: 'center', paddingVertical: 30 },
})

function AzulejoStrip() {
  return (
    <View style={S.azuStrip}>
      {Array.from({ length: 15 }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          <View style={{ width: 28, height: 9, backgroundColor: AZUL }} />
          <View style={{ width: 5,  height: 9, backgroundColor: AMARILLO }} />
          <View style={{ width: 28, height: 9, backgroundColor: AZ_CLARO }} />
          <View style={{ width: 5,  height: 9, backgroundColor: AMARILLO }} />
        </View>
      ))}
    </View>
  )
}

// Documento PDF del reporte de ventas — mismo header de marca que la Carta.
export default function ReportDocument({ periodLabel, generatedAt, stats, orders, logoUrl, whatsapp }) {
  const { facturado, pedidos, ticket, topProducts } = stats
  const footerLine = whatsapp
    ? `Pedidos por WhatsApp: ${whatsapp}  ·  celestina-cocina.vercel.app`
    : `celestina-cocina.vercel.app`

  return (
    <Document title={`Celestina Cocina — Reporte ${periodLabel}`} author="Celestina Cocina">
      <Page size="A4" style={S.page}>
        <View style={S.headerFixed} fixed>
          <View style={S.header}>
            <Image src={logoUrl} style={S.logo} />
            <View style={S.headerCenter}>
              <Text style={S.brand}>Celestina Cocina</Text>
              <Text style={S.tagline}>REPORTE DE VENTAS</Text>
            </View>
            <Text style={S.headerDate}>{generatedAt}</Text>
          </View>
          <AzulejoStrip />
        </View>

        <View style={S.body}>
          <Text style={S.title}>Período</Text>
          <Text style={S.period}>{periodLabel}</Text>
          <Text style={S.generated}>Generado el {generatedAt}</Text>

          <View style={S.kpiRow}>
            <View style={S.kpi}><Text style={S.kpiLabel}>Facturado</Text><Text style={S.kpiValue}>{fmtGs(facturado)}</Text></View>
            <View style={S.kpi}><Text style={S.kpiLabel}>Pedidos</Text><Text style={S.kpiValue}>{pedidos}</Text></View>
            <View style={S.kpi}><Text style={S.kpiLabel}>Ticket prom.</Text><Text style={S.kpiValue}>{ticket ? fmtGs(ticket) : '—'}</Text></View>
          </View>

          {topProducts.length > 0 && (
            <View style={{ marginBottom: 18 }}>
              <Text style={S.sectionLabel}>Más vendidos</Text>
              <View style={S.top}>
                {topProducts.map(([name, units], i) => (
                  <View key={name} style={[S.topRow, i > 0 && { borderTopWidth: 1, borderTopColor: AZULEJO }]}>
                    <Text style={S.topName}>{i + 1}. {name}</Text>
                    <Text style={S.topUnits}>{units} u.</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={S.sectionLabel}>Pedidos ({orders.length})</Text>
          {orders.length === 0 ? (
            <Text style={S.empty}>Sin pedidos en este período.</Text>
          ) : (
            orders.map(o => {
              const meta = STATUS_META[o.status] ?? STATUS_META.pendiente
              const hora = new Date(o.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
              return (
                <View key={o.id} style={S.order} wrap={false}>
                  <View style={S.orderTop}>
                    <View>
                      <Text style={S.orderName}>#{o.order_number} · {o.customer_name}</Text>
                      <Text style={S.orderMeta}>{hora} hs · {o.customer_phone}</Text>
                    </View>
                    <View style={S.orderRight}>
                      <Text style={[S.statusPill, { backgroundColor: meta.bg, color: meta.text }]}>{meta.label}</Text>
                      <Text style={S.orderTotal}>{fmtGs(o.total)}</Text>
                    </View>
                  </View>
                  <View style={S.itemsBox}>
                    {(o.order_items ?? []).map(it => {
                      const mods = (it.order_item_modifiers ?? []).map(m => m.modifier_name).join(', ')
                      return (
                        <View key={it.id} style={S.itemRow}>
                          <Text style={S.itemName}>{it.quantity}x {it.item_name}{mods ? ` (${mods})` : ''}</Text>
                          <Text style={S.itemSubtotal}>{fmtGs(lineSubtotal(it))}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )
            })
          )}
        </View>

        <View fixed style={S.footer}>
          <Text style={S.footerText}>{footerLine}</Text>
        </View>
      </Page>
    </Document>
  )
}
