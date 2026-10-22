/** Geolocalización del navegador (CLAUDE.md §3): timeout 10 s,
 *  sin alta precisión. Si falla, la UI manda a Elegir zona. */

export type GeoResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'denegado' | 'no_disponible' | 'timeout' }

const TIMEOUT_MS = 10_000

export function getCurrentPosition(): Promise<GeoResult> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve({ ok: false, reason: 'no_disponible' })
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) =>
        resolve({
          ok: false,
          reason:
            error.code === error.PERMISSION_DENIED
              ? 'denegado'
              : error.code === error.TIMEOUT
                ? 'timeout'
                : 'no_disponible',
        }),
      { enableHighAccuracy: false, timeout: TIMEOUT_MS, maximumAge: 60_000 },
    )
  })
}
