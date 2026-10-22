/** Manchas de zona (CLAUDE.md §8.2-6): los perfiles se muestran como
 *  círculos de ~400 m con desplazamiento aleatorio determinista,
 *  nunca como puntos exactos. */

import { hashString, mulberry32 } from './prng'

export const BLOB_RADIUS_M = 400
const MIN_OFFSET_M = 120
const MAX_OFFSET_M = 400

export type BlobOffset = { dLat: number; dLng: number; offsetM: number }

/** Desplazamiento determinista por id, entre 120 y 400 m. */
export function blobOffset(id: string, lat: number): BlobOffset {
  const rng = mulberry32(hashString(`blob:${id}`))
  const offsetM = MIN_OFFSET_M + rng() * (MAX_OFFSET_M - MIN_OFFSET_M)
  const bearing = rng() * 2 * Math.PI
  const dLat = (offsetM * Math.cos(bearing)) / 111_320
  const dLng =
    (offsetM * Math.sin(bearing)) /
    (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))
  return { dLat, dLng, offsetM }
}
