import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingBag, MapPin, Loader2, X, Minus, Plus, ChevronLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore, selectTotalItems, selectTotalPrice } from '../../store/cartStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useConfig } from '../../hooks/useConfig'
import { supabase } from '../../lib/supabase'
import { formatPrice, buildWhatsAppMessage, buildAjakaMessage } from '../../lib/utils'

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Ingresá tu nombre completo'),
  customerPhone: z.string().min(6, 'Ingresá tu número de teléfono'),
  deliveryAddress: z.string().min(5, 'Ingresá tu dirección de entrega'),
  notes: z.string().optional(),
})

export default function CartSidebar({ isOpen, onClose }) {
  const items = useCartStore(s => s.items)
  const addItem = useCartStore(s => s.addItem)
  const decrement = useCartStore(s => s.decrement)
  const clearCart = useCartStore(s => s.clearCart)
  const totalItems = useCartStore(selectTotalItems)
  const totalPrice = useCartStore(selectTotalPrice)

  const [step, setStep] = useState('cart') // 'cart' | 'checkout'
  const [submitting, setSubmitting] = useState(false)

  const { data: config } = useConfig()
  const geo = useGeolocation()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
  })

  // Pre-rellenar dirección cuando la geolocalización resuelve
  useEffect(() => {
    if (geo.address) setValue('deliveryAddress', geo.address)
  }, [geo.address, setValue])

  async function onSubmit(data) {
    if (items.length === 0) return
    setSubmitting(true)

    try {
      // 1. Insertar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          delivery_address: data.deliveryAddress,
          delivery_lat: geo.lat,
          delivery_lng: geo.lng,
          notes: data.notes || null,
          total: totalPrice,
        })
        .select('id, order_number')
        .single()

      if (orderError) throw orderError

      // 2. Insertar items + modificadores
      for (const item of items) {
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            menu_item_id: item.menuItemId,
            item_name: item.itemName,
            item_price: item.basePrice,
            quantity: item.quantity,
          })
          .select('id')
          .single()

        if (itemError) throw itemError

        if (item.selectedModifier) {
          const { error: modError } = await supabase
            .from('order_item_modifiers')
            .insert({
              order_item_id: orderItem.id,
              modifier_name: item.selectedModifier.name,
              extra_price: item.selectedModifier.extraPrice,
            })
          if (modError) throw modError
        }
      }

      // 3. Abrir WhatsApp — Celestina Cocina + Ajaka
      const customer = { name: data.customerName, phone: data.customerPhone, address: data.deliveryAddress, notes: data.notes }

      const waNegocio = config?.whatsapp_negocio || '595986818441'
      const waAjaka   = config?.whatsapp_ajaka

      const msgCelestina = buildWhatsAppMessage(order.order_number, items, totalPrice, customer)
      const msgAjaka     = buildAjakaMessage(order.order_number, items, totalPrice, customer)

      window.open(`https://wa.me/${waNegocio}?text=${encodeURIComponent(msgCelestina)}`, '_blank')

      if (waAjaka) {
        // Pequeño delay para que el navegador no bloquee el segundo popup
        setTimeout(() => {
          window.open(`https://wa.me/${waAjaka}?text=${encodeURIComponent(msgAjaka)}`, '_blank')
        }, 600)
      }

      // 4. Reset
      clearCart()
      setStep('cart')
      onClose?.()
      toast.success(waAjaka ? '¡Pedido enviado! Se notificó a Celestina y a Ajaka.' : '¡Pedido enviado! Revisá WhatsApp.')
    } catch (err) {
      console.error(err)
      toast.error('Hubo un error al enviar el pedido. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const sidebarClass = `
    fixed md:static inset-0 md:inset-auto z-40
    bg-white rounded-none md:rounded-[18px]
    flex flex-col
    transition-transform duration-300 ease-in-out
    md:w-[320px] md:flex-shrink-0 md:self-start md:sticky md:top-6
    ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
  `

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(28,43,54,0.4)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={sidebarClass}
        style={{ border: '1px solid #e3edf2', boxShadow: '0 4px 18px rgba(29,94,140,0.06)', maxHeight: '100dvh', overflowY: 'auto' }}
      >
        {/* Header del carrito */}
        <div className="flex items-center justify-between p-5 sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid #f0f5f8' }}>
          {step === 'checkout' ? (
            <button onClick={() => setStep('cart')} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#1d5e8c' }}>
              <ChevronLeft size={16} /> Volver al carrito
            </button>
          ) : (
            <h2 className="font-display text-[19px] font-bold flex items-center gap-2" style={{ color: '#1d5e8c' }}>
              <span className="w-2 h-2 rounded-full bg-celestina-amarillo inline-block" />
              Tu pedido
              {totalItems > 0 && (
                <span className="text-sm font-bold text-white rounded-full w-5 h-5 flex items-center justify-center" style={{ background: '#1d5e8c' }}>
                  {totalItems}
                </span>
              )}
            </h2>
          )}
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-gray-100" aria-label="Cerrar carrito">
            <X size={18} className="text-celestina-tinta" />
          </button>
        </div>

        {/* ── STEP: CARRITO ── */}
        {step === 'cart' && (
          <div className="flex flex-col flex-1 p-5 gap-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <ShoppingBag size={40} style={{ color: '#5b96bf', opacity: 0.5 }} />
                <p className="text-sm text-center" style={{ color: '#7c8a93' }}>
                  Tu carrito está vacío.<br />Agregá algo del menú 😊
                </p>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="flex flex-col divide-y" style={{ borderColor: '#f0f5f8' }}>
                  {items.map(item => {
                    const linePrice = (item.basePrice + (item.selectedModifier?.extraPrice ?? 0)) * item.quantity
                    return (
                      <div key={item.key} className="flex items-center justify-between py-2.5 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold truncate text-celestina-tinta">
                            {item.itemName}
                          </p>
                          {item.selectedModifier && (
                            <p className="text-xs" style={{ color: '#7c8a93' }}>
                              {item.selectedModifier.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => decrement(item.key)}
                            className="w-5 h-5 rounded flex items-center justify-center text-white"
                            style={{ background: '#1d5e8c' }}
                            aria-label="Quitar uno"
                          >
                            <Minus size={10} strokeWidth={3} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-celestina-tinta">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addItem({ menuItemId: item.menuItemId, itemName: item.itemName, basePrice: item.basePrice, selectedModifier: item.selectedModifier })}
                            className="w-5 h-5 rounded flex items-center justify-center text-white"
                            style={{ background: '#1d5e8c' }}
                            aria-label="Agregar uno más"
                          >
                            <Plus size={10} strokeWidth={3} />
                          </button>
                        </div>

                        <span className="text-[13px] font-bold text-celestina-tinta w-20 text-right flex-shrink-0">
                          {formatPrice(linePrice)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-1" style={{ borderTop: '2px solid #eaf3f8' }}>
                  <span className="font-display font-bold text-[18px]" style={{ color: '#1d5e8c' }}>Total</span>
                  <span className="font-display font-bold text-[18px]" style={{ color: '#1d5e8c' }}>
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: '#1d5e8c' }}
                >
                  Ir al pedido →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── STEP: CHECKOUT ── */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
            {/* Resumen compacto */}
            <div className="rounded-xl p-3 text-sm" style={{ background: '#eaf3f8' }}>
              <p className="font-bold text-celestina-tinta">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
              <p className="font-display font-bold text-base" style={{ color: '#1d5e8c' }}>{formatPrice(totalPrice)}</p>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Dirección de entrega
              </label>
              <button
                type="button"
                onClick={geo.getLocation}
                disabled={geo.loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-dashed mb-2 transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: '#5b96bf', color: '#1d5e8c', background: '#fff' }}
              >
                {geo.loading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <MapPin size={14} />}
                Usar mi ubicación actual
              </button>
              {geo.error && <p className="text-xs text-red-500 mb-1">{geo.error}</p>}
              <textarea
                {...register('deliveryAddress')}
                rows={2}
                placeholder="Av. Independencia 123, Caaguazú..."
                className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:ring-2"
                style={{
                  borderColor: errors.deliveryAddress ? '#ef4444' : '#dbe9f0',
                  fontFamily: 'inherit',
                }}
              />
              {errors.deliveryAddress && (
                <p className="text-xs text-red-500 mt-0.5">{errors.deliveryAddress.message}</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Tu nombre
              </label>
              <input
                {...register('customerName')}
                placeholder="Juan Pérez"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{ borderColor: errors.customerName ? '#ef4444' : '#dbe9f0', fontFamily: 'inherit' }}
              />
              {errors.customerName && (
                <p className="text-xs text-red-500 mt-0.5">{errors.customerName.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Teléfono
              </label>
              <input
                {...register('customerPhone')}
                type="tel"
                placeholder="0981 123 456"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{ borderColor: errors.customerPhone ? '#ef4444' : '#dbe9f0', fontFamily: 'inherit' }}
              />
              {errors.customerPhone && (
                <p className="text-xs text-red-500 mt-0.5">{errors.customerPhone.message}</p>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Notas (opcional)
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Tocar al timbre, alergia a..."
                className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:ring-2"
                style={{ borderColor: '#dbe9f0', fontFamily: 'inherit' }}
              />
            </div>

            {/* Métodos de pago */}
            <div className="text-xs rounded-xl p-3" style={{ background: '#eaf3f8', color: '#7c8a93' }}>
              💳 Aceptamos: efectivo · Tigo Money · Ueno · transferencia
            </div>

            {/* Botón confirmar */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1d5e8c' }}
            >
              {submitting
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={15} />}
              Confirmar y enviar por WhatsApp
            </button>

            <p className="text-[11px] text-center leading-relaxed" style={{ color: '#7c8a93' }}>
              Se abrirá WhatsApp con tu pedido listo para enviar.
              El pedido queda guardado aunque no lo envíes.
            </p>
          </form>
        )}
      </aside>
    </>
  )
}
