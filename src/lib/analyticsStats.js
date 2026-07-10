// Resume el arreglo diario de la Web Analytics API en hoy/semana/mes.
// Nota: los buckets de Vercel son por día UTC, puede haber un desfasaje
// de unas horas contra el día calendario de Paraguay — aceptable para
// este widget informativo, no se usa para nada financiero.
export function summarizeVisits(days = []) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const weekAgoStr = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const sum = (arr, key) => arr.reduce((acc, d) => acc + (d[key] ?? 0), 0)
  const today = days.find(d => d.date === todayStr) ?? { pageviews: 0, visitors: 0 }
  const weekDays = days.filter(d => d.date >= weekAgoStr)

  return {
    today: { pageviews: today.pageviews, visitors: today.visitors },
    week: { pageviews: sum(weekDays, 'pageviews'), visitors: sum(weekDays, 'visitors') },
    month: { pageviews: sum(days, 'pageviews'), visitors: sum(days, 'visitors') },
  }
}
