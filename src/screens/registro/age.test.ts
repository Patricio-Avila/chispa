import { describe, expect, it } from 'vitest'
import { ageFromBirthdate, isAdult } from './age'

const TODAY = new Date('2026-10-21T12:00:00')

describe('ageFromBirthdate', () => {
  it('calcula años cumplidos', () => {
    expect(ageFromBirthdate('2000-10-21', TODAY)).toBe(26)
    expect(ageFromBirthdate('2000-10-22', TODAY)).toBe(25)
    expect(ageFromBirthdate('2000-01-01', TODAY)).toBe(26)
    expect(ageFromBirthdate('2000-12-31', TODAY)).toBe(25)
  })

  it('devuelve NaN con fecha inválida', () => {
    expect(ageFromBirthdate('no-es-fecha', TODAY)).toBeNaN()
  })
})

describe('isAdult (bloqueo a menores de 18)', () => {
  it('acepta exactamente 18 años cumplidos hoy', () => {
    expect(isAdult('2008-10-21', TODAY)).toBe(true)
  })

  it('bloquea a quien cumple 18 mañana', () => {
    expect(isAdult('2008-10-22', TODAY)).toBe(false)
  })

  it('bloquea fechas inválidas', () => {
    expect(isAdult('', TODAY)).toBe(false)
  })
})
