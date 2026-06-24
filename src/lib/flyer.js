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

async function renderToBlob(node, { format = 'webp' } = {}) {
  const opts = { pixelRatio: 1, cacheBust: true, backgroundColor: '#fdfbf6' }
  await toCanvas(node, opts)
  const canvas = await toCanvas(node, opts)
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/webp'
  const quality = format === 'jpg' ? 0.92 : 0.9
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob devolvió null'))), mime, quality)
  })
}

// Genera la imagen a partir del nodo del flyer (1080×1920) y dispara la descarga.
// Devuelve el peso en bytes del archivo generado.
export async function exportFlyer(node, { format = 'webp', fileName = 'flyer' } = {}) {
  const blob = await renderToBlob(node, { format })
  const ext = format === 'jpg' ? 'jpg' : 'webp'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(fileName)}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return blob.size
}

// Comparte la imagen via Web Share API (mobile); descarga como fallback en desktop.
export async function shareFlyer(node, { fileName = 'celestina', title = 'Celestina Cocina' } = {}) {
  const blob = await renderToBlob(node, { format: 'jpg' })
  const file = new File([blob], `${slugify(fileName)}.jpg`, { type: 'image/jpeg' })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(fileName)}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  return blob.size
}
