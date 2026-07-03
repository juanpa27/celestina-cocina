import { ALL_STATUSES } from './orderStatus'

// KPIs + agregados a partir de un array de pedidos ya filtrado por período.
// Compartido por Dashboard, Reportes y el modal de resumen del día.
export function computeReportStats(orders) {
  const billable  = orders.filter(o => o.status !== 'cancelado')
  const facturado = billable.reduce((n, o) => n + Number(o.total), 0)
  const pedidos   = billable.length
  const ticket    = pedidos ? Math.round(facturado / pedidos) : 0

  const productMap = {}
  for (const o of billable)
    for (const it of o.order_items ?? [])
      productMap[it.item_name] = (productMap[it.item_name] ?? 0) + it.quantity
  const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const statusCounts = ALL_STATUSES
    .map(s => ({ s, n: orders.filter(o => o.status === s).length }))
    .filter(x => x.n > 0)

  return { billable, facturado, pedidos, ticket, topProducts, statusCounts }
}
