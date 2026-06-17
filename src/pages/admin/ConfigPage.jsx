import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, Store, Lock, Clock } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useConfig } from '../../hooks/useConfig'
import { useIsOpen } from '../../hooks/useIsOpen'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  whatsapp_negocio: z.string().min(6, 'Ingresá el número'),
  whatsapp_ajaka:   z.string().optional(),
  schedule_open:    z.string().optional(),
  schedule_close:   z.string().optional(),
})

async function upsertConfig(key, value) {
  const { error } = await supabase
    .from('app_config')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}

export default function ConfigPage() {
  const { data: config, isLoading } = useConfig()
  const { data: isOpen = true } = useIsOpen()
  const [togglingOpen, setTogglingOpen] = useState(false)
  const queryClient = useQueryClient()

  async function toggleOpen() {
    setTogglingOpen(true)
    const next = !isOpen
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'is_open', value: String(next) }, { onConflict: 'key' })
    if (error) {
      toast.error('No se pudo cambiar el estado.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['is_open'] })
      toast.success(next ? 'Negocio abierto ✓' : 'Negocio cerrado')
    }
    setTogglingOpen(false)
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { whatsapp_negocio: '', whatsapp_ajaka: '', schedule_open: '', schedule_close: '' },
  })

  // Cargar valores actuales cuando llegan de la DB
  useEffect(() => {
    if (config) {
      reset({
        whatsapp_negocio: config.whatsapp_negocio ?? '',
        whatsapp_ajaka:   config.whatsapp_ajaka   ?? '',
        schedule_open:    config.schedule_open    ?? '',
        schedule_close:   config.schedule_close   ?? '',
      })
    }
  }, [config, reset])

  async function onSubmit(data) {
    try {
      await Promise.all([
        upsertConfig('whatsapp_negocio', data.whatsapp_negocio),
        upsertConfig('whatsapp_ajaka',   data.whatsapp_ajaka   ?? ''),
        upsertConfig('schedule_open',    data.schedule_open    ?? ''),
        upsertConfig('schedule_close',   data.schedule_close   ?? ''),
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

      {/* Toggle abrir / cerrar negocio */}
      <button
        onClick={toggleOpen}
        disabled={togglingOpen || isLoading}
        className="w-full flex items-center gap-4 p-4 rounded-2xl mb-6 transition-colors disabled:opacity-60"
        style={{
          background: isOpen ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${isOpen ? '#86efac' : '#fca5a5'}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isOpen ? '#16a34a' : '#dc2626' }}
        >
          {togglingOpen
            ? <Loader2 size={20} color="#fff" className="animate-spin" />
            : isOpen
              ? <Store size={20} color="#fff" />
              : <Lock size={20} color="#fff" />
          }
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm" style={{ color: isOpen ? '#15803d' : '#b91c1c' }}>
            {isOpen ? 'Negocio abierto' : 'Negocio cerrado'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: isOpen ? '#4ade80' : '#f87171' }}>
            {isOpen ? 'Los clientes pueden hacer pedidos' : 'El menú se ve pero no se aceptan pedidos'}
          </p>
        </div>
        <div
          className="flex-shrink-0 w-12 h-6 rounded-full relative transition-colors"
          style={{ background: isOpen ? '#16a34a' : '#d1d5db' }}
        >
          <div
            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: isOpen ? 28 : 4 }}
          />
        </div>
      </button>

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

          {/* ── Horario de atención ── */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <Clock size={18} style={{ color: '#1d5e8c' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>Horario de atención</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>El menú se cierra automáticamente fuera de este horario. Dejá vacío para no aplicar horario.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                  Apertura
                </label>
                <input
                  {...register('schedule_open')}
                  type="time"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                  Cierre
                </label>
                <input
                  {...register('schedule_close')}
                  type="time"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36' }}
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
