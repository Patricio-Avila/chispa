import { query } from '../../db/db'
import type { LocationContext, LocationRepo } from '../types'

type LocationRow = {
  mode: LocationContext['mode']
  lat: number
  lng: number
  label: string
  radius_km: number
  date_from: string | null
  date_to: string | null
}

export const localLocationRepo: LocationRepo = {
  async get(userId: string): Promise<LocationContext | null> {
    const rows = await query<LocationRow>(
      `select mode, lat, lng, label, radius_km,
              date_from::text as date_from, date_to::text as date_to
       from location_context where user_id = $1`,
      [userId],
    )
    const row = rows[0]
    if (!row) return null
    return {
      mode: row.mode,
      lat: row.lat,
      lng: row.lng,
      label: row.label,
      radiusKm: row.radius_km,
      dateFrom: row.date_from,
      dateTo: row.date_to,
    }
  },

  async set(userId: string, context: LocationContext): Promise<void> {
    await query(
      `insert into location_context (user_id, mode, lat, lng, label, radius_km, date_from, date_to, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7::date, $8::date, now())
       on conflict (user_id) do update set
         mode = excluded.mode, lat = excluded.lat, lng = excluded.lng,
         label = excluded.label, radius_km = excluded.radius_km,
         date_from = excluded.date_from, date_to = excluded.date_to,
         updated_at = now()`,
      [
        userId,
        context.mode,
        context.lat,
        context.lng,
        context.label,
        context.radiusKm,
        context.dateFrom,
        context.dateTo,
      ],
    )
  },
}
