import { toCanvas } from 'html-to-image'

// Dimensiones óptimas para estados de IG / WhatsApp (9:16)
export const FLYER_W = 1080
export const FLYER_H = 1920

function slugify(text) {
  return (text ?? 'flyer')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // saca tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'flyer'
}

// Genera la imagen a partir del nodo del flyer (1080×1920) y dispara la descarga.
// Devuelve el peso en bytes del archivo generado.
export async function exportFlyer(node, { format = 'webp', fileName = 'flyer' } = {}) {
  const opts = { pixelRatio: 1, cacheBust: true, backgroundColor: '#fdfbf6' }

  // Primera pasada "en frío": fuerza a html-to-image a precargar fuentes e imágenes.
  // La segunda pasada ya las tiene incrustadas y sale completa.
  await toCanvas(node, opts)
  const canvas = await toCanvas(node, opts)

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/webp'
  const quality = format === 'jpg' ? 0.92 : 0.9

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob devolvió null'))), mime, quality)
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(fileName)}.${format === 'jpg' ? 'jpg' : 'webp'}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  return blob.size
}
