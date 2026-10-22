/** PRNG determinista del simulador (CLAUDE.md §10.1). */

/** Hash FNV-1a de 32 bits para derivar semillas de cadenas. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export type Rng = () => number

/** mulberry32: rápido, determinista, suficiente para el POC. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** zone_key: lat/lng redondeadas a 2 decimales. */
export function zoneKeyFor(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`
}

export function seedForZone(zoneKey: string, seedVersion: number): number {
  return hashString(`${zoneKey}+${seedVersion}`)
}

/* Utilidades sobre un Rng */

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

export function pickMany<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items]
  const chosen: T[] = []
  while (chosen.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length)
    chosen.push(pool.splice(index, 1)[0]!)
  }
  return chosen
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function floatBetween(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}
