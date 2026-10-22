import { create } from 'zustand'
import {
  discoveryRepo,
  likeRepo,
  locationRepo,
  matchRepo,
  swipeRepo,
  userRepo,
  type DeckRow,
  type SwipeAction,
} from '../../data/repo'
import { getMeta, setMeta } from '../../data/db/db'
import { zoneKeyFor, seedForZone, hashString, mulberry32 } from '../../sim/prng'
import { SEED_VERSION } from '../../sim/seed'
import {
  compatibilityScore,
  orderDeck,
  pairSeed,
  passesHardFilters,
  type ScoringProfile,
} from '../../sim/scoring'
import { acceptsMatch } from '../../sim/dummyBehavior'
import { ageFromBirthdate } from '../registro/age'
import { formatZoneChip } from './zoneChip'
import { dummyOpens, personalityOf } from '../chat/chatFlow'
import { chatRepo, mediaRepo, notificationRepo } from '../../data/repo'
import { useUnreadStore } from '../../app/unreadStore'
import { notify } from '../../services/notifications'

export type DeckCard = DeckRow & {
  age: number
  score: number
  likedYou: boolean
}

export type DiscoverFilters = {
  interests: string[]
}

type DeckStatus = 'idle' | 'loading' | 'unseeded' | 'ready' | 'empty'

export type LastMatch = { matchId: string; card: DeckCard }

type DeckState = {
  status: DeckStatus
  cards: DeckCard[]
  userId: string | null
  userInterests: string[]
  zoneLabel: string
  filters: DiscoverFilters
  lastMatch: LastMatch | null
  load(): Promise<void>
  act(action: SwipeAction): Promise<'match' | null>
  likeMedia(mediaId: string | null): Promise<void>
  setFilters(filters: DiscoverFilters): Promise<void>
  widenDistance(): Promise<void>
  clearMatch(): void
  setLastMatch(match: LastMatch): void
  /** La zona cambió (Generando): fuerza recargar la baraja. */
  invalidate(): void
}

export const useDeckStore = create<DeckState>((set, get) => ({
  status: 'idle',
  cards: [],
  userId: null,
  userInterests: [],
  zoneLabel: 'Tu zona',
  filters: { interests: [] },
  lastMatch: null,

  async load() {
    set({ status: 'loading' })
    const user = await userRepo.getLocalUser()
    if (!user) {
      set({ status: 'idle' })
      return
    }
    const location = await locationRepo.get(user.id)
    if (!location) {
      set({ status: 'idle', userId: user.id })
      return
    }
    const zoneKey = zoneKeyFor(location.lat, location.lng)
    const seeded = await discoveryRepo.isZoneSeeded(zoneKey)
    if (!seeded) {
      set({ status: 'unseeded', userId: user.id, zoneLabel: location.label })
      return
    }

    const filters =
      (await getMeta<DiscoverFilters>('discover_filters')) ?? { interests: [] }

    const userProfile: ScoringProfile = {
      id: user.id,
      gender: user.gender,
      seeking: user.seeking,
      age: ageFromBirthdate(user.birthdate),
      ageMin: user.ageMin,
      ageMax: user.ageMax,
      interests: user.interests,
    }

    const rows = await discoveryRepo.getDeckRows(
      user.id,
      zoneKey,
      location.lat,
      location.lng,
    )
    const likers = new Set(await likeRepo.likersOf(user.id))

    const candidates: DeckCard[] = []
    for (const row of rows) {
      const age = ageFromBirthdate(row.birthdate)
      const profile: ScoringProfile = {
        id: row.id,
        gender: row.gender,
        seeking: row.seeking,
        age,
        ageMin: row.ageMin,
        ageMax: row.ageMax,
        interests: row.interests,
      }
      if (!passesHardFilters(userProfile, profile, row.distanceKm, user.maxDistanceKm)) {
        continue
      }
      if (
        filters.interests.length > 0 &&
        !row.interests.some((i) => filters.interests.includes(i))
      ) {
        continue
      }
      candidates.push({
        ...row,
        age,
        score: compatibilityScore(
          userProfile,
          profile,
          row.distanceKm,
          location.radiusKm,
        ),
        likedYou: likers.has(row.id),
      })
    }

    // Lo nunca visto primero (por puntaje, mezclado en bloques de 5);
    // lo pasado al final, por fecha del último "pasar".
    const fresh = candidates.filter((c) => c.lastPasar === null)
    const pasados = candidates
      .filter((c) => c.lastPasar !== null)
      .sort((a, b) => a.lastPasar!.localeCompare(b.lastPasar!))
    const shuffleSeed =
      seedForZone(zoneKey, SEED_VERSION) ^ hashString(user.id)
    const deck = [...orderDeck(fresh, shuffleSeed), ...pasados]

    set({
      status: deck.length > 0 ? 'ready' : 'empty',
      cards: deck,
      userId: user.id,
      userInterests: user.interests,
      zoneLabel: formatZoneChip(location),
      filters,
    })
  },

  async act(action) {
    const { cards, userId } = get()
    const card = cards[0]
    if (!card || !userId) return null
    await swipeRepo.record(userId, card.id, action)

    let result: 'match' | null = null
    if (action === 'match') {
      const accepted =
        card.likedYou ||
        acceptsMatch(card.score, card.pickiness, pairSeed(userId, card.id))
      if (accepted) {
        const matchId = await matchRepo.create(userId, card.id)
        result = 'match'
        set({ lastMatch: { matchId, card } })
        scheduleFirstDummyMessage(matchId, card, userId)
      }
    }

    const rest = cards.slice(1)
    const next =
      action === 'pasar'
        ? [...rest, { ...card, lastPasar: new Date().toISOString() }]
        : rest
    set({ cards: next, status: next.length > 0 ? 'ready' : 'empty' })
    return result
  },

  async likeMedia(mediaId) {
    const { cards, userId } = get()
    const card = cards[0]
    if (!card || !userId) return
    await likeRepo.addMediaLike(userId, card.id, mediaId)
  },

  async setFilters(filters) {
    await setMeta('discover_filters', filters)
    set({ filters })
    await get().load()
  },

  async widenDistance() {
    const user = await userRepo.getLocalUser()
    if (!user) return
    await userRepo.saveDraft({
      maxDistanceKm: Math.min(100, user.maxDistanceKm + 25),
    })
    await get().load()
  },

  clearMatch() {
    set({ lastMatch: null })
  },

  invalidate() {
    set({ status: 'idle', cards: [] })
  },

  setLastMatch(match: LastMatch) {
    set({ lastMatch: match })
  },
}))

/** Tras un match, 30% de probabilidad (determinista por pareja) de que el
 *  dummy escriba primero, entre 20 y 90 s después (CLAUDE.md §10.3).
 *  Solo mientras la app siga abierta. */
function scheduleFirstDummyMessage(
  matchId: string,
  card: DeckCard,
  userId: string,
): void {
  const rng = mulberry32(pairSeed(userId, card.id) ^ 0xf00d)
  if (rng() >= 0.3) return
  const delayMs = (20 + rng() * 70) * 1000
  window.setTimeout(() => {
    void (async () => {
      const existing = await chatRepo.messages(matchId)
      if (existing.length > 0) return // el usuario ya abrió la conversación
      const user = await userRepo.getLocalUser()
      if (!user) return
      await dummyOpens({
        matchId,
        user: { id: user.id, name: user.name, interests: user.interests },
        partner: {
          id: card.id,
          name: card.name,
          personality: personalityOf(card),
          interests: card.interests,
          areaLabel: card.areaLabel,
        },
      })
      await notificationRepo.add(user.id, 'mensaje', { matchId, from: card.id })
      const partnerMedia = await mediaRepo.listByUser(card.id)
      const avatarPath = partnerMedia.find((m) => m.kind === 'avatar')?.path ?? null
      await notify({
        title: card.name,
        body: `${card.name} te envió un mensaje`,
        avatarPath,
        route: `/chat/${matchId}`,
      })
      void useUnreadStore.getState().refresh()
    })()
  }, delayMs)
}
