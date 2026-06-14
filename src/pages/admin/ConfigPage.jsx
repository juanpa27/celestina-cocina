import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useConfig } from '../../hooks/useConfig'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  whatsapp_negocio: z.string().min(6, 'Ingresá el número'),
  whatsapp_ajaka:   z.string().optional(),
})

async function upsertConfig(key, value) {
  const { error } = await supabase
    .from('app_config')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}

export default function ConfigPage() {
  const { data: config, isLoading } = useConfig()
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { whatsapp_negocio: '', whatsapp_ajaka: '' },
  })

  // Cargar valores actuales cuando llegan de la DB
  useEffect(() => {
    if (config) {
      reset({
        whatsapp_negocio: config.whatsapp_negocio ?? '',
        whatsapp_ajaka:   config.whatsapp_ajaka   ?? '',
      })
    }
  }, [config, reset])

  async function onSubmit(data) {
    try {
      await Promise.all([
        upsertConfig('whatsapp_negocio', data.whatsapp_negocio),
        upsertConfig('whatsapp_ajaka',   data.whatsapp_ajaka ?? ''),
      ])
      queryClient.invalidateQueries({ queryKey: ['config'] })
      toast.success('Configuración guardada')
    } catch {
      toast.error('No se pudo guardar.')
    }
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#1c2b36' }}>Configuración</h1>
      <p className="text-xs mb-6" style={{ color: '#9ca3af' }}>
        Cambios guardados aquí se aplican inmediatamente al menú público.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: '#1d5e8c' }} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* ── WhatsApp del negocio ── */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <span className="text-xl">🍽</span>
              <div>
                <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>Celestina Cocina</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Recibe el detalle completo del pedido</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Número de WhatsApp
              </label>
              <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: errors.whatsapp_negocio ? '#ef4444' : '#e5e7eb' }}>
                <span className="px-3 py-2.5 text-sm font-mono border-r" style={{ background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>
                  +
                </span>
                <input
                  {...register('whatsapp_negocio')}
                  type="tel"
                  placeholder="595986818441"
                  className="flex-1 px-3 py-2.5 text-sm outline-none font-mono"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              {errors.whatsapp_negocio && (
                <p className="text-xs text-red-500 mt-1">{errors.whatsapp_negocio.message}</p>
              )}
              <p className="text-xs mt-1.5" style={{ color: '#9ca3af' }}>
                Sin +, sin espacios. Ej: <span className="font-mono">595986818441</span>
              </p>
            </div>
          </div>

          {/* ── WhatsApp Ajaka ── */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <span className="text-xl">🚗</span>
              <div>
                <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>Ajaka (delivery)</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Recibe productos + dirección de entrega. Dejar vacío para no notificar.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Número de WhatsApp
              </label>
              <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                <span className="px-3 py-2.5 text-sm font-mono border-r" style={{ background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>
                  +
                </span>
                <input
                  {...register('whatsapp_ajaka')}
                  type="tel"
                  placeholder="595976444335"
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1d5e8c' }}
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar configuración
          </button>

        </form>
      )}
    </div>
  )
}
