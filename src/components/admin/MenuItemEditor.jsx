import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatPrice, calcDiscountedPrice } from '../../lib/utils'

const schema = z.object({
  name:         z.string().min(2, 'Requerido'),
  description:  z.string().optional(),
  price:        z.coerce.number().min(1, 'Requerido'),
  notes:        z.string().optional(),
  available:    z.boolean(),
  is_popular:   z.boolean(),
  discount_pct: z.coerce.number().min(0).max(100),
})

// Sirve para EDITAR (recibe `item`) o CREAR (recibe `categoryId` + `sortOrder`).
export default function MenuItemEditor({ item = null, categoryId = null, sortOrder = 0, onClose }) {
  const queryClient = useQueryClient()
  const isCreate = !item

  // Id estable para el path de la imagen, también en modo crear (antes de existir en la BD).
  const [itemId] = useState(() => item?.id ?? crypto.randomUUID())
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(item?.image_url ?? null)
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? null)
  const fileRef = useRef()

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         item?.name ?? '',
      description:  item?.description ?? '',
      price:        item?.price ?? '',
      notes:        item?.notes ?? '',
      available:    item?.available ?? true,
      is_popular:   item?.is_popular ?? false,
      discount_pct: item?.discount_pct ?? 0,
    },
  })

  const watchedPrice = watch('price')
  const watchedDiscount = watch('discount_pct')
  const showPreview = watchedDiscount > 0 && watchedPrice > 0
  const previewEffective = showPreview ? calcDiscountedPrice(Number(watchedPrice), Number(watchedDiscount)) : null

  // Cerrar con Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${itemId}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('menu-images')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(path)

      // En edición persistimos ya; en creación se guarda recién en el INSERT del submit.
      if (!isCreate) {
        await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', item.id)
        queryClient.invalidateQueries({ queryKey: ['menu'] })
      }
      setPreviewUrl(publicUrl)
      setImageUrl(publicUrl)
      toast.success('Imagen actualizada')
    } catch {
      toast.error('No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data) {
    const payload = {
      name:         data.name,
      description:  data.description || null,
      price:        data.price,
      notes:        data.notes || null,
      available:    data.available,
      is_popular:   data.is_popular,
      discount_pct: data.discount_pct,
    }

    let error
    if (isCreate) {
      ;({ error } = await supabase.from('menu_items').insert({
        id:          itemId,
        category_id: categoryId,
        sort_order:  sortOrder,
        image_url:   imageUrl,
        ...payload,
      }))
    } else {
      ;({ error } = await supabase.from('menu_items').update(payload).eq('id', item.id))
    }

    if (error) {
      toast.error('No se pudo guardar.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['menu'] })
    toast.success(isCreate ? 'Plato creado' : 'Plato actualizado')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(28,43,54,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90dvh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h2 className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>
            {isCreate ? 'Nuevo plato' : 'Editar plato'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Imagen */}
          <div
            className="relative cursor-pointer group"
            style={{ aspectRatio: '4/3', background: '#eaf3f8' }}
            onClick={() => fileRef.current?.click()}
          >
            {previewUrl
              ? <img src={previewUrl} alt={previewUrl ? 'Vista previa' : ''} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-1 font-display text-5xl">🍽<span className="text-xs font-sans" style={{ color: '#5b96bf' }}>Tocá para subir foto</span></div>
            }
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(28,43,54,0.55)' }}>
              {uploading
                ? <Loader2 size={28} className="text-white animate-spin" />
                : <><Upload size={28} className="text-white" /><span className="text-white text-sm font-bold">Cambiar imagen</span></>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
            {/* Disponible */}
            <label className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: '#1c2b36' }}>Disponible</span>
              <input type="checkbox" {...register('available')} className="w-5 h-5 rounded accent-celestina-azul" />
            </label>

            {/* Más pedido */}
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold" style={{ color: '#1c2b36' }}>Más pedido</span>
                <p className="text-xs mt-0.5" style={{ color: '#7c8a93' }}>Muestra borde dorado y badge en la card</p>
              </div>
              <input type="checkbox" {...register('is_popular')} className="w-5 h-5 rounded accent-celestina-azul" />
            </label>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Nombre</label>
              <input {...register('name')} placeholder="Coca-Cola 500 ml" className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none" style={{ borderColor: errors.name ? '#ef4444' : '#e5e7eb', fontFamily: 'inherit' }} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Descripción</label>
              <textarea {...register('description')} rows={2} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ borderColor: '#e5e7eb', fontFamily: 'inherit' }} />
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Precio base (Gs)</label>
              <input {...register('price')} type="number" step="1000" placeholder="10000" className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none" style={{ borderColor: errors.price ? '#ef4444' : '#e5e7eb', fontFamily: 'inherit' }} />
              {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price.message}</p>}
            </div>

            {/* Descuento */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Descuento (%)</label>
              <input
                {...register('discount_pct')}
                type="number"
                min="0"
                max="100"
                step="5"
                placeholder="0"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: errors.discount_pct ? '#ef4444' : '#e5e7eb', fontFamily: 'inherit' }}
              />
              {errors.discount_pct && <p className="text-xs text-red-500 mt-0.5">{errors.discount_pct.message}</p>}
              {showPreview && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#1d5e8c' }}>
                  Precio con descuento: <strong>{formatPrice(previewEffective)}</strong>
                </p>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Notas (presentación, tiempo, etc.)</label>
              <input {...register('notes')} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none" style={{ borderColor: '#e5e7eb', fontFamily: 'inherit' }} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1d5e8c' }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isCreate ? 'Crear plato' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
