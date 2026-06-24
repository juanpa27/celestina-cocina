import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, Minus, X, MapPin, Link2, Loader2,
  ShoppingBag, Crosshair, Map,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useMenuAdmin } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabase'
import { formatPrice, calcDiscountedPrice, parseLocationUrl } from '../../lib/utils'
import LocationPicker from '../../components/menu/LocationPicker'

const FIELD = {
  border: '1.5px solid #e5e7eb',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 15,
  color: '#1c2b36',
  width: '100%',
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
}

const LABEL = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: '#1d5e8c',
  marginBottom: 6,
}

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '18px 16px', border: '1px solid #e5e7eb', ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontWeight: 700, fontSize: 13, color: '#1c2b36', marginBottom: 12 }}>{children}</p>
  )
}

function CartItemRow({ item, onQtyChange, onRemove }) {
  const lineTotal = (item.basePrice + (item.selectedModifier?.extraPrice ?? 0)) * item.quantity
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1c2b36', lineHeight: 1.3 }}>
          {item.itemName}
          {item.selectedModifier && (
            <span style={{ color: '#5b96bf', fontWeight: 400 }}> ({item.selectedModifier.name})</span>
          )}
        </p>
        <p style={{ fontSize: 13, color: '#1d5e8c', fontWeight: 700, marginTop: 2 }}>{formatPrice(lineTotal)}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => item.quantity > 1 ? onQtyChange(item.cartKey, -1) : onRemove(item.cartKey)}
          style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Minus size={13} color="#1c2b36" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1c2b36', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
        <button
          onClick={() => onQtyChange(item.cartKey, 1)}
          style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #1d5e8c', background: '#1d5e8c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Plus size={13} color="#fff" />
        </button>
        <button
          onClick={() => onRemove(item.cartKey)}
          style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 2 }}
        >
          <X size={13} color="#dc2626" />
        </button>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: categories = [], isLoading: menuLoading } = useMenuAdmin()

  // ── Cliente ──────────────────────────────────────────
  const [customerName, setCustomerName]   = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // ── Selector de producto ──────────────────────────────
  const [selectedCatId,  setSelectedCatId]  = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [pendingModifier, setPendingModifier] = useState(null)
  const [pendingQty, setPendingQty] = useState(1)

  // ── Carrito ───────────────────────────────────────────
  const [cart, setCart] = useState([])

  // ── Ubicación ─────────────────────────────────────────
  const [locationInput, setLocationInput] = useState('')
  const [location, setLocation]           = useState(null) // { lat, lng, address }
  const [geocoding, setGeocoding]         = useState(false)
  const [showMap, setShowMap]             = useState(false)

  // ── Notas ─────────────────────────────────────────────
  const [notes, setNotes] = useState('')

  // ── Submit ────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)

  // Categorías activas con al menos un item disponible
  const availableCats = categories.filter(
    c => c.active !== false && (c.items ?? []).some(i => i.available !== false)
  )

  // Selección derivada
  const effectiveCatId = selectedCatId || availableCats[0]?.id || ''
  const selectedCat    = availableCats.find(c => c.id === effectiveCatId)
  const availableItems = (selectedCat?.items ?? []).filter(i => i.available !== false)
  const effectiveItemId = selectedItemId || availableItems[0]?.id || ''
  const selectedItem   = availableItems.find(i => i.id === effectiveItemId) ?? null
  const modGroup       = selectedItem?.modifierGroups?.[0] ?? null

  // Resetear item y modificador al cambiar categoría
  useEffect(() => {
    setSelectedItemId('')
    setPendingModifier(null)
  }, [selectedCatId])

  // Resetear modificador al cambiar item
  useEffect(() => {
    setPendingModifier(null)
  }, [selectedItemId])

  const total = cart.reduce(
    (sum, i) => sum + (i.basePrice + (i.selectedModifier?.extraPrice ?? 0)) * i.quantity,
    0
  )

  // ── Parsear link de WhatsApp ──────────────────────────
  async function handleLocationPaste(val) {
    setLocationInput(val)
    const parsed = parseLocationUrl(val)
    if (!parsed) return

    setGeocoding(true)
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      let address = `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`
      if (apiKey) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${parsed.lat},${parsed.lng}&language=es&key=${apiKey}`
        )
        const data = await res.json()
        if (data.results?.[0]?.formatted_address) address = data.results[0].formatted_address
      }
      setLocation({ lat: parsed.lat, lng: parsed.lng, address })
      toast.success('Ubicación detectada ✓')
    } catch {
      setLocation({ lat: parsed.lat, lng: parsed.lng, address: `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}` })
    } finally {
      setGeocoding(false)
    }
  }

  // ── Agregar al carrito ────────────────────────────────
  function addToCart() {
    if (!selectedItem) return
    if (modGroup?.required && !pendingModifier) {
      toast.error(`Seleccioná ${modGroup.name}`)
      return
    }

    const basePrice = calcDiscountedPrice(selectedItem.price, selectedItem.discount_pct)
    const mod = pendingModifier
      ? { id: pendingModifier.id, name: pendingModifier.name, extraPrice: pendingModifier.extra_price }
      : null
    const cartKey = `${selectedItem.id}::${mod?.id ?? 'solo'}`
    const qty = pendingQty

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey)
      if (existing) return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + qty } : i)
      return [...prev, { cartKey, menuItemId: selectedItem.id, itemName: selectedItem.name, basePrice, quantity: qty, selectedModifier: mod }]
    })
    setPendingQty(1)
  }

  function updateQty(cartKey, delta) {
    setCart(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  function removeFromCart(cartKey) {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey))
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit() {
    if (customerName.trim().length < 2) { toast.error('Ingresá el nombre del cliente'); return }
    if (cart.length === 0)               { toast.error('Agregá al menos un producto');   return }
    if (!location)                        { toast.error('Ingresá la ubicación del cliente'); return }

    setSubmitting(true)
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name:    customerName.trim(),
          customer_phone:   customerPhone.trim() || 'Sin teléfono',
          delivery_address: location.address,
          delivery_lat:     location.lat,
          delivery_lng:     location.lng,
          notes:            notes.trim() || null,
          total,
        })
        .select('id, order_number')
        .single()

      if (orderError) throw orderError

      for (const item of cart) {
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id:     order.id,
            menu_item_id: item.menuItemId,
            item_name:    item.itemName,
            item_price:   item.basePrice,
            quantity:     item.quantity,
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
              extra_price:   item.selectedModifier.extraPrice,
            })
          if (modError) throw modError
        }
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(`Pedido #${order.order_number} creado ✓`)
      navigate('/admin/pedidos')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo guardar el pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: '#f7f9fc' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 20px' }}>
          <button
            onClick={() => navigate('/admin/pedidos')}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} color="#1c2b36" />
          </button>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, color: '#1c2b36', margin: 0 }}>
            Nuevo pedido
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Cliente ── */}
          <Card>
            <SectionTitle>Cliente</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={LABEL}>Nombre</label>
                <input
                  style={FIELD}
                  placeholder="Nombre y apellido"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label style={LABEL}>Teléfono</label>
                <input
                  style={FIELD}
                  type="tel"
                  placeholder="09xxxxxxxx"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* ── Productos ── */}
          <Card>
            <SectionTitle>Productos</SectionTitle>

            {menuLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Loader2 size={20} style={{ color: '#1d5e8c', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* Selector categoría + item */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  <div>
                    <label style={LABEL}>Categoría</label>
                    <select
                      style={{ ...FIELD, appearance: 'none' }}
                      value={effectiveCatId}
                      onChange={e => setSelectedCatId(e.target.value)}
                    >
                      {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Plato</label>
                    <select
                      style={{ ...FIELD, appearance: 'none' }}
                      value={effectiveItemId}
                      onChange={e => setSelectedItemId(e.target.value)}
                    >
                      {availableItems.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name} — {formatPrice(calcDiscountedPrice(i.price, i.discount_pct))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modificadores */}
                {modGroup && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: '#eaf3f8', borderRadius: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1d5e8c', marginBottom: 8 }}>
                      {modGroup.name}{modGroup.required ? ' *' : ' (opcional)'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {modGroup.modifiers.map(mod => {
                        const active = pendingModifier?.id === mod.id
                        return (
                          <button
                            key={mod.id}
                            onClick={() => setPendingModifier(active ? null : mod)}
                            style={{
                              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                              border: `1.5px solid ${active ? '#1d5e8c' : '#dbe9f0'}`,
                              background: active ? '#1d5e8c' : '#fff',
                              color: active ? '#fff' : '#1c2b36',
                            }}
                          >
                            {mod.name}{mod.extra_price > 0 ? ` +${formatPrice(mod.extra_price)}` : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Cantidad + agregar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', borderRadius: 12, padding: '6px 10px' }}>
                    <button
                      onClick={() => setPendingQty(q => Math.max(1, q - 1))}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Minus size={13} color="#1c2b36" />
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1c2b36', minWidth: 24, textAlign: 'center' }}>{pendingQty}</span>
                    <button
                      onClick={() => setPendingQty(q => q + 1)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #1d5e8c', background: '#1d5e8c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Plus size={13} color="#fff" />
                    </button>
                  </div>
                  <button
                    onClick={addToCart}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: '#1d5e8c', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Plus size={15} /> Agregar
                  </button>
                </div>

                {/* Carrito */}
                {cart.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 4 }}>
                      {cart.map(item => (
                        <CartItemRow
                          key={item.cartKey}
                          item={item}
                          onQtyChange={updateQty}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 0 0', borderTop: '2px solid #eaf3f8' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#7c8a93' }}>Total</span>
                      <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: '#1d5e8c' }}>{formatPrice(total)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ── Ubicación ── */}
          <Card>
            <SectionTitle>Ubicación de entrega</SectionTitle>

            {/* Pegar link de WhatsApp */}
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL}>
                <Link2 size={11} style={{ display: 'inline', marginRight: 4 }} />
                Pegá el link de ubicación de WhatsApp
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...FIELD, paddingRight: geocoding ? 36 : 14 }}
                  placeholder="https://maps.google.com/?q=... o -25.3652, -56.0183"
                  value={locationInput}
                  onChange={e => handleLocationPaste(e.target.value)}
                />
                {geocoding && (
                  <Loader2
                    size={15}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#1d5e8c', animation: 'spin 1s linear infinite' }}
                  />
                )}
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Funciona con links de Google Maps, Apple Maps o coordenadas directas
              </p>
            </div>

            {/* Separador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>o</span>
              <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
            </div>

            {/* Botón mapa */}
            <button
              onClick={() => setShowMap(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12, border: '1.5px solid #1d5e8c',
                background: location ? '#f0f7ff' : '#fff',
                color: '#1d5e8c', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Map size={15} />
              {location ? 'Cambiar en el mapa' : 'Elegir en el mapa'}
            </button>

            {/* Dirección confirmada */}
            {location && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: '10px 12px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <MapPin size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600, margin: 0 }}>{location.address}</p>
                  <a
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#16a34a', textDecoration: 'underline' }}
                  >
                    Ver en Google Maps
                  </a>
                </div>
                <button
                  onClick={() => { setLocation(null); setLocationInput('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                >
                  <X size={14} color="#16a34a" />
                </button>
              </div>
            )}
          </Card>

          {/* ── Notas ── */}
          <Card>
            <SectionTitle>Notas del pedido</SectionTitle>
            <textarea
              style={{ ...FIELD, minHeight: 72, resize: 'vertical' }}
              placeholder="Ej: sin cebolla, llamar al llegar…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Card>

          {/* ── Resumen rápido ── */}
          {cart.length > 0 && (
            <div style={{ padding: '12px 14px', background: '#1d5e8c', borderRadius: 16, color: '#fff', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingBag size={15} />
                  <span>{cart.reduce((s, i) => s + i.quantity, 0)} producto{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}</span>
                </div>
                <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: '#f2c14e' }}>{formatPrice(total)}</span>
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0 || !location || customerName.trim().length < 2}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: '#1d5e8c', color: '#fff', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: submitting || cart.length === 0 || !location || customerName.trim().length < 2 ? 0.5 : 1,
            }}
          >
            {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {submitting ? 'Guardando…' : 'Guardar pedido'}
          </button>

        </div>
      </div>

      {/* ── Modal mapa ── */}
      {showMap && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowMap(false) }}
        >
          <div style={{
            width: '100%', maxWidth: 520,
            background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '20px 16px 32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crosshair size={18} color="#1d5e8c" />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#1c2b36' }}>Elegir ubicación</span>
              </div>
              <button
                onClick={() => setShowMap(false)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#6b7280" />
              </button>
            </div>
            <LocationPicker
              onConfirm={loc => {
                setLocation(loc)
                setLocationInput('')
                setShowMap(false)
              }}
              onCancel={() => setShowMap(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
