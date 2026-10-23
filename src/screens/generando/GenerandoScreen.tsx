import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  discoveryRepo,
  likeRepo,
  locationRepo,
  userRepo,
} from '../../data/repo'
import { zoneKeyFor } from '../../sim/prng'
import { generateZoneDummies, likesYouOnSeed } from '../../sim/seed'
import { seedConversationsIfNeeded } from '../../sim/seedConversations'
import { startIncomingLikes } from '../../sim/incomingLikes'
import { reverseArea } from '../../services/places'
import { compatibilityScore, type ScoringProfile } from '../../sim/scoring'
import { ageFromBirthdate } from '../registro/age'
import { useDeckStore } from '../descubrir/deckStore'
import { CardsLoader } from './CardsLoader'
import './GenerandoScreen.css'

const MIN_VISIBLE_MS = 600

type VideoManifestEntry = { path: string; poster: string; durationS: number }

async function loadVideoManifest(): Promise<VideoManifestEntry[]> {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}dummies/videos/videos.json`,
    )
    if (!response.ok) return []
    const data: unknown = await response.json()
    return Array.isArray(data) ? (data as VideoManifestEntry[]) : []
  } catch {
    return []
  }
}

export function GenerandoScreen() {
  const navigate = useNavigate()
  const [label, setLabel] = useState('tu zona')

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    void (async () => {
      const user = await userRepo.getLocalUser()
      if (!user) {
        navigate('/registro', { replace: true })
        return
      }
      const location = await locationRepo.get(user.id)
      if (!location) {
        navigate('/ubicacion', { replace: true })
        return
      }
      if (!cancelled) setLabel(location.label)

      const zoneKey = zoneKeyFor(location.lat, location.lng)
      const seeded = await discoveryRepo.isZoneSeeded(zoneKey)
      if (!seeded) {
        const videos = await loadVideoManifest()
        // area_label real: colonia más cercana según Photon (§10.1).
        const areaName = await reverseArea(location.lat, location.lng)
        if (areaName && location.label === 'Tu zona') {
          await locationRepo.set(user.id, { ...location, label: areaName })
          if (!cancelled) setLabel(areaName)
        }
        const specs = generateZoneDummies(
          {
            zoneKey,
            lat: location.lat,
            lng: location.lng,
            radiusKm: location.radiusKm,
          },
          videos.length,
          areaName ?? 'Cerca de ti',
        )
        const newIds = new Set(await discoveryRepo.insertDummies(specs, videos))

        // Likes previos: ~15% de los dummies con puntaje > 0.5 (§10.3).
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
          location.lat,
          location.lng,
        )
        // Likes sembrados solo entre los dummies recién creados, para no
        // duplicar likes de zonas ya exploradas.
        const likerIds = rows
          .filter((row) => newIds.has(row.id))
          .filter((row) =>
            likesYouOnSeed(
              row.avatarSeed,
              compatibilityScore(
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
                location.radiusKm,
              ),
            ),
          )
          .map((row) => row.id)
        await likeRepo.addProfileLikes(likerIds, user.id)

        // Primer arranque: 2-3 conversaciones ya empezadas (§8.2-12).
        await seedConversationsIfNeeded(user, userProfile, rows)
      }

      // El onboarding acaba de completarse: arranca el motor de likes.
      startIncomingLikes()

      const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
      // La zona (o sus fechas) cambió: la baraja debe recargarse.
      useDeckStore.getState().invalidate()
      if (!cancelled) navigate('/descubrir', { replace: true })
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="generando">
      <CardsLoader />
      <p className="text-body generando__text">
        Buscando gente cerca de {label}…
      </p>
    </div>
  )
}
