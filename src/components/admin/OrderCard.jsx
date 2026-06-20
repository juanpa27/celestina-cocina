import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Phone, User, ChevronDown, ChevronUp, MessageCircle, FileText } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatPrice, buildAjakaMessageFromOrder } from '../../lib/utils'
import { useConfig } from '../../hooks/useConfig'
import { STATUS_META, STATUS_FLOW, urgencyColor } from '../../lib/orderStatus'
import StatusBadge from './StatusBadge'

const TRANSITIONS = {
  pendiente:  [{ to: 'preparando', label: 'Comenzar preparación', color: '#1d5e8c' }, { to: 'cancelado', label: 'Cancelar', color: '#6b7280', ghost: true }],
  preparando: [{ to: 'enviado',    label: 'Marcar como enviado',   color: '#6d28d9' }, { to: 'cancelado', label: 'Cancelar', color: '#6b7280', ghost: true }],
  enviado:    [{ to: 'entregado',  label: 'Confirmar entrega',      color: '#16a34a' }],
  entregado:  [],
  cancelado:  [],
}

// Stepper de progreso del pedido: nodos con ícono, llenos hasta el estado actual.
function StatusStepper({ status }) {
  if (status === 'cancelado') {
    const meta = STATUS_META.cancelado
    return (
      <div
        className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
        style={{ background: '#fef2f2', color: '#b91c1c' }}
      >
        <meta.Icon size={13} /> Pedido cancelado
      </div>
    )
  }
  const idx = STATUS_FLOW.indexOf(status)
  return (
    <div className="flex items-center pt-1">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= idx
        const meta = STATUS_META[s]
        const Icon = meta.Icon
        return (
          <Fragment key={s}>
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
              style={{ width: 24, height: 24, background: done ? meta.solid : '#eef2f6' }}
            >
              <Icon size={12} strokeWidth={2.5} color={done ? '#fff' : '#9ca3af'} />
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className="flex-1 mx-1 rounded-full transition-colors"
                style={{ height: 3, background: i < idx ? STATUS_META[STATUS_FLOW[i + 1]].solid : '#eef2f6' }}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

export default function OrderCard({ order }) {
  const queryClient = useQueryClient()
  const { data: config } = useConfig()
  const [expanded, setExpanded] = useState(order.status === 'pendiente')
  const [updating, setUpdating] = useState(false)

  const meta = STATUS_META[order.status] ?? STATUS_META.pendiente
  const transitions = TRANSITIONS[order.status] ?? []
  const createdAt = new Date(order.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: es })
  // El reloj de urgencia solo aplica a pendientes (un entregado viejo no es urgente).
  const isPending = order.status === 'pendiente'
  const timeColor = isPending ? urgencyColor(differenceInMinutes(new Date(), createdAt)) : '#9ca3af'

  // Total con "Gs" atenuado.
  const [cur, ...amount] = formatPrice(order.total).split(' ')

  function notifyAjaka() {
    const number = config?.whatsapp_ajaka
    if (!number) {
      toast.error('Número de Ajaka no configurado.')
      return
    }
    const msg = buildAjakaMessageFromOrder(order)
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function changeStatus(newStatus) {
    setUpdating(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id)

    if (error) {
      toast.error('No se pudo actualizar el estado.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
    setUpdating(false)
  }

  const mapsUrl = order.delivery_lat && order.delivery_lng
    ? `https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border: '1px solid #e9eef3',
        borderLeft: `4px solid ${meta.solid}`,
        boxShadow: isPending ? '0 4px 18px rgba(242,193,78,0.22)' : '0 1px 5px rgba(20,40,60,0.05)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display font-bold text-xl flex-shrink-0" style={{ color: '#1d5e8c' }}>
            #{order.order_number}
          </span>
          <StatusBadge status={order.status} />
          <span className="text-xs font-semibold truncate" style={{ color: timeColor }}>
            {isPending && '⏱ '}{timeAgo}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-bold whitespace-nowrap" style={{ color: '#1c2b36' }}>
            <span className="text-[11px] font-semibold mr-0.5" style={{ color: '#9ca3af' }}>{cur}</span>
            <span className="text-[17px] font-display">{amount.join(' ')}</span>
          </span>
          {expanded ? <ChevronUp size={16} style={{ color: '#6b7280' }} /> : <ChevronDown size={16} style={{ color: '#6b7280' }} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: '1px solid #f3f4f6' }}>

              {/* Stepper de progreso */}
              <div className="pt-3">
                <StatusStepper status={order.status} />
              </div>

              {/* Datos del cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                  <User size={14} style={{ color: '#5b96bf', flexShrink: 0 }} />
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: '#1d5e8c' }}
                >
                  <Phone size={14} style={{ flexShrink: 0 }} />
                  {order.customer_phone}
                </a>
                <div className="flex items-start gap-2 text-sm sm:col-span-2" style={{ color: '#374151' }}>
                  <MapPin size={14} style={{ color: '#5b96bf', flexShrink: 0, marginTop: 2 }} />
                  <span className="flex-1">{order.delivery_address}</span>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold whitespace-nowrap"
                      style={{ color: '#1d5e8c' }}
                    >
                      Ver mapa →
                    </a>
                  )}
                </div>
                {order.notes && (
                  <p className="text-xs sm:col-span-2 px-2 py-1.5 rounded-lg italic" style={{ background: '#fef9c3', color: '#854d0e' }}>
                    <span className="inline-flex items-center gap-1.5"><FileText size={12} />{order.notes}</span>
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f3f4f6' }}>
                {order.order_items?.map(item => {
                  const mods = item.order_item_modifiers ?? []
                  const lineTotal = (item.item_price + mods.reduce((n, m) => n + m.extra_price, 0)) * item.quantity
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between px-3 py-2 text-sm"
                      style={{ borderBottom: '1px solid #f9fafb' }}
                    >
                      <div>
                        <span className="font-semibold" style={{ color: '#1c2b36' }}>
                          {item.quantity}× {item.item_name}
                        </span>
                        {mods.map(m => (
                          <span key={m.id} className="block text-xs ml-3" style={{ color: '#6b7280' }}>
                            └ {m.modifier_name} {m.extra_price > 0 && `(+${formatPrice(m.extra_price)})`}
                          </span>
                        ))}
                      </div>
                      <span className="font-semibold text-xs whitespace-nowrap" style={{ color: '#1c2b36' }}>
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  )
                })}
                <div className="flex justify-between px-3 py-2 font-bold text-sm" style={{ background: '#f9fafb' }}>
                  <span style={{ color: '#1d5e8c' }}>Total</span>
                  <span style={{ color: '#1d5e8c' }}>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Acciones de estado */}
              {transitions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {transitions.map(t => (
                    <button
                      key={t.to}
                      onClick={() => changeStatus(t.to)}
                      disabled={updating}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-85 disabled:opacity-50"
                      style={t.ghost
                        ? { background: 'transparent', color: t.color, border: `1.5px solid #d1d5db` }
                        : { background: t.color, color: '#fff', border: '1.5px solid transparent' }
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Notificar Ajaka — siempre visible, error si no está configurado */}
              <div className="pt-1">
                <button
                  onClick={notifyAjaka}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-85"
                  style={{ background: '#25d366' }}
                >
                  <MessageCircle size={13} />
                  Notificar Ajaka
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
