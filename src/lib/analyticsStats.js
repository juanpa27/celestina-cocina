// Utilidades para el arreglo diario que devuelve /api/analytics (30 días, buckets UTC).
// Nota: los buckets de Vercel son por día UTC, puede haber un desfasaje de unas
// horas contra el día calendario de Paraguay — aceptable para este widget
// informativo, no se usa para nada financiero.

export function sliceLastNDays(days = [], n) {
  return days.slice(-n)
}

export function sumRange(days = []) {
  return days.reduce(
    (acc, d) => ({
      pageviews: acc.pageviews + (d.pageviews ?? 0),
      visitors: acc.visitors + (d.visitors ?? 0),
    }),
    { pageviews: 0, visitors: 0 }
  )
}
