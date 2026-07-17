import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingBag, Loader2, X, Minus, Plus, ChevronLeft, Send, MapPin, Check, CupSoda, CreditCard, Store } from 'lucide-react'
import LocationPicker from '../menu/LocationPicker'
import toast from 'react-hot-toast'
import { useCartStore, selectTotalItems, selectTotalPrice } from '../../store/cartStore'
import { useConfig } from '../../hooks/useConfig'
import { usePickupOnly } from '../../hooks/usePickupOnly'
import { useMenu } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabase'
import { formatPrice, buildWhatsAppMessage, vibrateFeedback, isWithinSchedule } from '../../lib/utils'

// La dirección de entrega NO va en el form: se obtiene solo del mapa (GPS o pin),
// nunca como texto libre. Acá solo validamos los datos de contacto.
const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Ingresá tu nombre completo'),
  customerPhone: z.string().min(6, 'Ingresá tu número de teléfono'),
  notes: z.string().optional(),
})

const inputStyle = (hasError) => ({
  borderColor: hasError ? '#ef4444' : '#dbe9f0',
  fontFamily: 'inherit',
  fontSize: '16px',
})

// Card de bebida del paso "agregá una bebida": thumbnail + feedback al agregar.
function DrinkCard({ drink, index }) {
  const addItem = useCartStore(s => s.addItem)
  const decrement = useCartStore(s => s.decrement)
  const qty = useCartStore(s => s.getQuantity(drink.id, undefined))
  const [pulse, setPulse] = useState(false)

  const active = qty > 0

  function add() {
    vibrateFeedback()
    addItem({ menuItemId: drink.id, itemName: drink.name, basePrice: drink.price, selectedModifier: null })
    setPulse(true)
    setTimeout(() => setPulse(false), 400)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-2xl p-2.5"
      style={{
        border: '1px solid',
        borderColor: active ? '#bbf7d0' : '#e3edf2',
        background: active ? '#f4fdf8' : '#fff',
        boxShadow: active ? '0 5px 16px rgba(22,163,74,0.12)' : '0 2px 10px rgba(29,94,140,0.05)',
        transition: 'background .25s ease, border-color .25s ease, box-shadow .25s ease',
      }}
    >
      {/* Thumbnail */}
      <motion.div
        className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: 'repeating-conic-gradient(#e3edf2 0% 25%, #eef5f9 0% 50%) 0 0 / 14px 14px' }}
        animate={pulse ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {drink.image_url ? (
          <img src={drink.image_url} alt={drink.name} className="w-full h-full object-contain p-1" loading="lazy" />
        ) : (
          <CupSoda size={22} style={{ color: '#5b96bf' }} />
        )}
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold leading-tight truncate text-celestina-tinta">{drink.name}</p>
        <p className="text-[13px] font-bold mt-0.5" style={{ color: '#1d5e8c' }}>{formatPrice(drink.price)}</p>
      </div>

      {/* Control */}
      <AnimatePresence mode="wait" initial={false}>
        {!active ? (
          <motion.button
            key="add"
            onClick={add}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: '#1d5e8c' }}
            aria-label={`Agregar ${drink.name}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            whileTap={{ scale: 0.88 }}
          >
            <Plus size={17} strokeWidth={2.5} />
          </motion.button>
        ) : (
          <motion.div
            key="stepper"
            className="flex items-center gap-1 rounded-2xl px-1.5 py-1 flex-shrink-0"
            style={{ background: '#eaf3f8' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <button
              onClick={() => decrement(`${drink.id}|`)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white active:opacity-70"
              style={{ background: '#1d5e8c' }}
              aria-label="Quitar uno"
            >
              <Minus size={13} strokeWidth={3} />
            </button>
            <motion.span
              key={qty}
              className="text-sm font-bold min-w-[20px] text-center text-celestina-tinta"
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {qty}
            </motion.span>
            <button
              onClick={add}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white active:opacity-70"
              style={{ background: '#1d5e8c' }}
              aria-label="Agregar uno más"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function CartSidebar({ isOpen, onClose }) {
  const items = useCartStore(s => s.items)
  const addItem = useCartStore(s => s.addItem)
  const decrement = useCartStore(s => s.decrement)
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
  const [pickedAddress, setPickedAddress] = useState('')
  const [locationError, setLocationError] = useState(false)

  const { data: config } = useConfig()
  const { data: pickupOnly } = usePickupOnly()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
  })

  const hasLocation = pickedLat != null && pickedLng != null

  async function onSubmit(data) {
    if (items.length === 0) return

    // Guard server-side: verificar estado manual + horario + modo retiro antes
    // de insertar (valor fresco, evita desincronización con la cache).
    const { data: configRows } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['is_open', 'schedule_open', 'schedule_close', 'pickup_only', 'pickup_address'])
    const cfg = Object.fromEntries((configRows ?? []).map(r => [r.key, r.value]))
    const isPickup = cfg.pickup_only === 'true'

    // En delivery la ubicación del mapa es obligatoria; en modo retiro no hace falta.
    if (!isPickup && !hasLocation) {
      setLocationError(true)
      toast.error('Marcá tu ubicación en el mapa para continuar.')
      return
    }

    if (cfg.is_open === 'false' || !isWithinSchedule(cfg.schedule_open, cfg.schedule_close)) {
      toast.error('El negocio está cerrado, no se pueden tomar pedidos ahora.')
      return
    }

    vibrateFeedback(60)

    setSubmitting(true)

    try {
      // En retiro no hay coordenadas y delivery_address (NOT NULL) lleva un texto.
      const lat = isPickup ? null : pickedLat
      const lng = isPickup ? null : pickedLng
      const deliveryAddress = isPickup
        ? (cfg.pickup_address ? `Retiro en el local — ${cfg.pickup_address}` : 'Retiro en el local')
        : pickedAddress

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          delivery_address: deliveryAddress,
          delivery_lat: lat,
          delivery_lng: lng,
          is_pickup: isPickup,
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
        address: deliveryAddress,
        notes: data.notes,
        lat,
        lng,
        pickup: isPickup,
        pickupAddress: cfg.pickup_address || '',
      }
      const waNegocio = config?.whatsapp_negocio || '595986818441'
      const msgCelestina = buildWhatsAppMessage(order.order_number, items, totalPrice, customer)

      window.open(`https://wa.me/${waNegocio}?text=${encodeURIComponent(msgCelestina)}`, '_blank')

      clearCart()
      setPickedLat(null)
      setPickedLng(null)
      setPickedAddress('')
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
          'rounded-t-3xl',
          // Desktop: sidebar estático
          'md:static md:bottom-auto md:left-auto md:right-auto',
          'md:rounded-2xl',
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
                  Tu carrito está vacío.<br />Agregá algo del menú
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
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
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
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
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
                  className="w-full py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75"
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
                <span className="inline-flex items-center gap-2">
                  ¿Querés agregar una bebida?
                  <CupSoda size={20} strokeWidth={2} color="#1d5e8c" />
                </span>
              </h3>
              <p className="text-sm mt-0.5" style={{ color: '#7c8a93' }}>
                Sumá algo para tomar a tu pedido.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {drinkItems.map((drink, i) => (
                <DrinkCard key={drink.id} drink={drink} index={i} />
              ))}
            </div>

            <button
              onClick={() => setStep('checkout')}
              className="w-full py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75 mt-auto"
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

            {/* Modo retiro: no se pide ubicación, se muestra dónde retirar. */}
            {pickupOnly ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                  Retiro en el local
                </label>
                <div className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: '#fef9ec', border: '1px solid #f2c14e' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f2c14e' }}>
                    <Store size={18} style={{ color: '#1c2b36' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {config?.pickup_message && (
                      <p className="text-sm leading-snug text-celestina-tinta">{config.pickup_message}</p>
                    )}
                    {config?.pickup_address && (
                      <>
                        <p className="text-sm font-bold mt-1.5 text-celestina-tinta flex items-start gap-1">
                          <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#1d5e8c' }} />
                          {config.pickup_address}
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(config.pickup_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs font-bold mt-1"
                          style={{ color: '#1d5e8c' }}
                        >
                          Ver en el mapa →
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            /* Dirección — SOLO desde el mapa (GPS o pin). No hay carga manual. */
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Dirección de entrega
              </label>

              {showMap ? (
                <LocationPicker
                  onConfirm={({ lat, lng, address }) => {
                    setPickedLat(lat)
                    setPickedLng(lng)
                    setPickedAddress(address)
                    setLocationError(false)
                    setShowMap(false)
                  }}
                  onCancel={() => setShowMap(false)}
                />
              ) : hasLocation ? (
                <div
                  className="rounded-xl p-3 flex items-start gap-2"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug text-celestina-tinta">{pickedAddress}</p>
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="text-xs font-bold mt-1.5"
                      style={{ color: '#1d5e8c' }}
                    >
                      Cambiar ubicación
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white active:opacity-80"
                    style={{ background: '#1d5e8c' }}
                  >
                    <MapPin size={15} />
                    Marcar mi ubicación en el mapa
                  </button>
                  <p className="text-[11px] mt-1.5" style={{ color: locationError ? '#ef4444' : '#7c8a93' }}>
                    Necesitamos tu ubicación exacta para el delivery.
                  </p>
                </>
              )}
            </div>
            )}

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
              <span className="flex items-center gap-1.5">
                <CreditCard size={13} />
                Aceptamos: Efectivo · Transferencia
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60"
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
