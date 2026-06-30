import { useState, useMemo } from 'react'
import { BookOpen, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMenu } from '../../hooks/useMenu'
import { useConfig } from '../../hooks/useConfig'
import { calcDiscountedPrice } from '../../lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtGs(n) {
  return 'Gs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ── Generador de HTML ────────────────────────────────────────────────────────

function buildCartaHTML({ categories, config, origin }) {
  const whatsapp = config?.whatsapp_number ?? ''
  const logo = `${origin}/logo-celestina.jpg`
  const fecha = new Date().toLocaleDateString('es', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const catBlocks = categories
    .filter(c => c.active)
    .map(cat => {
      const items = (cat.items ?? []).filter(i => i.available)
      if (!items.length) return ''

      const rows = items.map(item => {
        const price = calcDiscountedPrice(item.price, item.discount_pct)
        const hasDiscount = item.discount_pct > 0

        const priceCol = hasDiscount
          ? `<div class="price-old">${fmtGs(item.price)}</div><div class="price">${fmtGs(price)}</div>`
          : `<div class="price">${fmtGs(price)}</div>`

        const mods = (item.modifierGroups ?? []).map(g => {
          const opts = g.modifiers
            .map(m => m.extra_price > 0
              ? `${m.name}&thinsp;<em>(+${fmtGs(m.extra_price)})</em>`
              : m.name)
            .join(' &middot; ')
          const req = g.required
            ? '<span class="req">&#10022;</span>'
            : '<span class="opt">&#9702;</span>'
          return `<div class="mod">${req} <b>${g.name}:</b> ${opts}</div>`
        }).join('')

        const notes = item.notes
          ? `<div class="notes">&#8627; ${item.notes}</div>`
          : ''

        return `
<div class="item">
  <div class="item-body">
    <div class="item-name">${item.name}</div>
    ${mods}${notes}
  </div>
  <div class="item-prices">${priceCol}</div>
</div>`
      }).join('')

      return `
<div class="cat">
  <div class="cat-hdr">${cat.name.toUpperCase()}</div>
  <div class="cat-items">${rows}</div>
</div>`
    }).join('')

  const contactLine = whatsapp
    ? `&#128241; WhatsApp: <b>${whatsapp}</b> &nbsp;&bull;&nbsp; &#127760; celestina-cocina.vercel.app`
    : `&#128241; Pedís por WhatsApp &nbsp;&bull;&nbsp; &#127760; celestina-cocina.vercel.app`

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Celestina Cocina &mdash; Carta</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Titan+One&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@page{size:A4 portrait;margin:0}

body{
  font-family:'DM Sans',system-ui,sans-serif;
  color:#1c2b36;
  background:#f3f4f6;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

/* ── Azulejo tile pattern ── */
.tile{
  width:100%;
  height:52px;
  background-color:#1d5e8c;
  background-image:
    linear-gradient(135deg,#f2c14e 25%,transparent 25%),
    linear-gradient(225deg,#f2c14e 25%,transparent 25%),
    linear-gradient(315deg,#f2c14e 25%,transparent 25%),
    linear-gradient( 45deg,#f2c14e 25%,transparent 25%);
  background-size:26px 26px;
  background-position:0 0,0 13px,13px -13px,-13px 0;
  flex-shrink:0;
}

/* ── Cover ── */
.cover{
  width:210mm;
  height:297mm;
  background:#1d5e8c;
  display:flex;
  flex-direction:column;
  align-items:stretch;
  page-break-after:always;
  break-after:page;
  overflow:hidden;
}

.cover-body{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:0 52px;
  gap:0;
}

.cover-logo{
  width:100px;
  height:100px;
  border-radius:50%;
  border:4px solid #f2c14e;
  object-fit:cover;
  box-shadow:0 8px 32px rgba(0,0,0,0.28);
  margin-bottom:28px;
}

.cover-title{
  font-family:'Titan One',cursive;
  font-size:88px;
  line-height:.88;
  color:#f2c14e;
  text-align:center;
  letter-spacing:-1px;
  text-shadow:2px 4px 0 rgba(0,0,0,0.22);
  margin-bottom:18px;
}

.cover-tagline{
  font-size:13px;
  letter-spacing:5px;
  text-transform:uppercase;
  color:#5b96bf;
  text-align:center;
  margin-bottom:36px;
}

.cover-rule{
  width:56px;
  height:3px;
  border-radius:2px;
  background:#f2c14e;
  opacity:.5;
  margin-bottom:36px;
}

.cover-contact{
  text-align:center;
  color:rgba(255,255,255,.88);
  font-size:15px;
  line-height:2;
  margin-bottom:28px;
}
.cover-contact strong{color:#f2c14e;font-size:18px}
.cover-contact .web{color:#5b96bf;font-size:13px}

.cover-box{
  background:rgba(0,0,0,.18);
  border:1px solid rgba(255,255,255,.12);
  border-radius:14px;
  padding:18px 26px;
  max-width:340px;
  color:rgba(255,255,255,.72);
  font-size:13px;
  text-align:center;
  line-height:1.75;
}

/* ── Content ── */
.content{
  width:210mm;
  min-height:297mm;
  background:#fdfbf6;
}

.pg-hdr{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10mm 14mm 4mm;
  border-bottom:2.5px solid #1d5e8c;
}
.pg-logo{
  width:28px;height:28px;
  border-radius:50%;
  object-fit:cover;
  border:1.5px solid #f2c14e;
}
.pg-brand{
  font-family:'Titan One',cursive;
  font-size:15px;
  color:#1d5e8c;
}
.pg-date{
  margin-left:auto;
  font-size:10px;
  color:#9ca3af;
}

.pg-body{padding:7mm 14mm}

/* ── Category ── */
.cat{margin-bottom:7mm;break-inside:avoid}

.cat-hdr{
  font-family:'Titan One',cursive;
  font-size:14px;
  letter-spacing:.4px;
  background:#1d5e8c;
  color:#f2c14e;
  padding:7px 12px;
  border-radius:6px 6px 0 0;
}

.cat-items{
  border:1.5px solid #e5e7eb;
  border-top:none;
  border-radius:0 0 6px 6px;
  overflow:hidden;
}

/* ── Item ── */
.item{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  padding:6px 12px;
  border-bottom:1px solid #f3f4f6;
}
.item:last-child{border-bottom:none}
.item:nth-child(even){background:rgba(29,94,140,.03)}

.item-body{flex:1;min-width:0}

.item-name{
  font-size:12.5px;
  font-weight:600;
  color:#1c2b36;
  line-height:1.3;
}

.mod{
  font-size:10.5px;
  color:#6b7280;
  margin-top:2px;
  font-style:italic;
}
.req{color:#f2c14e}
.opt{color:#9ca3af}

.notes{
  font-size:10px;
  color:#9ca3af;
  font-style:italic;
  margin-top:1px;
}

.item-prices{
  text-align:right;
  flex-shrink:0;
  white-space:nowrap;
}
.price{
  font-size:12.5px;
  font-weight:700;
  color:#1d5e8c;
}
.price-old{
  font-size:10px;
  color:#9ca3af;
  text-decoration:line-through;
}

/* ── Footer ── */
.footer{
  margin:6mm 14mm 10mm;
  padding:10px 16px;
  background:#1d5e8c;
  border-radius:8px;
  color:rgba(255,255,255,.88);
  font-size:11px;
  text-align:center;
  line-height:1.65;
}
.footer b{color:#f2c14e}

/* ── Screen ── */
@media screen{
  body{
    display:flex;flex-direction:column;
    align-items:center;gap:28px;padding:28px;
  }
  .cover,.content{box-shadow:0 8px 40px rgba(0,0,0,.14)}
}
@media print{
  body{background:#fff;gap:0;padding:0}
  .cover,.content{box-shadow:none}
}
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <div class="tile"></div>

  <div class="cover-body">
    <img src="${logo}" class="cover-logo" alt="Celestina Cocina" onerror="this.style.display='none'">

    <div class="cover-title">CELESTINA<br>COCINA</div>
    <div class="cover-tagline">pastas artesanales &middot; Caaguaz&uacute;, Paraguay</div>

    <div class="cover-rule"></div>

    <div class="cover-contact">
      Para hacer tu pedido:<br>
      <strong>&#128241; WhatsApp${whatsapp ? `<br>${whatsapp}` : ''}</strong><br>
      <span class="web">&#127760; celestina-cocina.vercel.app</span>
    </div>

    <div class="cover-box">
      Eleg&iacute; lo que quer&eacute;s, anotá el nombre del plato y la cantidad, y escribinos por WhatsApp con tu nombre y direcci&oacute;n de entrega. ¡Te confirmamos el pedido enseguida!
    </div>
  </div>

  <div class="tile"></div>
</div>

<!-- CONTENIDO -->
<div class="content">
  <div class="pg-hdr">
    <img src="${logo}" class="pg-logo" alt="" onerror="this.style.display='none'">
    <span class="pg-brand">Celestina Cocina</span>
    <span class="pg-date">Carta &middot; ${fecha}</span>
  </div>

  <div class="pg-body">
    ${catBlocks}
  </div>

  <div class="footer">
    ${contactLine}<br>
    Enviá el detalle de tu pedido con nombre y direcci&oacute;n de entrega
  </div>
</div>

</body>
</html>`
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function CartaMenuPage() {
  const { data: categories = [], isLoading } = useMenu()
  const { data: config } = useConfig()
  const [generating, setGenerating] = useState(false)

  const activeCategories = categories.filter(c => c.active)
  const totalItems = activeCategories.reduce(
    (sum, c) => sum + (c.items ?? []).filter(i => i.available).length,
    0,
  )

  const cartaHTML = useMemo(
    () => categories.length
      ? buildCartaHTML({ categories, config, origin: window.location.origin })
      : null,
    [categories, config],
  )

  function handleGenerate() {
    if (!cartaHTML) return
    setGenerating(true)
    const win = window.open('', '_blank', 'width=960,height=800')
    if (!win) {
      toast.error('Habilitá las ventanas emergentes para generar el PDF')
      setGenerating(false)
      return
    }
    win.document.open()
    win.document.write(cartaHTML)
    win.document.close()
    win.onload = () => {
      win.focus()
      // Esperar fuentes antes de imprimir
      win.document.fonts?.ready
        .then(() => win.print())
        .catch(() => win.print())
    }
    setGenerating(false)
  }

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#1c2b36' }}>
        Carta para PDF
      </h1>
      <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
        Genera la carta completa del menú activo para compartir por WhatsApp o imprimir en papel.
      </p>

      {/* Resumen de contenido */}
      {!isLoading && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#eaf3f8' }}
            >
              <BookOpen size={20} style={{ color: '#1d5e8c' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>
                {activeCategories.length} categorías · {totalItems} platos activos
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Solo se incluyen categorías e ítems visibles en el menú
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {activeCategories.map(cat => {
              const count = (cat.items ?? []).filter(i => i.available).length
              return (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#374151' }}>{cat.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#eaf3f8', color: '#1d5e8c' }}
                  >
                    {count} {count === 1 ? 'plato' : 'platos'}
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

      {/* Botón principal */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || generating || !cartaHTML}
        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: '#1d5e8c', color: '#fff' }}
      >
        {generating
          ? <><Loader2 size={18} className="animate-spin" /> Generando…</>
          : <><FileText size={18} /> Generar PDF</>
        }
      </button>

      <p className="text-xs text-center mt-3" style={{ color: '#9ca3af' }}>
        Se abrirá una vista previa. En el diálogo elegí{' '}
        <strong style={{ color: '#374151' }}>"Guardar como PDF"</strong> como destino.
      </p>

      {/* Vista previa en iframe */}
      {cartaHTML && (
        <div className="mt-6">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: '#6b7280' }}
          >
            Vista previa
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #e5e7eb', height: 520 }}
          >
            <iframe
              srcDoc={cartaHTML}
              title="Vista previa de la carta"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: '#9ca3af' }}>
            Podés scrollear en la preview para ver todo el contenido
          </p>
        </div>
      )}
    </div>
  )
}
