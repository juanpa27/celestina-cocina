import { useState, useMemo } from 'react'
import {
  Document, Page, View, Text, Image,
  StyleSheet, Font, pdf, BlobProvider,
} from '@react-pdf/renderer'
import { BookOpen, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMenu } from '../../hooks/useMenu'
import { useConfig } from '../../hooks/useConfig'
import { calcDiscountedPrice } from '../../lib/utils'

// ── Fuentes ──────────────────────────────────────────────────────────────────

Font.register({
  family: 'TitanOne',
  src: 'https://fonts.gstatic.com/s/titanone/v17/mFTzWbsGxbbS_J5cQcjykw.ttf',
})

// Sin hifenación — los nombres de platos no deben cortarse
Font.registerHyphenationCallback(word => [word])

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtGs(n) {
  return 'Gs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ── Paleta ───────────────────────────────────────────────────────────────────

const AZUL      = '#1d5e8c'
const AMARILLO  = '#f2c14e'
const CREMA     = '#fdfbf6'
const AZ_CLARO  = '#5b96bf'
const TEXTO     = '#1c2b36'
const GRIS      = '#6b7280'
const GRIS_L    = '#9ca3af'

// ── Estilos PDF ──────────────────────────────────────────────────────────────

const S = StyleSheet.create({

  page: {
    backgroundColor: CREMA,
    paddingBottom: 46,
  },

  // ── Header ──
  header: {
    backgroundColor: AZUL,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: AMARILLO,
    flexShrink: 0,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerCenter: {
    flex: 1,
  },
  brand: {
    fontFamily: 'TitanOne',
    fontSize: 23,
    color: AMARILLO,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: AZ_CLARO,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerDate: {
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'right',
  },

  // ── Cuerpo ──
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  // ── Categoría ──
  cat: {
    marginBottom: 12,
  },
  catHdr: {
    backgroundColor: AZUL,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 1,
  },
  catName: {
    fontFamily: 'TitanOne',
    fontSize: 11,
    color: AMARILLO,
    letterSpacing: 0.3,
  },

  // ── Ítems ──
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeee8',
  },
  itemEven: {
    backgroundColor: 'rgba(29,94,140,0.03)',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: TEXTO,
  },
  itemMod: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    color: GRIS,
    marginTop: 2,
  },
  itemNotes: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    color: GRIS_L,
    marginTop: 1,
  },
  priceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  price: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: AZUL,
  },
  priceOld: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: GRIS_L,
    textDecoration: 'line-through',
    textAlign: 'right',
  },

  // ── Footer fijo en cada página ──
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    right: 20,
    backgroundColor: AZUL,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
})

// ── Documento PDF ─────────────────────────────────────────────────────────────

function CartaDocument({ categories, config, logoUrl }) {
  const whatsapp = config?.whatsapp_number ?? ''
  const fecha = new Date().toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const footerLine = whatsapp
    ? `Pedidos por WhatsApp: ${whatsapp}  ·  celestina-cocina.vercel.app`
    : `Pedidos por WhatsApp  ·  celestina-cocina.vercel.app`

  const cats = categories.filter(c => c.active)

  return (
    <Document title="Celestina Cocina — Carta" author="Celestina Cocina">
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View style={S.logoWrap}>
            <Image src={logoUrl} style={S.logo} />
          </View>
          <View style={S.headerCenter}>
            <Text style={S.brand}>CELESTINA COCINA</Text>
            <Text style={S.tagline}>PASTAS ARTESANALES  ·  CAAGUAZU, PARAGUAY</Text>
          </View>
          <Text style={S.headerDate}>Carta · {fecha}</Text>
        </View>

        {/* ── Categorías ── */}
        <View style={S.body}>
          {cats.map(cat => {
            const items = (cat.items ?? []).filter(i => i.available)
            if (!items.length) return null
            return (
              <View key={cat.id} style={S.cat} wrap={false}>
                <View style={S.catHdr}>
                  <Text style={S.catName}>{cat.name.toUpperCase()}</Text>
                </View>
                <View>
                  {items.map((item, idx) => {
                    const price = calcDiscountedPrice(item.price, item.discount_pct)
                    const hasDisc = item.discount_pct > 0
                    const mods = item.modifierGroups ?? []
                    return (
                      <View
                        key={item.id}
                        style={[S.itemRow, idx % 2 === 1 && S.itemEven]}
                      >
                        <View style={S.itemLeft}>
                          <Text style={S.itemName}>{item.name}</Text>
                          {mods.map(g => (
                            <Text key={g.id} style={S.itemMod}>
                              {g.required ? '★ ' : '◦ '}
                              {g.name}:{' '}
                              {g.modifiers.map(m =>
                                m.extra_price > 0
                                  ? `${m.name} (+${fmtGs(m.extra_price)})`
                                  : m.name
                              ).join(' \xB7 ')}
                            </Text>
                          ))}
                          {item.notes
                            ? <Text style={S.itemNotes}>{'⤷'} {item.notes}</Text>
                            : null}
                        </View>
                        <View style={S.priceCol}>
                          {hasDisc && (
                            <Text style={S.priceOld}>{fmtGs(item.price)}</Text>
                          )}
                          <Text style={S.price}>{fmtGs(price)}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Footer (fixed = aparece en cada página) ── */}
        <View fixed style={S.footer}>
          <Text style={S.footerText}>{footerLine}</Text>
        </View>

      </Page>
    </Document>
  )
}

// ── Página admin ──────────────────────────────────────────────────────────────

export default function CartaMenuPage() {
  const { data: categories = [], isLoading } = useMenu()
  const { data: config } = useConfig()
  const [generating, setGenerating] = useState(false)

  const logoUrl = `${window.location.origin}/logo-celestina.jpg`

  const activeCats = categories.filter(c => c.active)
  const totalItems = activeCats.reduce(
    (n, c) => n + (c.items ?? []).filter(i => i.available).length,
    0,
  )

  const docProps = useMemo(
    () => ({ categories, config, logoUrl }),
    [categories, config, logoUrl],
  )

  async function handleDownload() {
    if (!categories.length) return
    setGenerating(true)
    try {
      const blob = await pdf(<CartaDocument {...docProps} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'celestina-cocina-carta.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('No se pudo generar el PDF')
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#1c2b36' }}>
        Carta PDF
      </h1>
      <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
        Descargá la carta del menú activo para compartir por WhatsApp o imprimir.
      </p>

      {/* Resumen de contenido */}
      {!isLoading && (
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#eaf3f8' }}
            >
              <BookOpen size={20} style={{ color: '#1d5e8c' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>
                {activeCats.length} categorías · {totalItems} platos activos
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Solo se incluyen categorías e ítems visibles en el menú
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {activeCats.map(cat => {
              const n = (cat.items ?? []).filter(i => i.available).length
              return (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#374151' }}>{cat.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#eaf3f8', color: '#1d5e8c' }}
                  >
                    {n} {n === 1 ? 'plato' : 'platos'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin" style={{ color: '#1d5e8c' }} />
        </div>
      )}

      {/* Botón de descarga */}
      <button
        onClick={handleDownload}
        disabled={isLoading || generating || !categories.length}
        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: '#1d5e8c', color: '#fff' }}
      >
        {generating
          ? <><Loader2 size={18} className="animate-spin" /> Generando PDF…</>
          : <><FileText size={18} /> Descargar carta.pdf</>
        }
      </button>
      <p className="text-xs text-center mt-2" style={{ color: '#9ca3af' }}>
        Descarga directa · texto seleccionable · sin diálogo de impresión
      </p>

      {/* Preview en iframe */}
      {!isLoading && categories.length > 0 && (
        <div className="mt-6">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: '#6b7280' }}
          >
            Vista previa
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #e5e7eb', height: 540 }}
          >
            <BlobProvider document={<CartaDocument {...docProps} />}>
              {({ url, loading, error }) => {
                if (loading) return (
                  <div
                    className="h-full flex items-center justify-center"
                    style={{ background: '#f9fafb' }}
                  >
                    <Loader2 size={20} className="animate-spin" style={{ color: '#1d5e8c' }} />
                  </div>
                )
                if (error || !url) return (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs" style={{ color: '#9ca3af' }}>
                      Preview no disponible — usá el botón de descarga
                    </p>
                  </div>
                )
                return (
                  <iframe
                    src={url}
                    title="Vista previa de la carta"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                )
              }}
            </BlobProvider>
          </div>
        </div>
      )}
    </div>
  )
}
