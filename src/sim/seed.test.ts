import { describe, expect, it } from 'vitest'
import { DUMMIES_PER_ZONE, generateZoneDummies } from './seed'

const ZONE = { zoneKey: '25.68,-100.31', lat: 25.68, lng: -100.31, radiusKm: 10 }

describe('generateZoneDummies', () => {
  it('genera 40 dummies por zona', () => {
    expect(generateZoneDummies(ZONE, 0)).toHaveLength(DUMMIES_PER_ZONE)
  })

  it('la misma zona genera exactamente los mismos dummies', () => {
    const a = generateZoneDummies(ZONE, 0)
    const b = generateZoneDummies(ZONE, 0)
    expect(a).toEqual(b)
  })

  it('zonas distintas generan dummies distintos', () => {
    const a = generateZoneDummies(ZONE, 0)
    const b = generateZoneDummies(
      { ...ZONE, zoneKey: '19.43,-99.13', lat: 19.43, lng: -99.13 },
      0,
    )
    expect(a.map((d) => d.name)).not.toEqual(b.map((d) => d.name))
  })

  it('respeta los rangos de atributos', () => {
    for (const dummy of generateZoneDummies(ZONE, 0)) {
      expect(dummy.age).toBeGreaterThanOrEqual(18)
      expect(dummy.age).toBeLessThanOrEqual(45)
      expect(dummy.interests.length).toBeGreaterThanOrEqual(3)
      expect(dummy.interests.length).toBeLessThanOrEqual(6)
      expect(dummy.pickiness).toBeGreaterThanOrEqual(0.2)
      expect(dummy.pickiness).toBeLessThanOrEqual(0.8)
      expect(dummy.seeking.length).toBeGreaterThanOrEqual(1)
      expect(dummy.bio).not.toContain('{interes')
    }
  })

  it('los dummies quedan dentro del radio de la zona (aprox)', () => {
    for (const dummy of generateZoneDummies(ZONE, 0)) {
      const dLatKm = Math.abs(dummy.lat - ZONE.lat) * 111.32
      expect(dLatKm).toBeLessThanOrEqual(ZONE.radiusKm + 0.5)
    }
  })

  it('sin manifiesto de videos, nadie lleva video', () => {
    for (const dummy of generateZoneDummies(ZONE, 0)) {
      expect(dummy.videoIndex).toBeNull()
    }
  })
})
