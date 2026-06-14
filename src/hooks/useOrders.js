import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      delivery_address, delivery_lat, delivery_lng,
      notes, total, status, created_at,
      order_items (
        id, item_name, item_price, quantity,
        order_item_modifiers ( id, modifier_name, extra_price )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export function useOrders({ onNewOrder } = {}) {
  const queryClient = useQueryClient()
  const onNewOrderRef = useRef(onNewOrder)
  useEffect(() => { onNewOrderRef.current = onNewOrder }, [onNewOrder])

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        payload => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          onNewOrderRef.current?.(payload.new)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [queryClient])

  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 0,
  })
}
