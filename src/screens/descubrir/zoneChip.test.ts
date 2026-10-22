import { describe, expect, it } from 'vitest'
import { formatZoneChip } from './zoneChip'
import type { LocationContext } from '../../data/repo'

function context(overrides: Partial<LocationContext>): LocationContext {
  return {
    mode: 'aqui',
    lat: 25.67,
    lng: -100.31,
    label: 'Cintermex',
    radiusKm: 10,
    dateFrom: null,
    dateTo: null,
    ...overrides,
  }
}

describe('formatZoneChip', () => {
  it('en "Estoy aquí" muestra solo el label', () => {
    expect(formatZoneChip(context({}))).toBe('Cintermex')
  })

  it('en "Voy a ir" con fechas del mismo mes: "18–20 oct"', () => {
    expect(
      formatZoneChip(
        context({ mode: 'voy', dateFrom: '2026-10-18', dateTo: '2026-10-20' }),
      ),
    ).toBe('Cintermex · 18–20 oct')
  })

  it('meses distintos: "30 oct – 2 nov"', () => {
    expect(
      formatZoneChip(
        context({ mode: 'voy', dateFrom: '2026-10-30', dateTo: '2026-11-02' }),
      ),
    ).toBe('Cintermex · 30 oct – 2 nov')
  })

  it('una sola fecha: "18 oct"', () => {
    expect(
      formatZoneChip(context({ mode: 'voy', dateFrom: '2026-10-18' })),
    ).toBe('Cintermex · 18 oct')
  })

  it('"Voy a ir" sin fechas: solo el label', () => {
    expect(formatZoneChip(context({ mode: 'voy' }))).toBe('Cintermex')
  })
})
