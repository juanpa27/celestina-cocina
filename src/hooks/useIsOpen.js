import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchIsOpen() {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'is_open')
    .single()
  if (error) return true // si no existe la clave, asumir abierto
  return data.value === 'true'
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
