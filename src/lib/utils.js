export function formatPrice(amount) {
  return `Gs ${Number(amount).toLocaleString('es-PY')}`
}

export function vibrateFeedback(ms = 40) {
  navigator.vibrate?.(ms)
}

// Verifica si la hora actual cae dentro del horario de atención.
// open/close son strings "HH:MM". Si alguno falta, devuelve true (sin restricción).
export function isWithinSchedule(open, close) {
  if (!open || !close) return true
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const openMins = oh * 60 + om
  const closeMins = ch * 60 + cm
  if (closeMins > openMins) return nowMins >= openMins && nowMins < closeMins
  return nowMins >= openMins || nowMins < closeMins // horario que cruza medianoche
}

// Líneas de items del carrito (checkout)
function itemLines(items) {
  return items.map((i, idx) => {
    const mod = i.selectedModifier ? ` _(${i.selectedModifier.name})_` : ''
    const lineTotal = (i.basePrice + (i.selectedModifier?.extraPrice ?? 0)) * i.quantity
    return `${idx + 1}. *${i.quantity}x ${i.itemName}*${mod}\n    ${formatPrice(lineTotal)}`
  })
}

// Líneas de items de un pedido guardado (admin)
function orderItemLines(orderItems) {
  return (orderItems ?? []).map((item, idx) => {
    const mods = item.order_item_modifiers ?? []
    const modText = mods.length > 0 ? ` _(${mods.map(m => m.modifier_name).join(', ')})_` : ''
    const lineTotal = (item.item_price + mods.reduce((n, m) => n + (m.extra_price ?? 0), 0)) * item.quantity
    return `${idx + 1}. *${item.quantity}x ${item.item_name}*${modText}\n    ${formatPrice(lineTotal)}`
  })
}

function mapsLink(lat, lng) {
  if (!lat || !lng) return null
  return `https://maps.google.com/?q=${lat},${lng}`
}

// Mensaje para Celestina (enviado desde el checkout del cliente)
export function buildWhatsAppMessage(orderNumber, items, total, customer) {
  const link = mapsLink(customer.lat, customer.lng)
  return [
    `✨ *Celestina Cocina — Pedido #${orderNumber}*`,
    ``,
    `🛒 *Productos:*`,
    ...itemLines(items),
    ``,
    `💰 *TOTAL: ${formatPrice(total)}*`,
    ``,
    `📦 *Datos de entrega:*`,
    `👤 *Nombre:* ${customer.name}`,
    `📱 *Tel:* ${customer.phone}`,
    `📍 *Dirección:* ${customer.address}`,
    link ? `🗺 *Ver en mapa:* ${link}` : null,
    customer.notes ? `📝 *Notas:* _${customer.notes}_` : null,
    ``,
    `✅ ¡Gracias por tu pedido!`,
  ]
    .filter(l => l !== null)
    .join('\n')
}

// Mensaje para Ajaka (enviado desde el checkout del cliente)
export function buildAjakaMessage(orderNumber, items, total, customer) {
  const link = mapsLink(customer.lat, customer.lng)
  return [
    `🚗 *Delivery — Celestina Cocina #${orderNumber}*`,
    ``,
    `🛒 *Productos:*`,
    ...itemLines(items),
    ``,
    `💰 *TOTAL: ${formatPrice(total)}*`,
    ``,
    `📍 *Dirección:* ${customer.address}`,
    link ? `🗺 ${link}` : null,
    `👤 *Cliente:* ${customer.name}`,
    `📱 *Tel:* ${customer.phone}`,
    customer.notes ? `📝 _${customer.notes}_` : null,
  ]
    .filter(l => l !== null)
    .join('\n')
}

// Mensaje para Ajaka generado desde el admin (usa datos del pedido guardado)
export function buildAjakaMessageFromOrder(order) {
  const link = mapsLink(order.delivery_lat, order.delivery_lng)
  return [
    `🚗 *Delivery — Celestina Cocina #${order.order_number}*`,
    ``,
    `🛒 *Productos:*`,
    ...orderItemLines(order.order_items),
    ``,
    `💰 *TOTAL: ${formatPrice(order.total)}*`,
    ``,
    `📍 *Dirección:* ${order.delivery_address}`,
    link ? `🗺 ${link}` : null,
    `👤 *Cliente:* ${order.customer_name}`,
    `📱 *Tel:* ${order.customer_phone}`,
    order.notes ? `📝 _${order.notes}_` : null,
  ]
    .filter(l => l !== null)
    .join('\n')
}
