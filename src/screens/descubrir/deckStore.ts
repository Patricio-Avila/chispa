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
import { zoneKeyFor, seedForZone, hashString } from '../../sim/prng'
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

export type DeckCard = DeckRow & {
  age: number
  score: number
  likedYou: boolean
}

export type DiscoverFilters = {
  interests: string[]
}

type DeckStatus = 'idle' | 'loading' | 'unseeded' | 'ready' | 'empty'

type DeckState = {
  status: DeckStatus
  cards: DeckCard[]
  userId: string | null
  userInterests: string[]
  zoneLabel: string
  filters: DiscoverFilters
  load(): Promise<void>
  act(action: SwipeAction): Promise<'match' | null>
  likeMedia(mediaId: string | null): Promise<void>
  setFilters(filters: DiscoverFilters): Promise<void>
  widenDistance(): Promise<void>
}

export const useDeckStore = create<DeckState>((set, get) => ({
  status: 'idle',
  cards: [],
  userId: null,
  userInterests: [],
  zoneLabel: 'Tu zona',
  filters: { interests: [] },

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
      zoneLabel: location.label,
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
        await matchRepo.create(userId, card.id)
        result = 'match'
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
}))
