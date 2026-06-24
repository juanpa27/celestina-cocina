import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { isWithinSchedule } from '../lib/utils'

async function fetchIsOpen() {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', ['is_open', 'schedule_open', 'schedule_close'])
  if (error) return true
  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  if (map.is_open === 'false') return false    // toggle manual: cerrado
  if (map.is_open === 'true')  return true     // toggle manual: abierto (gana al horario)
  return isWithinSchedule(map.schedule_open, map.schedule_close)
}

export function useIsOpen() {
  return useQuery({
    queryKey: ['is_open'],
    queryFn: fetchIsOpen,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}
