import { describe, expect, it } from 'vitest'
import { hashString, mulberry32, seedForZone, zoneKeyFor } from './prng'

describe('mulberry32', () => {
  it('misma semilla produce la misma secuencia', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })

  it('semillas distintas producen secuencias distintas', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const seqA = Array.from({ length: 5 }, () => a())
    const seqB = Array.from({ length: 5 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('genera valores en [0, 1)', () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 100; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('zoneKeyFor / seedForZone', () => {
  it('redondea a 2 decimales', () => {
    expect(zoneKeyFor(25.6789, -100.3123)).toBe('25.68,-100.31')
  })

  it('misma zona y versión → misma semilla', () => {
    expect(seedForZone('25.68,-100.31', 1)).toBe(seedForZone('25.68,-100.31', 1))
    expect(seedForZone('25.68,-100.31', 1)).not.toBe(seedForZone('25.68,-100.31', 2))
  })

  it('hashString es estable', () => {
    expect(hashString('chispa')).toBe(hashString('chispa'))
    expect(hashString('chispa')).not.toBe(hashString('chisp'))
  })
})
