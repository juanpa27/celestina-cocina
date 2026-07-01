import { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react'
import { Download, Loader2, UtensilsCrossed, LayoutGrid, Type, ImagePlus, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMenuAdmin } from '../../hooks/useMenu'
import { exportFlyer, FLYER_W, FLYER_H } from '../../lib/flyer'
import DishFlyer from '../../components/admin/flyers/DishFlyer'
import CategoryFlyer from '../../components/admin/flyers/CategoryFlyer'
import TextHeroFlyer, { autoSplitHeroName } from '../../components/admin/flyers/TextHeroFlyer'
import TextPhotoFlyer from '../../components/admin/flyers/TextPhotoFlyer'

export default function FlyersPage() {
  const { data: categories, isLoading } = useMenuAdmin()

  const [mode, setMode] = useState('dish')        // 'dish' | 'category' | 'hero' | 'phototext'
  const [categoryId, setCategoryId] = useState(null)
  const [dishId, setDishId] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [format, setFormat] = useState('webp')    // 'webp' | 'jpg'
  const [exporting, setExporting] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)  // foto libre subida para el modo "phototext" (blob: URL local)
  const photoInputRef = useRef(null)

  const flyerRef = useRef(null)
  const boxRef = useRef(null)
  const [scale, setScale] = useState(0.33)

  // La URL del blob solo vive en memoria del navegador — liberarla al cambiar/desmontar.
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
  }

  // Escala el lienzo de 1080px al ancho disponible del contenedor de preview.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const update = () => setScale(box.clientWidth / FLYER_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // Defaults una vez que carga el menú
  const allDishes = useMemo(
    () => (categories ?? []).flatMap(c => (c.items ?? []).map(it => ({ ...it, categoryName: c.name }))),
    [categories],
  )
  const activeCategory = (categories ?? []).find(c => c.id === categoryId) ?? categories?.[0] ?? null
  const activeDish =
    allDishes.find(d => d.id === dishId)
    ?? allDishes.find(d => d.is_popular)
    ?? allDishes[0]
    ?? null

  // Cuando cambia el plato en modo hero/phototext, actualiza el nombre pre-dividido
  function handleDishChange(id) {
    setDishId(id)
    if (mode === 'hero' || mode === 'phototext') {
      const dish = allDishes.find(d => d.id === id)
      if (dish) setDisplayName(autoSplitHeroName(dish.name))
    }
  }

  function handleModeChange(m) {
    setMode(m)
    if ((m === 'hero' || m === 'phototext') && activeDish) {
      setDisplayName(autoSplitHeroName(activeDish.name))
    }
  }

  async function handleDownload() {
    if (!flyerRef.current) return
    setExporting(true)
    try {
      const name = mode === 'category'
        ? `celestina-${activeCategory?.name ?? 'menu'}`
        : `celestina-${activeDish?.name ?? 'plato'}`
      const bytes = await exportFlyer(flyerRef.current, { format, fileName: name })
      toast.success(`Flyer listo · ${(bytes / 1024).toFixed(0)} KB`)
    } catch (e) {
      console.error(e)
      toast.error('No se pudo generar el flyer.')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin" style={{ color: '#1d5e8c' }} size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <header className="mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: '#1c2b36' }}>Flyers</h1>
        <p className="text-sm mt-1" style={{ color: '#7c8a93' }}>
          Generá imágenes listas para estados de WhatsApp e Instagram (1080×1920).
        </p>
      </header>

      <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
        {/* ── Controles ── */}
        <div className="flex flex-col gap-5 order-2 md:order-1">
          {/* Tipo de flyer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#1d5e8c' }}>Tipo de flyer</label>
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn active={mode === 'dish'} onClick={() => handleModeChange('dish')} icon={UtensilsCrossed} label="Por plato" />
              <ModeBtn active={mode === 'category'} onClick={() => handleModeChange('category')} icon={LayoutGrid} label="Categoría" />
              <ModeBtn active={mode === 'hero'} onClick={() => handleModeChange('hero')} icon={Type} label="Texto hero" />
              <ModeBtn active={mode === 'phototext'} onClick={() => handleModeChange('phototext')} icon={ImagePlus} label="Texto + foto" />
            </div>
          </div>

          {/* Selección de plato (dish + hero + phototext, para precio y nombre por defecto) */}
          {(mode === 'dish' || mode === 'hero' || mode === 'phototext') && (
            <Field label="Plato">
              <select
                value={activeDish?.id ?? ''}
                onChange={e => handleDishChange(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                style={{ borderColor: '#e5e7eb' }}
              >
                {(categories ?? []).map(c => (
                  <optgroup key={c.id} label={c.name}>
                    {(c.items ?? []).map(it => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}

          {/* Campo de nombre personalizado — hero y phototext comparten el mismo texto gigante */}
          {(mode === 'hero' || mode === 'phototext') && (
            <Field label="Texto del flyer">
              <textarea
                value={displayName}
                onChange={e => setDisplayName(e.target.value.toUpperCase())}
                placeholder={'TAG\nLIA\nTEL\nLES'}
                rows={4}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none font-bold tracking-widest resize-none"
                style={{ borderColor: '#e5e7eb', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <p className="text-xs mt-1.5" style={{ color: '#7c8a93' }}>
                Cada línea = una línea gigante en el flyer. El tamaño se adapta automáticamente.
              </p>
            </Field>
          )}

          {/* Foto libre — solo modo phototext, no toca el catálogo de platos */}
          {mode === 'phototext' && (
            <Field label="Foto para el flyer">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ width: 64, height: 64, background: '#eaf3f8', border: '1.5px dashed #5b96bf' }}
                >
                  {photoUrl
                    ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    : <Upload size={20} style={{ color: '#1d5e8c' }} />
                  }
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="text-sm font-bold text-left"
                    style={{ color: '#1d5e8c' }}
                  >
                    {photoUrl ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {photoUrl && (
                    <button type="button" onClick={removePhoto} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#7c8a93' }}>
                      <X size={12} /> Quitar
                    </button>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#7c8a93' }}>
                Cualquier foto sirve (no hace falta recorte especial) — va centrada y con los bordes difuminados sobre el texto.
              </p>
            </Field>
          )}

          {/* Selección de categoría */}
          {mode === 'category' && (
            <Field label="Categoría">
              <select
                value={activeCategory?.id ?? ''}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                style={{ borderColor: '#e5e7eb' }}
              >
                {(categories ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs mt-1.5" style={{ color: '#7c8a93' }}>
                Muestra hasta 4 platos, priorizando los destacados y con descuento.
              </p>
            </Field>
          )}

          {/* Formato */}
          <Field label="Formato">
            <div className="grid grid-cols-2 gap-2">
              <ModeBtn active={format === 'webp'} onClick={() => setFormat('webp')} label="WebP" sub="más liviano" />
              <ModeBtn active={format === 'jpg'} onClick={() => setFormat('jpg')} label="JPG" sub="compatible" />
            </div>
          </Field>

          <button
            onClick={handleDownload}
            disabled={exporting}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1d5e8c' }}
          >
            {exporting ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
            {exporting ? 'Generando…' : 'Descargar flyer'}
          </button>
        </div>

        {/* ── Preview ── */}
        <div className="order-1 md:order-2 mx-auto w-full max-w-[360px]">
          <div
            ref={boxRef}
            className="w-full overflow-hidden rounded-3xl mx-auto"
            style={{ aspectRatio: `${FLYER_W}/${FLYER_H}`, boxShadow: '0 12px 40px rgba(29,94,140,0.18)', border: '1px solid #e3edf2' }}
          >
            <div style={{ width: FLYER_W, height: FLYER_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <div ref={flyerRef}>
                {mode === 'dish' && <DishFlyer item={activeDish} categoryName={activeDish?.categoryName} />}
                {mode === 'category' && <CategoryFlyer category={activeCategory} />}
                {mode === 'hero' && <TextHeroFlyer item={activeDish} displayName={displayName} />}
                {mode === 'phototext' && <TextPhotoFlyer item={activeDish} displayName={displayName} photoUrl={photoUrl} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#1d5e8c' }}>{label}</label>
      {children}
    </div>
  )
}

function ModeBtn({ active, onClick, icon: Icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold transition-colors"
      style={{
        background: active ? '#1d5e8c' : '#fff',
        color: active ? '#fff' : '#1c2b36',
        border: `1.5px solid ${active ? '#1d5e8c' : '#e5e7eb'}`,
      }}
    >
      {Icon && <Icon size={18} />}
      <span>{label}</span>
      {sub && <span className="text-[10px] font-medium" style={{ color: active ? '#bcd7ea' : '#7c8a93' }}>{sub}</span>}
    </button>
  )
}
