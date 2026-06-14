import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  name:        z.string().min(2, 'Requerido'),
  description: z.string().optional(),
  price:       z.coerce.number().min(1, 'Requerido'),
  notes:       z.string().optional(),
  available:   z.boolean(),
})

export default function MenuItemEditor({ item, onClose }) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(item.image_url ?? null)
  const fileRef = useRef()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        item.name,
      description: item.description ?? '',
      price:       item.price,
      notes:       item.notes ?? '',
      available:   item.available,
    },
  })

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
      const path = `${item.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('menu-images')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(path)

      await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', item.id)
      setPreviewUrl(publicUrl)
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success('Imagen actualizada')
    } catch {
      toast.error('No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data) {
    const { error } = await supabase
      .from('menu_items')
      .update({
        name:        data.name,
        description: data.description || null,
        price:       data.price,
        notes:       data.notes || null,
        available:   data.available,
      })
      .eq('id', item.id)

    if (error) {
      toast.error('No se pudo guardar.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['menu'] })
    toast.success('Plato actualizado')
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
          <h2 className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>Editar plato</h2>
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
              ? <img src={previewUrl} alt={item.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center font-display text-5xl">🍽</div>
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

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Nombre</label>
              <input {...register('name')} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none" style={{ borderColor: errors.name ? '#ef4444' : '#e5e7eb', fontFamily: 'inherit' }} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Descripción</label>
              <textarea {...register('description')} rows={2} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ borderColor: '#e5e7eb', fontFamily: 'inherit' }} />
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Precio (Gs)</label>
              <input {...register('price')} type="number" step="1000" className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none" style={{ borderColor: errors.price ? '#ef4444' : '#e5e7eb', fontFamily: 'inherit' }} />
              {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price.message}</p>}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Notas (presentación, tiempo, etc.)</label>
              <input {...register('notes')} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none" style={{ borderColor: '#e5e7eb', fontFamily: 'inherit' }} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1d5e8c' }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Guardar cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
