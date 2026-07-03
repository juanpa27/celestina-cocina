import { startOfDay, endOfDay, startOfWeek, startOfMonth, isAfter, isSameDay, format } from 'date-fns'
import { es } from 'date-fns/locale'

export const NOW       = new Date()
export const YESTERDAY  = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1)
export const THIS_YEAR  = NOW.getFullYear()
export const YEARS      = [THIS_YEAR, THIS_YEAR + 1]

export const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
export const MONTH_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export const QUICK = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: null,    label: 'Todo' },
]

export const toInputDate = (d) => format(d, 'yyyy-MM-dd')

// Label largo de un día: "Viernes 3 de julio de 2026" (+ " · Hoy" si es hoy)
export function dayLabel(d) {
  const s = format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  const cap = s.charAt(0).toUpperCase() + s.slice(1)
  return isSameDay(d, new Date()) ? `${cap} · Hoy` : cap
}

// Label corto de un día: "3 de julio" — para botones ("Ver pedidos 3 de julio")
export function shortDayLabel(d) {
  return format(d, "d 'de' MMMM", { locale: es })
}

// Label corto para un rango: "3 jul – 10 jul 2026"
export function rangeLabel(start, end) {
  const sameYear  = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  const a = format(start, sameMonth ? 'd' : 'd MMM', { locale: es })
  const b = format(end, sameYear ? 'd MMM' : 'd MMM yyyy', { locale: es })
  return `${a} – ${b}${sameYear ? ` ${end.getFullYear()}` : ''}`
}

export function applyPeriodFilter(orders, filter) {
  if (!orders) return []
  const { mode, customMonth, customYear, customDay, rangeStart, rangeEnd } = filter
  const now = new Date()
  if (mode === 'today')  return orders.filter(o => isAfter(new Date(o.created_at), startOfDay(now)))
  if (mode === 'week')   return orders.filter(o => isAfter(new Date(o.created_at), startOfWeek(now, { weekStartsOn: 1 })))
  if (mode === 'month')  return orders.filter(o => isAfter(new Date(o.created_at), startOfMonth(now)))
  if (mode === 'day')    return orders.filter(o => isSameDay(new Date(o.created_at), customDay))
  if (mode === 'range')  return orders.filter(o => {
    const d = new Date(o.created_at)
    return d >= startOfDay(rangeStart) && d <= endOfDay(rangeEnd)
  })
  if (mode === 'custom') return orders.filter(o => {
    const d = new Date(o.created_at)
    return d.getMonth() === customMonth && d.getFullYear() === customYear
  })
  return orders
}

export function periodLabelFor(filter) {
  const { mode, customMonth, customYear, customDay, rangeStart, rangeEnd } = filter
  if (mode === 'custom') return `${MONTH_FULL[customMonth]} ${customYear}`
  if (mode === 'day')    return dayLabel(customDay)
  if (mode === 'range')  return rangeLabel(rangeStart, rangeEnd)
  return QUICK.find(q => q.value === mode)?.label ?? 'Todo'
}

export function periodFilterKey(filter) {
  const { mode, customMonth, customYear, customDay, rangeStart, rangeEnd } = filter
  if (mode === 'custom') return `m-${customYear}-${customMonth}`
  if (mode === 'day')    return `d-${toInputDate(customDay)}`
  if (mode === 'range')  return `r-${toInputDate(rangeStart)}_${toInputDate(rangeEnd)}`
  return String(mode)
}
