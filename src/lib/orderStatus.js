import { Clock, ChefHat, Bike, CheckCircle2, XCircle } from 'lucide-react'

// Metadatos visuales de cada estado de pedido, compartidos por StatusBadge,
// la franja lateral de la card y el stepper de progreso.
export const STATUS_META = {
  pendiente:  { label: 'Pendiente',  bg: '#fef9c3', text: '#854d0e', solid: '#f2c14e', Icon: Clock },
  preparando: { label: 'Preparando', bg: '#dbeafe', text: '#1e40af', solid: '#1d5e8c', Icon: ChefHat },
  enviado:    { label: 'Enviado',    bg: '#ede9fe', text: '#6d28d9', solid: '#6d28d9', Icon: Bike },
  entregado:  { label: 'Entregado',  bg: '#dcfce7', text: '#166534', solid: '#16a34a', Icon: CheckCircle2 },
  cancelado:  { label: 'Cancelado',  bg: '#f3f4f6', text: '#6b7280', solid: '#9ca3af', Icon: XCircle },
}

// Secuencia "viva" de un pedido (cancelado queda fuera del flujo lineal).
export const STATUS_FLOW = ['pendiente', 'preparando', 'enviado', 'entregado']

export const ALL_STATUSES = Object.keys(STATUS_META)

// Color de urgencia para un pedido pendiente según minutos de antigüedad.
export function urgencyColor(minutes) {
  if (minutes < 10) return '#16a34a'   // fresco
  if (minutes < 25) return '#b45309'   // atención
  return '#dc2626'                     // urgente
}
