/** Motor de likes entrantes (CLAUDE.md §10.3): solo con la app abierta.
 *  Cada 45–120 s un dummy compatible que aún no te haya dado like te da
 *  like (60% al perfil, 40% a una foto o video). Máximo 10 por sesión. */

import {
  discoveryRepo,
  likeRepo,
  locationRepo,
  mediaRepo,
  notificationRepo,
  userRepo,
  type DeckRow,
} from '../data/repo'
import { zoneKeyFor } from './prng'
import { passesHardFilters, type ScoringProfile } from './scoring'
import { ageFromBirthdate } from '../screens/registro/age'
import { notify } from '../services/notifications'
import { useUnreadStore } from '../app/unreadStore'
import { useNotifPromptStore } from '../app/notifPromptStore'

export const MIN_DELAY_S = 45
export const MAX_DELAY_S = 120
export const MAX_PER_SESSION = 10
const PROFILE_LIKE_RATIO = 0.6

/* ---------- Partes puras (probadas en Vitest) ---------- */

export function pickDelayMs(random: number): number {
  return Math.round((MIN_DELAY_S + random * (MAX_DELAY_S - MIN_DELAY_S)) * 1000)
}

export function pickTargetKind(random: number): 'perfil' | 'media' {
  return random < PROFILE_LIKE_RATIO ? 'perfil' : 'media'
}

export function pickCandidate(
  rows: DeckRow[],
  userProfile: ScoringProfile,
  maxDistanceKm: number,
  alreadyLikers: Set<string>,
  random: number,
): DeckRow | null {
  const eligible = rows.filter(
    (row) =>
      !alreadyLikers.has(row.id) &&
      passesHardFilters(
        userProfile,
        {
          id: row.id,
          gender: row.gender,
          seeking: row.seeking,
          age: ageFromBirthdate(row.birthdate),
          ageMin: row.ageMin,
          ageMax: row.ageMax,
          interests: row.interests,
        },
        row.distanceKm,
        maxDistanceKm,
      ),
  )
  if (eligible.length === 0) return null
  return eligible[Math.floor(random * eligible.length)]!
}

/* ---------- Motor ---------- */

let running = false
let sessionCount = 0
let firstLikeNotified = false

export function startIncomingLikes(): void {
  if (running) return
  running = true
  scheduleNext()
}

function scheduleNext(): void {
  if (sessionCount >= MAX_PER_SESSION) return
  window.setTimeout(() => {
    void emitLike().finally(() => {
      sessionCount += 1
      scheduleNext()
    })
  }, pickDelayMs(Math.random()))
}

async function emitLike(): Promise<void> {
  const user = await userRepo.getLocalUser()
  if (!user) return
  const location = await locationRepo.get(user.id)
  if (!location) return

  const rows = await discoveryRepo.getDeckRows(
    user.id,
    zoneKeyFor(location.lat, location.lng),
    location.lat,
    location.lng,
  )
  const likers = new Set(await likeRepo.likersOf(user.id))
  const userProfile: ScoringProfile = {
    id: user.id,
    gender: user.gender,
    seeking: user.seeking,
    age: ageFromBirthdate(user.birthdate),
    ageMin: user.ageMin,
    ageMax: user.ageMax,
    interests: user.interests,
  }
  const candidate = pickCandidate(
    rows,
    userProfile,
    user.maxDistanceKm,
    likers,
    Math.random(),
  )
  if (!candidate) return

  // 60% like al perfil; 40% a una foto o video del usuario.
  let mediaId: string | null = null
  let targetLabel: 'perfil' | 'foto' | 'video' = 'perfil'
  if (pickTargetKind(Math.random()) === 'media') {
    const media = (await mediaRepo.listByUser(user.id)).filter(
      (m) => m.kind !== 'avatar',
    )
    if (media.length > 0) {
      const chosen = media[Math.floor(Math.random() * media.length)]!
      mediaId = chosen.id
      targetLabel = chosen.kind === 'video' ? 'video' : 'foto'
    }
  }

  await likeRepo.addMediaLike(candidate.id, user.id, mediaId)
  await notificationRepo.add(
    user.id,
    mediaId ? 'like_media' : 'like_perfil',
    { from: candidate.id, mediaId },
  )

  const partnerMedia = await mediaRepo.listByUser(candidate.id)
  const avatarPath = partnerMedia.find((m) => m.kind === 'avatar')?.path ?? null

  await notify({
    title: candidate.name,
    body: `A ${candidate.name} le gustó tu ${targetLabel}`,
    avatarPath,
    route: '/likes',
  })
  void useUnreadStore.getState().refresh()

  // Pre-permiso tras el PRIMER like recibido (§8.2-17).
  if (!firstLikeNotified) {
    firstLikeNotified = true
    void useNotifPromptStore.getState().maybeOpen()
  }
}
