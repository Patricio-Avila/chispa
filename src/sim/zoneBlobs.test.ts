import { describe, expect, it } from 'vitest'
import { blobOffset } from './zoneBlobs'

describe('blobOffset (privacidad en el mapa)', () => {
  it('es determinista por id', () => {
    expect(blobOffset('abc', 25.67)).toEqual(blobOffset('abc', 25.67))
  })

  it('ids distintos producen offsets distintos', () => {
    expect(blobOffset('abc', 25.67)).not.toEqual(blobOffset('xyz', 25.67))
  })

  it('nunca es el punto exacto: desplaza entre 120 y 400 m', () => {
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const { offsetM } = blobOffset(id, 25.67)
      expect(offsetM).toBeGreaterThanOrEqual(120)
      expect(offsetM).toBeLessThanOrEqual(400)
    }
  })
})
