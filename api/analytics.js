import { createClient } from '@supabase/supabase-js'

// Proxy autenticado a la Web Analytics API de Vercel: guarda el VERCEL_TOKEN
// del lado del servidor (nunca llega al bundle del admin) y devuelve solo
// las visitas al menú público (requestPath '/') de los últimos 30 días.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'unauthorized' })

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'unauthorized' })

  const { VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } = process.env
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return res.status(500).json({ error: 'not_configured' })
  }

  const until = new Date()
  const since = new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000)
  const toISODate = (d) => d.toISOString().slice(0, 10)

  const params = new URLSearchParams({
    projectId: VERCEL_PROJECT_ID,
    since: toISODate(since),
    until: toISODate(until),
    by: 'day',
    filter: "requestPath eq '/'",
  })
  if (VERCEL_TEAM_ID) params.set('teamId', VERCEL_TEAM_ID)

  try {
    const upstream = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    )

    if (!upstream.ok) {
      const body = await upstream.text()
      return res.status(upstream.status).json({ error: 'upstream_error', detail: body })
    }

    const { data } = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({
      days: (data ?? []).map(({ timestamp, pageviews, visitors }) => ({
        date: timestamp.slice(0, 10),
        pageviews,
        visitors,
      })),
    })
  } catch (err) {
    return res.status(502).json({ error: 'fetch_failed', detail: String(err) })
  }
}
