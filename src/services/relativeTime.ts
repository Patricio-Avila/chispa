/** Fechas de PGlite ("2026-10-22 06:40:12.3+00") o ISO → Date. */
export function parseDbDate(value: string): Date {
  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct
  return new Date(value.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
}

/** "hace cuánto" en es-MX, corto, para Likes y Conversaciones. */
export function relativeTime(iso: string, now = new Date()): string {
  const date = parseDbDate(iso)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, (now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}
