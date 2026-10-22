/** Búsqueda de lugares con Photon (CLAUDE.md §3 y §8.2-6).
 *  Sin parámetro de idioma (nombres locales); Nominatim queda prohibido
 *  para autocompletar. */

const API_BASE = 'https://photon.komoot.io'

export type PlaceResult = {
  name: string
  detail: string
  lat: number
  lng: number
}

export class PlacesError extends Error {}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    street?: string
    district?: string
    suburb?: string
    neighbourhood?: string
    locality?: string
    city?: string
    state?: string
    country?: string
  }
}

export type PhotonResponse = { features?: PhotonFeature[] }

/** Mapper puro de la respuesta GeoJSON de Photon (probado en Vitest). */
export function mapPhotonFeatures(response: PhotonResponse): PlaceResult[] {
  const features = response.features ?? []
  const results: PlaceResult[] = []
  for (const feature of features) {
    const props = feature.properties ?? {}
    const coords = feature.geometry?.coordinates
    const name = props.name ?? props.street
    if (!name || !coords) continue
    const detail = [props.district ?? props.suburb, props.city, props.state]
      .filter((part): part is string => Boolean(part) && part !== name)
      .join(', ')
    results.push({ name, detail, lat: coords[1], lng: coords[0] })
    if (results.length >= 5) break
  }
  return results
}

/** Nombre de la colonia/zona para un punto (reverse geocoding). */
export function extractAreaName(response: PhotonResponse): string | null {
  const props = response.features?.[0]?.properties ?? {}
  return (
    props.district ??
    props.suburb ??
    props.neighbourhood ??
    props.locality ??
    props.name ??
    props.city ??
    null
  )
}

const searchCache = new Map<string, PlaceResult[]>()

export async function searchPlaces(
  query: string,
  bias?: { lat: number; lng: number },
): Promise<PlaceResult[]> {
  const key = `${query.toLowerCase().trim()}|${bias ? `${bias.lat.toFixed(1)},${bias.lng.toFixed(1)}` : ''}`
  const cached = searchCache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({ q: query, limit: '5' })
  if (bias) {
    params.set('lat', String(bias.lat))
    params.set('lon', String(bias.lng))
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/?${params.toString()}`)
  } catch {
    throw new PlacesError('No se pudo buscar. Revisa tu conexión.')
  }
  if (!response.ok) {
    throw new PlacesError('La búsqueda no está disponible ahora.')
  }
  const data = (await response.json()) as PhotonResponse
  const results = mapPhotonFeatures(data)
  searchCache.set(key, results)
  return results
}

export async function reverseArea(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng) })
    const response = await fetch(`${API_BASE}/reverse?${params.toString()}`)
    if (!response.ok) return null
    const data = (await response.json()) as PhotonResponse
    return extractAreaName(data)
  } catch {
    return null
  }
}
