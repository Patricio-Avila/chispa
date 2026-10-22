import { describe, expect, it } from 'vitest'
import { relativeTime } from './relativeTime'

const NOW = new Date('2026-10-22T12:00:00')

describe('relativeTime', () => {
  it('hace un momento', () => {
    expect(relativeTime('2026-10-22T11:59:30', NOW)).toBe('hace un momento')
  })

  it('minutos', () => {
    expect(relativeTime('2026-10-22T11:55:00', NOW)).toBe('hace 5 min')
  })

  it('horas', () => {
    expect(relativeTime('2026-10-22T10:00:00', NOW)).toBe('hace 2 h')
  })

  it('ayer', () => {
    expect(relativeTime('2026-10-21T10:00:00', NOW)).toBe('ayer')
  })

  it('días', () => {
    expect(relativeTime('2026-10-19T10:00:00', NOW)).toBe('hace 3 días')
  })

  it('acepta el formato de PGlite (espacio en vez de T)', () => {
    expect(relativeTime('2026-10-22 11:55:00', NOW)).toBe('hace 5 min')
  })

  it('acepta timestamptz de PGlite con offset corto', () => {
    // 11:55 local = 17:55 UTC en CDMX (-06); usamos el mismo instante que NOW-5min
    const iso = new Date(NOW.getTime() - 5 * 60 * 1000).toISOString()
    const pgliteStyle = iso.replace('T', ' ').replace('Z', '+00')
    expect(relativeTime(pgliteStyle, NOW)).toBe('hace 5 min')
  })
})
