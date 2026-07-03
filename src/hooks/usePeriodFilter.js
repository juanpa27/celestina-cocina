import { useState } from 'react'
import {
  NOW, THIS_YEAR, YESTERDAY,
  toInputDate, applyPeriodFilter, periodLabelFor, periodFilterKey,
} from '../lib/period'

// Estado + lógica de los filtros de período (Hoy/Semana/Mes/Todo/Por día/Por mes/Rango),
// compartido entre el Dashboard y la página de Reportes para no duplicar la lógica
// (incluye el fix de "aplicar solo al confirmar" en los inputs de fecha nativos).
export function usePeriodFilter(initialMode = 'today') {
  const [mode,        setMode]        = useState(initialMode)
  const [picker,      setPicker]      = useState(null) // null | 'day' | 'month' | 'range'
  const [customMonth, setCustomMonth] = useState(NOW.getMonth())
  const [customYear,  setCustomYear]  = useState(THIS_YEAR)
  const [customDay,   setCustomDay]   = useState(NOW)
  const [rangeStart,  setRangeStart]  = useState(YESTERDAY)
  const [rangeEnd,    setRangeEnd]    = useState(NOW)

  // Borradores: los inputs type="date" nativos disparan onChange en cada click
  // de las flechas del picker del navegador — no se aplica el filtro hasta confirmar.
  const [dayDraft,      setDayDraft]      = useState(toInputDate(NOW))
  const [rangeStartDraft, setRangeStartDraft] = useState(toInputDate(YESTERDAY))
  const [rangeEndDraft,   setRangeEndDraft]   = useState(toInputDate(NOW))

  function openPicker(name) {
    if (name === 'day')   setDayDraft(toInputDate(customDay))
    if (name === 'range') { setRangeStartDraft(toInputDate(rangeStart)); setRangeEndDraft(toInputDate(rangeEnd)) }
    setPicker(name)
  }
  function togglePicker(name) { setPicker(p => { if (p === name) return null; openPicker(name); return name }) }

  function pickQuick(val) { setMode(val); setPicker(null) }

  function pickMonth(month, year) {
    setCustomMonth(month)
    setCustomYear(year)
    setMode('custom')
    setPicker(null)
  }

  function pickDay(dateStr) {
    if (!dateStr) return
    const [y, m, d] = dateStr.split('-').map(Number)
    setCustomDay(new Date(y, m - 1, d))
    setMode('day')
    setPicker(null)
  }

  function pickRange(startStr, endStr) {
    if (!startStr || !endStr) return
    const [sy, sm, sd] = startStr.split('-').map(Number)
    const [ey, em, ed] = endStr.split('-').map(Number)
    let start = new Date(sy, sm - 1, sd)
    let end   = new Date(ey, em - 1, ed)
    if (start > end) [start, end] = [end, start]
    setRangeStart(start)
    setRangeEnd(end)
    setMode('range')
    setPicker(null)
  }

  const filter = { mode, customMonth, customYear, customDay, rangeStart, rangeEnd }

  return {
    mode, picker, customMonth, customYear, customDay, rangeStart, rangeEnd,
    dayDraft, setDayDraft, rangeStartDraft, setRangeStartDraft, rangeEndDraft, setRangeEndDraft,
    togglePicker, pickQuick, pickMonth, pickDay, pickRange, setCustomYear,
    isCustom: mode === 'custom', isDay: mode === 'day', isRange: mode === 'range',
    periodLabel: periodLabelFor(filter),
    filterKey: periodFilterKey(filter),
    filterOrders: (orders) => applyPeriodFilter(orders, filter),
  }
}
