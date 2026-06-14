export function formatPrice(amount) {
  return `Gs ${Number(amount).toLocaleString('es-PY')}`
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

// Mensaje para Celestina (enviado desde el checkout del cliente)
export function buildWhatsAppMessage(orderNumber, items, total, customer) {
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
    customer.notes ? `📝 *Notas:* _${customer.notes}_` : null,
    ``,
    `✅ ¡Gracias por tu pedido!`,
  ]
    .filter(l => l !== null)
    .join('\n')
}

// Mensaje para Ajaka (enviado desde el checkout del cliente)
export function buildAjakaMessage(orderNumber, items, total, customer) {
  return [
    `🚗 *Delivery — Celestina Cocina #${orderNumber}*`,
    ``,
    `🛒 *Productos:*`,
    ...itemLines(items),
    ``,
    `💰 *TOTAL: ${formatPrice(total)}*`,
    ``,
    `📍 *Dirección:* ${customer.address}`,
    `👤 *Cliente:* ${customer.name}`,
    `📱 *Tel:* ${customer.phone}`,
    customer.notes ? `📝 _${customer.notes}_` : null,
  ]
    .filter(l => l !== null)
    .join('\n')
}

// Mensaje para Ajaka generado desde el admin (usa datos del pedido guardado)
export function buildAjakaMessageFromOrder(order) {
  return [
    `🚗 *Delivery — Celestina Cocina #${order.order_number}*`,
    ``,
    `🛒 *Productos:*`,
    ...orderItemLines(order.order_items),
    ``,
    `💰 *TOTAL: ${formatPrice(order.total)}*`,
    ``,
    `📍 *Dirección:* ${order.delivery_address}`,
    `👤 *Cliente:* ${order.customer_name}`,
    `📱 *Tel:* ${order.customer_phone}`,
    order.notes ? `📝 _${order.notes}_` : null,
  ]
    .filter(l => l !== null)
    .join('\n')
}
