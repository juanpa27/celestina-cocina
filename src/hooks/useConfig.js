import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchConfig() {
  const { data, error } = await supabase.from('app_config').select('key, value')
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.key, r.value]))
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: 1000 * 60 * 10, // 10 min — los números no cambian seguido
  })
}
