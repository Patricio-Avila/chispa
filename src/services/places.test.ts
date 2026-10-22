import { describe, expect, it } from 'vitest'
import { extractAreaName, mapPhotonFeatures, type PhotonResponse } from './places'

const SAMPLE: PhotonResponse = {
  features: [
    {
      geometry: { coordinates: [-100.283, 25.679] },
      properties: {
        name: 'Cintermex',
        suburb: 'Obrera',
        city: 'Monterrey',
        state: 'Nuevo León',
      },
    },
    {
      geometry: { coordinates: [-100.3, 25.67] },
      properties: { name: 'Parque Fundidora', city: 'Monterrey', state: 'Nuevo León' },
    },
    { properties: { name: 'Sin coordenadas' } },
    { geometry: { coordinates: [-100.1, 25.6] }, properties: {} },
  ],
}

describe('mapPhotonFeatures', () => {
  it('mapea nombre, detalle y coordenadas (lat/lng en orden correcto)', () => {
    const results = mapPhotonFeatures(SAMPLE)
    expect(results[0]).toEqual({
      name: 'Cintermex',
      detail: 'Obrera, Monterrey, Nuevo León',
      lat: 25.679,
      lng: -100.283,
    })
  })

  it('descarta features sin nombre o sin coordenadas', () => {
    expect(mapPhotonFeatures(SAMPLE)).toHaveLength(2)
  })

  it('limita a 5 resultados', () => {
    const many: PhotonResponse = {
      features: Array.from({ length: 8 }, (_, i) => ({
        geometry: { coordinates: [-100, 25] as [number, number] },
        properties: { name: `Lugar ${i}` },
      })),
    }
    expect(mapPhotonFeatures(many)).toHaveLength(5)
  })
})

describe('extractAreaName', () => {
  it('prefiere distrito/colonia sobre ciudad', () => {
    expect(
      extractAreaName({
        features: [
          { properties: { district: 'Barrio Antiguo', city: 'Monterrey' } },
        ],
      }),
    ).toBe('Barrio Antiguo')
  })

  it('cae a ciudad y luego a null', () => {
    expect(extractAreaName({ features: [{ properties: { city: 'Monterrey' } }] })).toBe(
      'Monterrey',
    )
    expect(extractAreaName({ features: [] })).toBeNull()
  })
})
