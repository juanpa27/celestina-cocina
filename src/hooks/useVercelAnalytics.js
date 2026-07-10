import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'

async function fetchAnalytics(accessToken) {
  const res = await fetch('/api/analytics', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'analytics_error')
  }
  return res.json()
}

// Visitas al menú público (últimos 30 días) vía Vercel Web Analytics,
// para no tener que entrar al dashboard de Vercel a chequearlas.
export function useVercelAnalytics() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['vercel-analytics'],
    queryFn: () => fetchAnalytics(session.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
