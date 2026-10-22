import { query, withTransaction } from '../../db/db'
import type { DummySpec } from '../../../sim/seed'
import type { DeckRow, DiscoveryRepo } from '../types'

export const localDiscoveryRepo: DiscoveryRepo = {
  async isZoneSeeded(zoneKey: string): Promise<boolean> {
    const rows = await query<{ count: number }>(
      'select count(*)::int as count from app_user where is_dummy and zone_key = $1',
      [zoneKey],
    )
    return (rows[0]?.count ?? 0) > 0
  },

  async insertDummies(
    specs: DummySpec[],
    videos: { path: string; poster: string; durationS: number }[],
  ): Promise<string[]> {
    return withTransaction(async (txQuery) => {
    const ids: string[] = []
    for (const spec of specs) {
      const rows = await txQuery<{ id: string }>(
        `insert into app_user
           (is_dummy, name, birthdate, gender, seeking, age_min, age_max,
            max_distance_km, bio, interests, lat, lng, area_label,
            personality, pickiness, avatar_seed, zone_key)
         values (true, $1, $2::date, $3, $4::text[], $5, $6, 50, $7, $8::text[],
                 $9, $10, $11, $12, $13, $14, $15)
         returning id`,
        [
          spec.name,
          spec.birthdate,
          spec.gender,
          spec.seeking,
          spec.ageMin,
          spec.ageMax,
          spec.bio,
          spec.interests,
          spec.lat,
          spec.lng,
          spec.areaLabel,
          spec.personality,
          spec.pickiness,
          spec.avatarSeed,
          spec.zoneKey,
        ],
      )
      const id = rows[0]!.id
      ids.push(id)
      await txQuery(
        `insert into media (user_id, kind, position, storage, path)
         values ($1, 'avatar', 0, 'static', $2)`,
        [id, spec.avatarPath],
      )
      if (spec.videoIndex !== null && videos[spec.videoIndex]) {
        const video = videos[spec.videoIndex]!
        await txQuery(
          `insert into media (user_id, kind, position, storage, path, poster_path, duration_s)
           values ($1, 'video', 0, 'static', $2, $3, $4)`,
          [id, video.path, video.poster, video.durationS],
        )
      }
    }
    return ids
    })
  },

  async getPersonById(
    id: string,
    centerLat: number,
    centerLng: number,
  ): Promise<DeckRow | null> {
    const rows = await query<{
      id: string
      name: string
      birthdate: string
      gender: DeckRow['gender']
      seeking: DeckRow['gender'][]
      age_min: number
      age_max: number
      bio: string | null
      interests: string[]
      area_label: string | null
      personality: string | null
      pickiness: number | null
      avatar_seed: number | null
      distance_km: number
    }>(
      `select id, name, birthdate::text as birthdate, gender, seeking,
              age_min, age_max, bio, interests, area_label, personality,
              pickiness, avatar_seed,
              haversine_km($2, $3, lat, lng) as distance_km
       from app_user where id = $1`,
      [id, centerLat, centerLng],
    )
    const row = rows[0]
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      birthdate: row.birthdate.slice(0, 10),
      gender: row.gender,
      seeking: row.seeking,
      ageMin: row.age_min,
      ageMax: row.age_max,
      bio: row.bio,
      interests: row.interests,
      areaLabel: row.area_label ?? 'Cerca de ti',
      personality: row.personality,
      pickiness: row.pickiness ?? 0.5,
      avatarSeed: row.avatar_seed ?? 0,
      distanceKm: row.distance_km,
      lastPasar: null,
    }
  },

  async getDeckRows(
    userId: string,
    zoneKey: string,
    centerLat: number,
    centerLng: number,
  ): Promise<DeckRow[]> {
    const rows = await query<{
      id: string
      name: string
      birthdate: string
      gender: DeckRow['gender']
      seeking: DeckRow['gender'][]
      age_min: number
      age_max: number
      bio: string | null
      interests: string[]
      area_label: string | null
      personality: string | null
      pickiness: number | null
      avatar_seed: number | null
      distance_km: number
      last_pasar: string | null
    }>(
      `select d.id, d.name, d.birthdate::text as birthdate, d.gender, d.seeking,
              d.age_min, d.age_max, d.bio, d.interests, d.area_label,
              d.personality, d.pickiness, d.avatar_seed,
              haversine_km($2, $3, d.lat, d.lng) as distance_km,
              p.last_pasar::text as last_pasar
       from app_user d
       left join (
         select to_user, max(created_at) as last_pasar
         from swipe
         where from_user = $1 and action = 'pasar'
         group by to_user
       ) p on p.to_user = d.id
       where d.is_dummy
         and d.zone_key = $4
         and not exists (
           select 1 from swipe s
           where s.from_user = $1 and s.to_user = d.id
             and s.action in ('skip', 'match')
         )`,
      [userId, centerLat, centerLng, zoneKey],
    )
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      birthdate: row.birthdate.slice(0, 10),
      gender: row.gender,
      seeking: row.seeking,
      ageMin: row.age_min,
      ageMax: row.age_max,
      bio: row.bio,
      interests: row.interests,
      areaLabel: row.area_label ?? 'Cerca de ti',
      personality: row.personality,
      pickiness: row.pickiness ?? 0.5,
      avatarSeed: row.avatar_seed ?? 0,
      distanceKm: row.distance_km,
      lastPasar: row.last_pasar,
    }))
  },
}
