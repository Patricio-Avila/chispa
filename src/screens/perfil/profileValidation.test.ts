import { describe, expect, it } from 'vitest'
import {
  BIO_MAX_LENGTH,
  validateBio,
  validateInterests,
} from './profileValidation'

describe('validateBio', () => {
  it('acepta hasta 300 caracteres', () => {
    expect(validateBio('a'.repeat(BIO_MAX_LENGTH))).toBeNull()
    expect(validateBio('')).toBeNull()
  })

  it('rechaza más de 300', () => {
    expect(validateBio('a'.repeat(BIO_MAX_LENGTH + 1))).toContain('300')
  })
})

describe('validateInterests (3 a 8 del catálogo)', () => {
  const catalogo = ['Café', 'Senderismo', 'Cine', 'Gaming', 'Yoga', 'Viajar', 'Leer', 'Gym', 'Arte']

  it('acepta de 3 a 8 del catálogo', () => {
    expect(validateInterests(catalogo.slice(0, 3))).toBeNull()
    expect(validateInterests(catalogo.slice(0, 8))).toBeNull()
  })

  it('rechaza menos de 3 y más de 8', () => {
    expect(validateInterests(catalogo.slice(0, 2))).toContain('al menos 3')
    expect(validateInterests(catalogo.slice(0, 9))).toContain('máximo 8')
  })

  it('rechaza intereses fuera del catálogo', () => {
    expect(validateInterests(['Café', 'Senderismo', 'Paracaidismo'])).toContain(
      'catálogo',
    )
  })
})
