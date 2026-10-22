/** Compatibilidad y orden de la baraja (CLAUDE.md §10.2). */

import { hashString, mulberry32 } from './prng'
import type { Gender } from '../data/repo/types'

export type ScoringProfile = {
  id: string
  gender: Gender
  seeking: Gender[]
  age: number
  ageMin: number
  ageMax: number
  interests: string[]
}

export function jaccard(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setA = new Set(a)
  let common = 0
  for (const item of new Set(b)) {
    if (setA.has(item)) common++
  }
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : common / union
}

/** Filtros duros: género y edad mutuamente compatibles y dentro de la
 *  distancia máxima del usuario. */
export function passesHardFilters(
  user: ScoringProfile,
  candidate: ScoringProfile,
  distanceKm: number,
  maxDistanceKm: number,
): boolean {
  if (!user.seeking.includes(candidate.gender)) return false
  if (!candidate.seeking.includes(user.gender)) return false
  if (candidate.age < user.ageMin || candidate.age > user.ageMax) return false
  if (user.age < candidate.ageMin || user.age > candidate.ageMax) return false
  return distanceKm <= maxDistanceKm
}

/** Qué tan centrada está la edad del otro en las preferencias de cada quien. */
function ageCentering(age: number, min: number, max: number): number {
  if (max <= min) return age === min ? 1 : 0
  const mid = (min + max) / 2
  const half = (max - min) / 2
  return Math.max(0, 1 - Math.abs(age - mid) / half)
}

/** Ruido determinista por pareja (mismo par → mismo ruido). */
export function pairNoise(idA: string, idB: string): number {
  const [first, second] = idA < idB ? [idA, idB] : [idB, idA]
  return mulberry32(hashString(`${first}|${second}`))()
}

export function pairSeed(idA: string, idB: string): number {
  const [first, second] = idA < idB ? [idA, idB] : [idB, idA]
  return hashString(`match:${first}|${second}`)
}

export function compatibilityScore(
  user: ScoringProfile,
  candidate: ScoringProfile,
  distanceKm: number,
  radiusKm: number,
): number {
  const interests = jaccard(user.interests, candidate.interests)
  const closeness = Math.max(0, 1 - distanceKm / Math.max(radiusKm, 1))
  const ageScore =
    (ageCentering(candidate.age, user.ageMin, user.ageMax) +
      ageCentering(user.age, candidate.ageMin, candidate.ageMax)) /
    2
  const noise = pairNoise(user.id, candidate.id)
  return 0.35 * interests + 0.25 * closeness + 0.2 * ageScore + 0.2 * noise
}

/** Orden de la baraja: por puntaje descendente, mezclando al azar
 *  (determinista) dentro de bloques de 5 para que no se sienta rígido. */
export function orderDeck<T extends { score: number; id: string }>(
  scored: T[],
  shuffleSeed: number,
): T[] {
  const sorted = [...scored].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id),
  )
  const rng = mulberry32(shuffleSeed)
  const result: T[] = []
  for (let start = 0; start < sorted.length; start += 5) {
    const block = sorted.slice(start, start + 5)
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[block[i], block[j]] = [block[j]!, block[i]!]
    }
    result.push(...block)
  }
  return result
}
