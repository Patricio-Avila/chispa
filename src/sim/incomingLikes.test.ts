import { describe, expect, it } from 'vitest'
import {
  MAX_DELAY_S,
  MIN_DELAY_S,
  pickCandidate,
  pickDelayMs,
  pickTargetKind,
} from './incomingLikes'
import type { DeckRow } from '../data/repo/types'
import type { ScoringProfile } from './scoring'

describe('pickDelayMs', () => {
  it('queda entre 45 y 120 segundos', () => {
    expect(pickDelayMs(0)).toBe(MIN_DELAY_S * 1000)
    expect(pickDelayMs(1)).toBe(MAX_DELAY_S * 1000)
    expect(pickDelayMs(0.5)).toBeGreaterThan(MIN_DELAY_S * 1000)
    expect(pickDelayMs(0.5)).toBeLessThan(MAX_DELAY_S * 1000)
  })
})

describe('pickTargetKind', () => {
  it('60% perfil, 40% medio', () => {
    expect(pickTargetKind(0)).toBe('perfil')
    expect(pickTargetKind(0.59)).toBe('perfil')
    expect(pickTargetKind(0.6)).toBe('media')
    expect(pickTargetKind(0.99)).toBe('media')
  })
})

const user: ScoringProfile = {
  id: 'u',
  gender: 'hombre',
  seeking: ['mujer'],
  age: 28,
  ageMin: 20,
  ageMax: 40,
  interests: [],
}

function row(id: string, overrides: Partial<DeckRow> = {}): DeckRow {
  return {
    id,
    name: 'X',
    birthdate: '1998-01-01',
    gender: 'mujer',
    seeking: ['hombre'],
    ageMin: 18,
    ageMax: 45,
    bio: null,
    interests: [],
    areaLabel: 'Cerca de ti',
    personality: 'bromista',
    pickiness: 0.5,
    avatarSeed: 1,
    distanceKm: 5,
    lastPasar: null,
    ...overrides,
  }
}

describe('pickCandidate', () => {
  it('excluye a quien ya dio like', () => {
    const rows = [row('a'), row('b')]
    const candidate = pickCandidate(rows, user, 25, new Set(['a']), 0)
    expect(candidate?.id).toBe('b')
  })

  it('respeta los filtros duros (distancia, género)', () => {
    const rows = [
      row('lejos', { distanceKm: 80 }),
      row('otroGenero', { gender: 'hombre' }),
      row('ok'),
    ]
    const candidate = pickCandidate(rows, user, 25, new Set(), 0)
    expect(candidate?.id).toBe('ok')
  })

  it('devuelve null si no hay elegibles', () => {
    expect(pickCandidate([row('a')], user, 25, new Set(['a']), 0)).toBeNull()
  })
})
