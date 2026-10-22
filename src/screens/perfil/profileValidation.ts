import { INTERESTS } from '../../sim/catalogs.es'

export const BIO_MAX_LENGTH = 300
export const INTERESTS_MIN = 3
export const INTERESTS_MAX = 8

export function validateBio(bio: string): string | null {
  if (bio.length > BIO_MAX_LENGTH) {
    return `La bio puede tener máximo ${BIO_MAX_LENGTH} caracteres.`
  }
  return null
}

/** Intereses del perfil: de 3 a 8, todos del catálogo (CLAUDE.md §8.2-15). */
export function validateInterests(interests: string[]): string | null {
  if (interests.some((interest) => !(INTERESTS as readonly string[]).includes(interest))) {
    return 'Hay un interés fuera del catálogo.'
  }
  if (interests.length < INTERESTS_MIN) {
    return `Elige al menos ${INTERESTS_MIN} intereses.`
  }
  if (interests.length > INTERESTS_MAX) {
    return `Elige máximo ${INTERESTS_MAX} intereses.`
  }
  return null
}
