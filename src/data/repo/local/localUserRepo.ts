import { getMeta, query, setMeta } from '../../db/db'
import type {
  AppUser,
  Gender,
  OnboardingStep,
  UserDraft,
  UserRepo,
} from '../types'

type UserRow = {
  id: string
  is_dummy: boolean
  name: string
  birthdate: string
  gender: Gender
  seeking: Gender[]
  age_min: number
  age_max: number
  max_distance_km: number
  bio: string | null
  interests: string[]
  lat: number | null
  lng: number | null
  area_label: string | null
}

function toUser(row: UserRow): AppUser {
  return {
    id: row.id,
    isDummy: row.is_dummy,
    name: row.name,
    birthdate: row.birthdate.slice(0, 10),
    gender: row.gender,
    seeking: row.seeking,
    ageMin: row.age_min,
    ageMax: row.age_max,
    maxDistanceKm: row.max_distance_km,
    bio: row.bio,
    interests: row.interests,
    lat: row.lat,
    lng: row.lng,
    areaLabel: row.area_label,
  }
}

const SELECT_USER = `select id, is_dummy, name, birthdate::text as birthdate, gender,
  seeking, age_min, age_max, max_distance_km, bio, interests, lat, lng, area_label
  from app_user`

export const localUserRepo: UserRepo = {
  async getLocalUser(): Promise<AppUser | null> {
    const id = await getMeta<string>('local_user_id')
    if (!id) return null
    const rows = await query<UserRow>(`${SELECT_USER} where id = $1`, [id])
    return rows[0] ? toUser(rows[0]) : null
  },

  async saveDraft(draft: UserDraft): Promise<string> {
    const existingId = await getMeta<string>('local_user_id')
    if (existingId) {
      await query(
        `update app_user set
           name = coalesce($2, name),
           birthdate = coalesce($3::date, birthdate),
           gender = coalesce($4, gender),
           seeking = coalesce($5::text[], seeking),
           age_min = coalesce($6, age_min),
           age_max = coalesce($7, age_max),
           max_distance_km = coalesce($8, max_distance_km)
         where id = $1`,
        [
          existingId,
          draft.name ?? null,
          draft.birthdate ?? null,
          draft.gender ?? null,
          draft.seeking ?? null,
          draft.ageMin ?? null,
          draft.ageMax ?? null,
          draft.maxDistanceKm ?? null,
        ],
      )
      return existingId
    }

    // El borrador inicial necesita valores en columnas not null:
    // se usan marcadores que la validación del registro obliga a completar.
    const rows = await query<{ id: string }>(
      `insert into app_user (is_dummy, name, birthdate, gender, seeking, age_min, age_max, max_distance_km)
       values (false, $1, $2::date, $3, $4::text[], $5, $6, $7)
       returning id`,
      [
        draft.name ?? '',
        draft.birthdate ?? '2000-01-01',
        draft.gender ?? 'mujer',
        draft.seeking ?? [],
        draft.ageMin ?? 18,
        draft.ageMax ?? 45,
        draft.maxDistanceKm ?? 25,
      ],
    )
    const id = rows[0]!.id
    await setMeta('local_user_id', id)
    return id
  },

  async getOnboardingStep(): Promise<OnboardingStep | null> {
    return getMeta<OnboardingStep>('onboarding_step')
  },

  async setOnboardingStep(step: OnboardingStep): Promise<void> {
    await setMeta('onboarding_step', step)
  },
}
