import { useState, useMemo } from 'react'
import {
  Document, Page, View, Text, Image,
  StyleSheet, pdf, BlobProvider,
} from '@react-pdf/renderer'
import { BookOpen, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMenu } from '../../hooks/useMenu'
import { useConfig } from '../../hooks/useConfig'
import { calcDiscountedPrice } from '../../lib/utils'
import '../../lib/pdfFonts' // registra Fraunces + DM Sans para react-pdf (efecto de módulo)

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtGs(n) {
  return 'Gs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ── Paleta (sin amarillo) ─────────────────────────────────────────────────────

const AZUL      = '#1d5e8c'
const AMARILLO  = '#f2c14e'   // solo para la banda de azulejo (no para texto)
const CREMA     = '#fdfbf6'
const AZ_CLARO  = '#5b96bf'
const AZULEJO   = '#eaf3f8'
const TEXTO     = '#1c2b36'
const GRIS_L    = '#9ca3af'

// Altura reservada arriba en cada página para el header fijo (logo + azulejo).
const HEADER_H = 96

// ── Estilos PDF ──────────────────────────────────────────────────────────────

const CARD_GAP = 12

const S = StyleSheet.create({

  page: {
    backgroundColor: CREMA,
    paddingTop: HEADER_H,   // deja lugar al header fijo en TODAS las páginas
    paddingBottom: 40,
  },

  // ── Header (fijo arriba en cada página) ──
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    backgroundColor: AZUL,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: CREMA,
    marginRight: 14,
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
  },
  brand: {
    fontFamily: 'Fraunces',
    fontWeight: 700,
    fontSize: 25,
    color: CREMA,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: 'DM Sans',
    fontWeight: 500,
    fontSize: 7.5,
    color: AZ_CLARO,
    letterSpacing: 2,
    marginTop: 3,
  },
  headerDate: {
    fontFamily: 'DM Sans',
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },

  // ── Azulejo stripe ──
  azuStrip: {
    flexDirection: 'row',
    height: 9,
    overflow: 'hidden',
  },

  // ── Cuerpo ──
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,   // aire bajo el header fijo, en cada página
  },

  // ── Categoría ──
  cat: {
    marginBottom: 16,
  },
  catHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  catName: {
    fontFamily: 'Fraunces',
    fontWeight: 700,
    fontSize: 16,
    color: AZUL,
    letterSpacing: -0.2,
    marginRight: 8,
  },
  catRule: {
    flex: 1,
    height: 2,
    backgroundColor: AZULEJO,
    borderRadius: 1,
  },

  // ── Grilla de tarjetas ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: (595 - 44 - CARD_GAP) / 2,   // A4 595 - padding 22*2 - gap
    marginBottom: CARD_GAP,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#edf1f4',
    overflow: 'hidden',
  },
  cardRightGap: {
    marginRight: CARD_GAP,
  },
  photo: {
    width: '100%',
    height: 108,
    objectFit: 'cover',
  },
  // Bebidas (botellas / latas): la foto suele ser vertical con fondo — 'contain'
  // sobre fondo claro la muestra entera y centrada en vez de recortarla fea.
  photoBebida: {
    width: '100%',
    height: 108,
    objectFit: 'contain',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
  },
  photoPlaceholder: {
    width: '100%',
    height: 108,
    backgroundColor: AZULEJO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderMark: {
    fontFamily: 'Fraunces',
    fontWeight: 700,
    fontSize: 30,
    color: '#c4dcea',
  },
  discBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: AZUL,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  discBadgeText: {
    fontFamily: 'DM Sans',
    fontWeight: 700,
    fontSize: 7,
    color: CREMA,
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 9,
  },
  cardName: {
    fontFamily: 'Fraunces',
    fontWeight: 600,
    fontSize: 10.5,
    color: TEXTO,
    lineHeight: 1.15,
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontFamily: 'DM Sans',
    fontWeight: 700,
    fontSize: 12,
    color: AZUL,
  },
  priceOld: {
    fontFamily: 'DM Sans',
    fontSize: 8,
    color: GRIS_L,
    textDecoration: 'line-through',
    marginLeft: 6,
  },

  // ── Footer fijo en cada página ──
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 22,
    right: 22,
    backgroundColor: AZUL,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  footerText: {
    fontFamily: 'DM Sans',
    fontWeight: 500,
    fontSize: 8,
    color: 'rgba(255,255,255,0.85)',
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

        {/* ── Header + azulejo (fijo arriba en todas las páginas) ── */}
        <View style={S.headerFixed} fixed>
          <View style={S.header}>
            <Image src={logoUrl} style={S.logo} />
            <View style={S.headerCenter}>
              <Text style={S.brand}>Celestina Cocina</Text>
              <Text style={S.tagline}>PASTAS CASERAS Y MÁS  ·  CAAGUAZÚ, PARAGUAY</Text>
            </View>
            <Text style={S.headerDate}>Carta · {fecha}</Text>
          </View>
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
        </View>

        {/* ── Categorías ── */}
        <View style={S.body}>
          {cats.map(cat => {
            const items = (cat.items ?? []).filter(i => i.available)
            if (!items.length) return null
            const isBebida = /bebida/i.test(cat.name)
            return (
              <View key={cat.id} style={S.cat} wrap>
                {/* minPresenceAhead: no dejar el título de categoría solo al pie
                    de una página; si no entra al menos una fila de tarjetas
                    debajo, empuja el título a la página siguiente. */}
                <View style={S.catHdr} minPresenceAhead={170}>
                  <Text style={S.catName}>{cat.name}</Text>
                  <View style={S.catRule} />
                </View>
                <View style={S.grid}>
                  {items.map((item, idx) => {
                    const price = calcDiscountedPrice(item.price, item.discount_pct)
                    const hasDisc = item.discount_pct > 0
                    return (
                      <View
                        key={item.id}
                        style={[S.card, idx % 2 === 0 && S.cardRightGap]}
                        wrap={false}
                      >
                        {item.image_url
                          ? <Image src={item.image_url} style={isBebida ? S.photoBebida : S.photo} cache />
                          : (
                            <View style={S.photoPlaceholder}>
                              <Text style={S.photoPlaceholderMark}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )
                        }
                        {hasDisc && (
                          <View style={S.discBadge}>
                            <Text style={S.discBadgeText}>{item.discount_pct}% OFF</Text>
                          </View>
                        )}
                        <View style={S.cardBody}>
                          <Text style={S.cardName}>{item.name}</Text>
                          <View style={S.priceRow}>
                            <Text style={S.price}>{fmtGs(price)}</Text>
                            {hasDisc && <Text style={S.priceOld}>{fmtGs(item.price)}</Text>}
                          </View>
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

  const logoUrl = `${window.location.origin}/logo-source.png`

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
