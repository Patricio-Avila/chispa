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

const SEARCH_TIMEOUT_MS = 7000
const RETRY_DELAY_MS = 400

/** Señal combinada: la del caller (cancelación) + un timeout propio. */
function withTimeout(signal: AbortSignal | undefined): AbortSignal {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
  controller.signal.addEventListener('abort', () => clearTimeout(timer))
  signal?.addEventListener('abort', () => controller.abort())
  return controller.signal
}

async function fetchPhoton(
  params: URLSearchParams,
  signal: AbortSignal | undefined,
): Promise<PlaceResult[]> {
  const response = await fetch(`${API_BASE}/api/?${params.toString()}`, {
    signal: withTimeout(signal),
  })
  if (!response.ok) {
    throw new PlacesError('La búsqueda no está disponible ahora.')
  }
  const data = (await response.json()) as PhotonResponse
  return mapPhotonFeatures(data)
}

export async function searchPlaces(
  query: string,
  bias?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const key = `${query.toLowerCase().trim()}|${bias ? `${bias.lat.toFixed(1)},${bias.lng.toFixed(1)}` : ''}`
  const cached = searchCache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({ q: query, limit: '5' })
  if (bias) {
    // zoom + location_bias_scale: prioriza resultados cercanos sin
    // excluir los lejanos (documentado por Photon).
    params.set('lat', String(bias.lat))
    params.set('lon', String(bias.lng))
    params.set('zoom', '12')
    params.set('location_bias_scale', '0.4')
  }

  let results: PlaceResult[]
  try {
    results = await fetchPhoton(params, signal)
  } catch (error) {
    if (signal?.aborted) throw error
    // Un reintento breve: la instancia pública de Photon a veces falla
    // o tarda; el segundo intento suele responder.
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    if (signal?.aborted) throw error
    try {
      results = await fetchPhoton(params, signal)
    } catch {
      if (signal?.aborted) throw error
      throw new PlacesError('No se pudo buscar. Revisa tu conexión.')
    }
  }

  // Sin resultados cerca: reintenta sin sesgo (búsqueda global).
  if (results.length === 0 && bias && !signal?.aborted) {
    const globalParams = new URLSearchParams({ q: query, limit: '5' })
    try {
      results = await fetchPhoton(globalParams, signal)
    } catch {
      // El resultado vacío original sigue siendo válido.
    }
  }

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
