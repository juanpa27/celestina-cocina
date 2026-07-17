import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Modo "retirar en el local" (sin delivery). Mismo patrón que useIsOpen: el
// valor vive en app_config como string 'true'/'false' y se refresca casi en
// vivo (staleTime 0 + refetch cada 30s) para que el toggle se refleje rápido en
// el checkout. Los textos (pickup_message / pickup_address) van por useConfig.
async function fetchPickupOnly() {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'pickup_only')
    .maybeSingle()
  if (error) return false          // fail-safe: ante error, seguir con delivery normal
  return data?.value === 'true'
}

export function usePickupOnly() {
  return useQuery({
    queryKey: ['pickup_only'],
    queryFn: fetchPickupOnly,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}
