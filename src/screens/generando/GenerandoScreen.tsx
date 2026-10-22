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
import { compatibilityScore, type ScoringProfile } from '../../sim/scoring'
import { ageFromBirthdate } from '../registro/age'
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
        const specs = generateZoneDummies(
          {
            zoneKey,
            lat: location.lat,
            lng: location.lng,
            radiusKm: location.radiusKm,
          },
          videos.length,
        )
        await discoveryRepo.insertDummies(specs, videos)

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
          zoneKey,
          location.lat,
          location.lng,
        )
        const likerIds = rows
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
      }

      const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
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
