import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, Save, Store, Lock, Clock, UtensilsCrossed, Truck,
  CreditCard, Upload, Download, Share2, Copy, Check,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useConfig } from '../../hooks/useConfig'
import { useIsOpen } from '../../hooks/useIsOpen'
import { supabase } from '../../lib/supabase'
import { exportFlyer, shareFlyer, FLYER_W, FLYER_H } from '../../lib/flyer'
import PaymentBanner from '../../components/admin/flyers/PaymentBanner'

const schema = z.object({
  whatsapp_negocio: z.string().min(6, 'Ingresá el número'),
  whatsapp_ajaka:   z.string().optional(),
  schedule_open:    z.string().optional(),
  schedule_close:   z.string().optional(),
  payment_name:     z.string().optional(),
  payment_alias:    z.string().optional(),
  payment_bank:     z.string().optional(),
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

  // Logo del banco
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const logoFileRef = useRef()

  // Banner preview — escala dinámica
  const bannerRef = useRef(null)
  const bannerBoxRef = useRef(null)
  const [bannerScale, setBannerScale] = useState(0.26)
  const [sharing, setSharing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    const box = bannerBoxRef.current
    if (!box) return
    const update = () => setBannerScale(box.clientWidth / FLYER_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

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

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      whatsapp_negocio: '',
      whatsapp_ajaka:   '',
      schedule_open:    '',
      schedule_close:   '',
      payment_name:     '',
      payment_alias:    '',
      payment_bank:     '',
    },
  })

  useEffect(() => {
    if (config) {
      reset({
        whatsapp_negocio: config.whatsapp_negocio ?? '',
        whatsapp_ajaka:   config.whatsapp_ajaka   ?? '',
        schedule_open:    config.schedule_open    ?? '',
        schedule_close:   config.schedule_close   ?? '',
        payment_name:     config.payment_name     ?? '',
        payment_alias:    config.payment_alias    ?? '',
        payment_bank:     config.payment_bank     ?? '',
      })
      if (config.payment_bank_logo_url) setLogoUrl(config.payment_bank_logo_url)
    }
  }, [config, reset])

  const watchPaymentName  = watch('payment_name')
  const watchPaymentAlias = watch('payment_alias')
  const watchPaymentBank  = watch('payment_bank')

  async function onSubmit(data) {
    try {
      await Promise.all([
        upsertConfig('whatsapp_negocio', data.whatsapp_negocio),
        upsertConfig('whatsapp_ajaka',   data.whatsapp_ajaka   ?? ''),
        upsertConfig('schedule_open',    data.schedule_open    ?? ''),
        upsertConfig('schedule_close',   data.schedule_close   ?? ''),
        upsertConfig('payment_name',     data.payment_name     ?? ''),
        upsertConfig('payment_alias',    data.payment_alias    ?? ''),
        upsertConfig('payment_bank',     data.payment_bank     ?? ''),
      ])
      queryClient.invalidateQueries({ queryKey: ['config'] })
      toast.success('Configuración guardada')
    } catch {
      toast.error('No se pudo guardar.')
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `config/bank-logo.${ext}`
      const { error: upErr } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
      await upsertConfig('payment_bank_logo_url', publicUrl)
      setLogoUrl(publicUrl)
      queryClient.invalidateQueries({ queryKey: ['config'] })
      toast.success('Logo subido ✓')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo subir el logo.')
    } finally {
      setLogoUploading(false)
      if (logoFileRef.current) logoFileRef.current.value = ''
    }
  }

  async function handleCopyText() {
    const lines = [
      '💳 *Datos para transferir*',
      '',
    ]
    if (watchPaymentBank)  lines.push(`🏦 *Banco:* ${watchPaymentBank}`)
    if (watchPaymentName)  lines.push(`👤 *Titular:* ${watchPaymentName}`)
    if (watchPaymentAlias) lines.push(`🔢 *Alias:* ${watchPaymentAlias}`)
    lines.push('', '✅ Transferí y mandame el comprobante 😊', '🍝 ¡Gracias por tu pedido! — Celestina Cocina')
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      toast.success('¡Copiado! Pegalo directo en WhatsApp')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('No se pudo copiar.')
    }
  }

  async function handleShareBanner() {
    if (!bannerRef.current) return
    setSharing(true)
    try {
      await shareFlyer(bannerRef.current, { fileName: 'celestina-pago', title: 'Celestina Cocina — Formas de pago' })
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('No se pudo compartir.')
    } finally {
      setSharing(false)
    }
  }

  async function handleDownloadBanner() {
    if (!bannerRef.current) return
    setExporting(true)
    try {
      const bytes = await exportFlyer(bannerRef.current, { format: 'jpg', fileName: 'celestina-pago' })
      toast.success(`Banner listo · ${(bytes / 1024).toFixed(0)} KB`)
    } catch {
      toast.error('No se pudo generar el banner.')
    } finally {
      setExporting(false)
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
              <UtensilsCrossed size={20} style={{ color: '#1d5e8c' }} />
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
                <span className="px-3 py-2.5 text-sm font-mono border-r" style={{ background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>+</span>
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
              <Truck size={20} style={{ color: '#1d5e8c' }} />
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
                <span className="px-3 py-2.5 text-sm font-mono border-r" style={{ background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>+</span>
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
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>Apertura</label>
                <input
                  {...register('schedule_open')}
                  type="time"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>Cierre</label>
                <input
                  {...register('schedule_close')}
                  type="time"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36' }}
                />
              </div>
            </div>
          </div>

          {/* ── Método de pago ── */}
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <CreditCard size={20} style={{ color: '#1d5e8c' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>Método de pago — Transferencia</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Se usa para generar el banner de pagos</p>
              </div>
            </div>

            {/* Nombre del titular */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Nombre del titular
              </label>
              <input
                {...register('payment_name')}
                type="text"
                placeholder="Ej: Celestina López"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36' }}
              />
            </div>

            {/* Alias */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Alias (CI o celular)
              </label>
              <input
                {...register('payment_alias')}
                type="text"
                placeholder="Ej: 4234567-8 o 0986818441"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none font-mono"
                style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36', fontFamily: 'monospace' }}
              />
              <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                El alias es lo que los clientes copian para transferir
              </p>
            </div>

            {/* Entidad bancaria */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Entidad bancaria
              </label>
              <input
                {...register('payment_bank')}
                type="text"
                placeholder="Ej: Tigo Money, Ueno, Banco Continental"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ border: '1.5px solid #e5e7eb', color: '#1c2b36' }}
              />
            </div>

            {/* Logo del banco */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#1d5e8c' }}>
                Logo del banco
              </label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <div className="w-14 h-14 rounded-xl border flex items-center justify-center p-1.5 flex-shrink-0"
                    style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}>
                    <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => logoFileRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60"
                  style={{ borderColor: '#1d5e8c', color: '#1d5e8c', background: '#f0f7ff' }}
                >
                  {logoUploading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Upload size={15} />
                  }
                  {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                </button>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#9ca3af' }}>
                PNG con fondo transparente recomendado · Se sube al instante
              </p>
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

      {/* ── Banner de pago — preview en vivo ── */}
      {!isLoading && (
        <div className="mt-8 mb-4">
          {/* Header sección */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#1d5e8c' }}>
              <Share2 size={16} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1c2b36' }}>Banner de pagos</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Listo para compartir o guardar como estado de WhatsApp</p>
            </div>
          </div>

          {/* Preview escalado */}
          <div
            ref={bannerBoxRef}
            className="w-full overflow-hidden rounded-2xl mx-auto mb-4"
            style={{
              aspectRatio: `${FLYER_W}/${FLYER_H}`,
              maxWidth: '240px',
              boxShadow: '0 8px 36px rgba(29,94,140,0.18)',
              border: '1px solid #e3edf2',
            }}
          >
            <div style={{
              width: FLYER_W,
              height: FLYER_H,
              transform: `scale(${bannerScale})`,
              transformOrigin: 'top left',
            }}>
              <div ref={bannerRef}>
                <PaymentBanner
                  paymentName={watchPaymentName}
                  paymentAlias={watchPaymentAlias}
                  paymentBank={watchPaymentBank}
                  logoUrl={logoUrl}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareBanner}
              disabled={sharing || exporting}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#25D366' }}
            >
              {sharing
                ? <Loader2 size={16} className="animate-spin" />
                : <Share2 size={16} />
              }
              Compartir
            </button>
            <button
              onClick={handleDownloadBanner}
              disabled={sharing || exporting}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1d5e8c' }}
            >
              {exporting
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />
              }
              Descargar
            </button>
          </div>
          <p className="text-xs text-center mt-2 mb-4" style={{ color: '#9ca3af' }}>
            "Compartir" abre WhatsApp directamente en el celular
          </p>

          {/* Copiar texto para WhatsApp */}
          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 transition-all"
            style={{
              borderColor: copied ? '#16a34a' : '#e5e7eb',
              color: copied ? '#16a34a' : '#1c2b36',
              background: copied ? '#f0fdf4' : '#fff',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar datos para enviar por WhatsApp'}
          </button>
          <p className="text-xs text-center mt-1.5" style={{ color: '#9ca3af' }}>
            Genera un mensaje con emojis listo para pegar en cualquier chat
          </p>
        </div>
      )}
    </div>
  )
}
