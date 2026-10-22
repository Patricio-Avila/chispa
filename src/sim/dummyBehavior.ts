/** Comportamiento de los dummies (CLAUDE.md §10.3). */

import { mulberry32 } from './prng'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Probabilidad de que el dummy responda a tu Match. */
export function matchProbability(score: number, pickiness: number): number {
  return clamp(score * (1.2 - pickiness), 0.05, 0.9)
}

/** Decisión determinista por pareja: mismo par → misma respuesta. */
export function acceptsMatch(
  score: number,
  pickiness: number,
  seed: number,
): boolean {
  return mulberry32(seed >>> 0)() < matchProbability(score, pickiness)
}
