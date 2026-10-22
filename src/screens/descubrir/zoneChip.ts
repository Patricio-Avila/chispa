import type { LocationContext } from '../../data/repo'
import { parseDbDate } from '../../services/relativeTime'

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function dayMonth(iso: string): { day: number; month: number } | null {
  const date = parseDbDate(iso)
  if (Number.isNaN(date.getTime())) return null
  return { day: date.getUTCDate(), month: date.getUTCMonth() }
}

/** Texto del chip de ubicación: "Cintermex · 18–20 oct" en modo
 *  "Voy a ir" con fechas; solo el label en "Estoy aquí". */
export function formatZoneChip(location: LocationContext): string {
  if (location.mode !== 'voy' || !location.dateFrom) return location.label
  const from = dayMonth(location.dateFrom)
  if (!from) return location.label
  const to = location.dateTo ? dayMonth(location.dateTo) : null
  if (!to || (to.day === from.day && to.month === from.month)) {
    return `${location.label} · ${from.day} ${MONTHS[from.month]}`
  }
  if (to.month === from.month) {
    return `${location.label} · ${from.day}–${to.day} ${MONTHS[to.month]}`
  }
  return `${location.label} · ${from.day} ${MONTHS[from.month]} – ${to.day} ${MONTHS[to.month]}`
}
