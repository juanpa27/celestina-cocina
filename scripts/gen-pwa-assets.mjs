// Genera íconos maskable + splash screens de iOS desde logo-source.png
// Uso: node scripts/gen-pwa-assets.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT   = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC    = path.join(ROOT, 'logo-source.png')
const PUBLIC = path.join(ROOT, 'public')
const HTML   = path.join(ROOT, 'index.html')

const BG = { r: 28, g: 43, b: 54 }   // #1c2b36

// ── Tamaños de splash por dispositivo iOS ───────────────────────────────────
const SPLASHES = [
  { w: 640,  h: 1136, name: 'apple-splash-640-1136',
    media: '(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2)' },
  { w: 750,  h: 1334, name: 'apple-splash-750-1334',
    media: '(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2)' },
  { w: 828,  h: 1792, name: 'apple-splash-828-1792',
    media: '(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2)' },
  { w: 1125, h: 2436, name: 'apple-splash-1125-2436',
    media: '(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1170, h: 2532, name: 'apple-splash-1170-2532',
    media: '(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1179, h: 2556, name: 'apple-splash-1179-2556',
    media: '(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1242, h: 2208, name: 'apple-splash-1242-2208',
    media: '(device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1242, h: 2688, name: 'apple-splash-1242-2688',
    media: '(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1284, h: 2778, name: 'apple-splash-1284-2778',
    media: '(device-width:428px) and (device-height:926px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1290, h: 2796, name: 'apple-splash-1290-2796',
    media: '(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)' },
  { w: 1536, h: 2048, name: 'apple-splash-1536-2048',
    media: '(device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2)' },
  { w: 1668, h: 2388, name: 'apple-splash-1668-2388',
    media: '(device-width:834px) and (device-height:1194px) and (-webkit-device-pixel-ratio:2)' },
  { w: 2048, h: 2732, name: 'apple-splash-2048-2732',
    media: '(device-width:1024px) and (device-height:1366px) and (-webkit-device-pixel-ratio:2)' },
]

async function makeBackground(w, h) {
  return sharp({ create: { width: w, height: h, channels: 3, background: BG } })
    .raw()
    .toBuffer()
    .then(buf => sharp(buf, { raw: { width: w, height: h, channels: 3 } }))
}

// ── 1. Ícono maskable 512×512 ───────────────────────────────────────────────
async function genMaskable() {
  const SIZE = 512
  // Safe zone = 80% → logo al 68% para dejar margen cómodo al recorte circular
  const LOGO = Math.round(SIZE * 0.68)

  const logoBuffer = await sharp(SRC)
    .resize(LOGO, LOGO, { fit: 'contain', background: BG })
    .removeAlpha()
    .toBuffer()

  const bg = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BG } })
    .composite([{ input: logoBuffer, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer()

  const dest = path.join(PUBLIC, 'maskable-512x512.png')
  await sharp(bg).toFile(dest)
  const kb = Math.round(bg.length / 1024)
  console.log(`✓  maskable-512x512.png  (${kb} KB)`)
}

// ── 2. Splash screens iOS ───────────────────────────────────────────────────
async function genSplashes() {
  const links = []

  for (const { w, h, name, media } of SPLASHES) {
    // Logo = 38% de la dimensión corta del splash
    const logoSize = Math.round(Math.min(w, h) * 0.38)

    const logoBuffer = await sharp(SRC)
      .resize(logoSize, logoSize, { fit: 'contain', background: BG })
      .removeAlpha()
      .toBuffer()

    const dest = path.join(PUBLIC, `${name}.png`)

    await sharp({ create: { width: w, height: h, channels: 3, background: BG } })
      .composite([{ input: logoBuffer, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toFile(dest)

    const size = Math.round(readFileSync(dest).length / 1024)
    console.log(`✓  ${name}.png  (${size} KB)`)

    links.push(
      `    <link rel="apple-touch-startup-image" ` +
      `media="screen and (orientation: portrait) and ${media}" ` +
      `href="/${name}.png" />`
    )
  }

  return links
}

// ── 3. Inyectar <link> en index.html ───────────────────────────────────────
function injectLinks(links) {
  let html = readFileSync(HTML, 'utf8')

  // Elimina bloque previo si ya existe
  html = html.replace(
    /\n    <!-- iOS Splash Screens \(generado\) -->[^]*?<!-- \/iOS Splash Screens -->/,
    ''
  )

  const block = [
    '',
    '    <!-- iOS Splash Screens (generado) -->',
    ...links,
    '    <!-- /iOS Splash Screens -->',
  ].join('\n')

  html = html.replace('    <!-- iOS PWA -->', block + '\n\n    <!-- iOS PWA -->')
  writeFileSync(HTML, html)
  console.log(`\n✓  index.html actualizado con ${links.length} splash links`)
}

// ── 4. Actualizar manifest.json para referenciar maskable real ─────────────
function updateManifest() {
  const dest = path.join(PUBLIC, 'manifest.json')
  const manifest = JSON.parse(readFileSync(dest, 'utf8'))

  // Reemplazar referencia placeholder del maskable con el archivo real
  manifest.icons = manifest.icons.map(icon => {
    if (icon.purpose === 'maskable') {
      return { ...icon, src: '/maskable-512x512.png', sizes: '512x512' }
    }
    return icon
  })

  writeFileSync(dest, JSON.stringify(manifest, null, 2) + '\n')
  console.log('✓  manifest.json actualizado (maskable → maskable-512x512.png)')
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log('Generando assets PWA desde logo-source.png (1024×1024)...\n')
await genMaskable()
const links = await genSplashes()
injectLinks(links)
updateManifest()
console.log('\nListo ✓')
