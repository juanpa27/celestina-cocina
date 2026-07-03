import { format } from 'date-fns'
import { ALL_STATUSES } from './orderStatus'

// KPIs + agregados a partir de un array de pedidos ya filtrado por período.
// Foco en montos (Gs) — es lo que la dueña necesita para saber cuánto vendió,
// no en cantidades de platos (eso vive solo en "Más vendidos" del Dashboard).
// Compartido por Dashboard, Reportes y el modal de resumen de pedidos.
export function computeReportStats(orders) {
  const billable  = orders.filter(o => o.status !== 'cancelado')
  const facturado = billable.reduce((n, o) => n + Number(o.total), 0)
  const pedidos   = billable.length
  const ticket    = pedidos ? Math.round(facturado / pedidos) : 0

  const cancelados     = orders.filter(o => o.status === 'cancelado')
  const montoCancelado = cancelados.reduce((n, o) => n + Number(o.total), 0)

  // Facturación por día calendario — solo tiene sentido cuando el período
  // abarca más de una fecha (semana / mes / rango).
  const dayMap = {}
  for (const o of billable) {
    const key = format(new Date(o.created_at), 'yyyy-MM-dd')
    dayMap[key] = (dayMap[key] ?? 0) + Number(o.total)
  }
  const byDay = Object.entries(dayMap)
    .map(([key, monto]) => {
      const [y, m, d] = key.split('-').map(Number)
      return { date: new Date(y, m - 1, d), monto }
    })
    .sort((a, b) => a.date - b.date)

  // Facturación por estado (incluye cancelados, para dimensionar cuánto se perdió).
  const statusCounts = ALL_STATUSES
    .map(s => {
      const os = orders.filter(o => o.status === s)
      return { s, n: os.length, monto: os.reduce((n, o) => n + Number(o.total), 0) }
    })
    .filter(x => x.n > 0)

  const productMap = {}
  for (const o of billable)
    for (const it of o.order_items ?? [])
      productMap[it.item_name] = (productMap[it.item_name] ?? 0) + it.quantity
  const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return { billable, facturado, pedidos, ticket, montoCancelado, byDay, statusCounts, topProducts }
}
