import { describe, expect, it } from 'vitest'
import {
  compatibilityScore,
  jaccard,
  orderDeck,
  pairNoise,
  passesHardFilters,
  type ScoringProfile,
} from './scoring'

const user: ScoringProfile = {
  id: 'user-1',
  gender: 'hombre',
  seeking: ['mujer'],
  age: 28,
  ageMin: 22,
  ageMax: 35,
  interests: ['Café', 'Senderismo', 'Cine'],
}

function candidate(overrides: Partial<ScoringProfile> = {}): ScoringProfile {
  return {
    id: 'dummy-1',
    gender: 'mujer',
    seeking: ['hombre'],
    age: 27,
    ageMin: 20,
    ageMax: 40,
    interests: ['Café', 'Yoga'],
    ...overrides,
  }
}

describe('jaccard', () => {
  it('calcula intersección sobre unión', () => {
    expect(jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3)
    expect(jaccard(['a'], ['a'])).toBe(1)
    expect(jaccard(['a'], ['b'])).toBe(0)
    expect(jaccard([], [])).toBe(0)
  })
})

describe('passesHardFilters', () => {
  it('acepta un par mutuamente compatible y cercano', () => {
    expect(passesHardFilters(user, candidate(), 5, 25)).toBe(true)
  })

  it('rechaza si el género no es mutuo', () => {
    expect(passesHardFilters(user, candidate({ gender: 'hombre' }), 5, 25)).toBe(false)
    expect(passesHardFilters(user, candidate({ seeking: ['mujer'] }), 5, 25)).toBe(false)
  })

  it('rechaza edades fuera de rango en cualquiera de los dos sentidos', () => {
    expect(passesHardFilters(user, candidate({ age: 40 }), 5, 25)).toBe(false)
    expect(passesHardFilters(user, candidate({ ageMin: 30 }), 5, 25)).toBe(false)
  })

  it('rechaza más allá de la distancia máxima', () => {
    expect(passesHardFilters(user, candidate(), 26, 25)).toBe(false)
  })
})

describe('compatibilityScore', () => {
  it('es determinista por pareja', () => {
    const a = compatibilityScore(user, candidate(), 5, 10)
    const b = compatibilityScore(user, candidate(), 5, 10)
    expect(a).toBe(b)
  })

  it('queda en [0, 1]', () => {
    const score = compatibilityScore(user, candidate(), 5, 10)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('más intereses en común sube el puntaje', () => {
    const low = compatibilityScore(user, candidate({ interests: ['Yoga'] }), 5, 10)
    const high = compatibilityScore(
      user,
      candidate({ interests: ['Café', 'Senderismo', 'Cine'] }),
      5,
      10,
    )
    expect(high).toBeGreaterThan(low)
  })

  it('el ruido por pareja es estable y simétrico', () => {
    expect(pairNoise('a', 'b')).toBe(pairNoise('b', 'a'))
    expect(pairNoise('a', 'b')).not.toBe(pairNoise('a', 'c'))
  })
})

describe('orderDeck', () => {
  const scored = Array.from({ length: 12 }, (_, i) => ({
    id: `d${i}`,
    score: 1 - i * 0.05,
  }))

  it('es determinista con la misma semilla', () => {
    expect(orderDeck(scored, 42)).toEqual(orderDeck(scored, 42))
  })

  it('mezcla solo dentro de bloques de 5', () => {
    const ordered = orderDeck(scored, 42)
    const firstBlock = ordered.slice(0, 5).map((c) => c.id)
    expect(firstBlock.sort()).toEqual(['d0', 'd1', 'd2', 'd3', 'd4'])
    const secondBlock = ordered.slice(5, 10).map((c) => c.id)
    expect(secondBlock.sort()).toEqual(['d5', 'd6', 'd7', 'd8', 'd9'])
  })
})
