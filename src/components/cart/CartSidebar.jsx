import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingBag, Loader2, X, Minus, Plus, ChevronLeft, Send, Map } from 'lucide-react'
import LocationPicker from '../menu/LocationPicker'
import toast from 'react-hot-toast'
import { useCartStore, selectTotalItems, selectTotalPrice } from '../../store/cartStore'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useConfig } from '../../hooks/useConfig'
import { useMenu } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabase'
import { formatPrice, buildWhatsAppMessage } from '../../lib/utils'

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Ingresá tu nombre completo'),
  customerPhone: z.string().min(6, 'Ingresá tu número de teléfono'),
  deliveryAddress: z.string().min(5, 'Ingresá tu dirección de entrega'),
  notes: z.string().optional(),
})

const inputStyle = (hasError) => ({
  borderColor: hasError ? '#ef4444' : '#dbe9f0',
  fontFamily: 'inherit',
  fontSize: '16px',
})

export default function CartSidebar({ isOpen, onClose }) {
  const items = useCartStore(s => s.items)
  const addItem = useCartStore(s => s.addItem)
  const decrement = useCartStore(s => s.decrement)
  const getQuantity = useCartStore(s => s.getQuantity)
  const clearCart = useCartStore(s => s.clearCart)
  const totalItems = useCartStore(selectTotalItems)
  const totalPrice = useCartStore(selectTotalPrice)

  const { data: menu } = useMenu()
  // Bebidas para el paso "agregá una bebida" (detección por categoría, sin depender de subcategory)
  const drinkItems = menu?.find(c => c.name === 'Bebidas')?.items ?? []
  const drinkIds = new Set(drinkItems.map(d => d.id))
  const cartHasDrink = items.some(i => drinkIds.has(i.menuItemId))

  const [step, setStep] = useState('cart')
  const [submitting, setSubmitting] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [pickedLat, setPickedLat] = useState(null)
  const [pickedLng, setPickedLng] = useState(null)

  const { data: config } = useConfig()
  const geo = useGeolocation()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
  })

  useEffect(() => {
    if (geo.address) setValue('deliveryAddress', geo.address)
  }, [geo.address, setValue])

  async function onSubmit(data) {
    if (items.length === 0) return
    setSubmitting(true)

    try {
      const lat = pickedLat ?? geo.lat
      const lng = pickedLng ?? geo.lng

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          delivery_address: data.deliveryAddress,
          delivery_lat: lat,
          delivery_lng: lng,
          notes: data.notes || null,
          total: totalPrice,
        })
        .select('id, order_number')
        .single()

      if (orderError) throw orderError

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

      const customer = {
        name: data.customerName,
        phone: data.customerPhone,
        address: data.deliveryAddress,
        notes: data.notes,
        lat,
        lng,
      }
      const waNegocio = config?.whatsapp_negocio || '595986818441'
      const msgCelestina = buildWhatsAppMessage(order.order_number, items, totalPrice, customer)

      window.open(`https://wa.me/${waNegocio}?text=${encodeURIComponent(msgCelestina)}`, '_blank')

      clearCart()
      setStep('cart')
      onClose?.()
      toast.success('¡Pedido enviado! Revisá WhatsApp.')
    } catch (err) {
      console.error(err)
      toast.error('Hubo un error al enviar el pedido. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(28,43,54,0.5)' }}
          onClick={onClose}
        />
      )}

      {/* ── Bottom sheet mobile / Sidebar desktop ── */}
      <aside
        className={[
          // Mobile: bottom sheet fijo
          'fixed bottom-0 left-0 right-0 z-40',
          'rounded-t-[22px]',
          // Desktop: sidebar estático
          'md:static md:bottom-auto md:left-auto md:right-auto',
          'md:rounded-[18px]',
          'md:w-[320px] md:flex-shrink-0 md:self-start md:sticky md:top-6',
          // Común
          'bg-white flex flex-col',
          'transition-transform duration-300 ease-out',
          // Animación: oculto debajo en mobile cuando cerrado, visible siempre en desktop
          isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0',
        ].join(' ')}
        style={{
          border: '1px solid #e3edf2',
          boxShadow: '0 -4px 30px rgba(29,94,140,0.12)',
          maxHeight: 'min(90dvh, 90vh)',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Handle drag — solo mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#dbe9f0' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 bg-white" style={{ borderBottom: '1px solid #f0f5f8' }}>
          {step === 'checkout' || step === 'drinks' ? (
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
          <button onClick={onClose} className="md:hidden p-2 -mr-1 rounded-xl hover:bg-gray-100 active:bg-gray-200" aria-label="Cerrar carrito">
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
                <div className="flex flex-col divide-y" style={{ borderColor: '#f0f5f8' }}>
                  {items.map(item => {
                    const linePrice = (item.basePrice + (item.selectedModifier?.extraPrice ?? 0)) * item.quantity
                    return (
                      <div key={item.key} className="flex items-center justify-between py-3 gap-2">
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

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => decrement(item.key)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ background: '#1d5e8c' }}
                            aria-label="Quitar uno"
                          >
                            <Minus size={12} strokeWidth={3} />
                          </button>
                          <span className="text-sm font-bold w-5 text-center text-celestina-tinta">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addItem({ menuItemId: item.menuItemId, itemName: item.itemName, basePrice: item.basePrice, selectedModifier: item.selectedModifier })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ background: '#1d5e8c' }}
                            aria-label="Agregar uno más"
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        </div>

                        <span className="text-[13px] font-bold text-celestina-tinta w-20 text-right flex-shrink-0">
                          {formatPrice(linePrice)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center py-1" style={{ borderTop: '2px solid #eaf3f8' }}>
                  <span className="font-display font-bold text-[18px]" style={{ color: '#1d5e8c' }}>Total</span>
                  <span className="font-display font-bold text-[18px]" style={{ color: '#1d5e8c' }}>
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <button
                  onClick={() => setStep(!cartHasDrink && drinkItems.length > 0 ? 'drinks' : 'checkout')}
                  className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75"
                  style={{ background: '#1d5e8c' }}
                >
                  Ir al pedido →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── STEP: AGREGÁ UNA BEBIDA ── */}
        {step === 'drinks' && (
          <div className="flex flex-col flex-1 p-5 gap-4">
            <div>
              <h3 className="font-display font-bold text-[18px] leading-tight" style={{ color: '#1d5e8c' }}>
                ¿Querés agregar una bebida? 🥤
              </h3>
              <p className="text-sm mt-0.5" style={{ color: '#7c8a93' }}>
                Sumá algo para tomar a tu pedido.
              </p>
            </div>

            <div className="flex flex-col divide-y" style={{ borderColor: '#f0f5f8' }}>
              {drinkItems.map(drink => {
                const qty = getQuantity(drink.id, undefined)
                return (
                  <div key={drink.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold truncate text-celestina-tinta">
                        {drink.name}
                      </p>
                      <p className="text-xs font-bold" style={{ color: '#1d5e8c' }}>
                        {formatPrice(drink.price)}
                      </p>
                    </div>

                    {qty === 0 ? (
                      <button
                        onClick={() => addItem({ menuItemId: drink.id, itemName: drink.name, basePrice: drink.price, selectedModifier: null })}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: '#1d5e8c' }}
                        aria-label={`Agregar ${drink.name}`}
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => decrement(`${drink.id}|`)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ background: '#1d5e8c' }}
                          aria-label="Quitar uno"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="text-sm font-bold w-5 text-center text-celestina-tinta">
                          {qty}
                        </span>
                        <button
                          onClick={() => addItem({ menuItemId: drink.id, itemName: drink.name, basePrice: drink.price, selectedModifier: null })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ background: '#1d5e8c' }}
                          aria-label="Agregar uno más"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setStep('checkout')}
              className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75 mt-auto"
              style={{ background: '#1d5e8c' }}
            >
              {cartHasDrink ? 'Continuar al pedido →' : 'Seguir sin bebida →'}
            </button>
          </div>
        )}

        {/* ── STEP: CHECKOUT ── */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
            <div className="rounded-xl p-3 text-sm" style={{ background: '#eaf3f8' }}>
              <p className="font-bold text-celestina-tinta">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
              <p className="font-display font-bold text-base" style={{ color: '#1d5e8c' }}>{formatPrice(totalPrice)}</p>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Dirección de entrega
              </label>

              {showMap ? (
                <LocationPicker
                  initialAddress={String(document.activeElement?.value ?? '')}
                  onConfirm={({ lat, lng, address }) => {
                    setPickedLat(lat)
                    setPickedLng(lng)
                    setValue('deliveryAddress', address)
                    setShowMap(false)
                  }}
                  onCancel={() => setShowMap(false)}
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-dashed mb-2 active:opacity-70"
                    style={{ borderColor: '#5b96bf', color: '#1d5e8c', background: '#fff' }}
                  >
                    <Map size={14} />
                    Elegir en el mapa
                    {pickedLat && <span className="text-[11px] font-normal" style={{ color: '#16a34a' }}>✓ ubicación marcada</span>}
                  </button>
                  <textarea
                    {...register('deliveryAddress')}
                    rows={2}
                    placeholder="O escribí tu dirección manualmente..."
                    className="w-full border rounded-xl px-3 py-3 resize-none outline-none focus:ring-2"
                    style={inputStyle(errors.deliveryAddress)}
                  />
                  {errors.deliveryAddress && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.deliveryAddress.message}</p>
                  )}
                </>
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
                className="w-full border rounded-xl px-3 py-3 outline-none focus:ring-2"
                style={inputStyle(errors.customerName)}
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
                className="w-full border rounded-xl px-3 py-3 outline-none focus:ring-2"
                style={inputStyle(errors.customerPhone)}
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
                className="w-full border rounded-xl px-3 py-3 resize-none outline-none focus:ring-2"
                style={inputStyle(false)}
              />
            </div>

            {/* Métodos de pago */}
            <div className="text-xs rounded-xl p-3" style={{ background: '#eaf3f8', color: '#7c8a93' }}>
              💳 Aceptamos: efectivo · Tigo Money · Ueno · transferencia
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60"
              style={{ background: '#1d5e8c' }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
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
