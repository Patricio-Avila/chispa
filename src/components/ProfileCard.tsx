import { useEffect, useState } from 'react'
import { SealCheck } from '@phosphor-icons/react'
import { mediaRepo } from '../data/repo'
import { loadMediaBlob } from '../services/media'
import { MediaCarousel, type CarouselItem } from './MediaCarousel'
import './ProfileCard.css'

export type ProfilePerson = {
  id: string
  name: string
  age: number
  avatarSeed: number
  distanceKm: number
  areaLabel: string
  interests: string[]
}

type ProfileCardProps = {
  person: ProfilePerson
  /** Intereses del usuario local, para resaltar los comunes. */
  commonWith: string[]
  onLikeMedia?: (mediaId: string | null) => void
  onInfoTap?: () => void
}

export function roundedDistance(km: number): string {
  return `${Math.max(1, Math.round(km))} km`
}

/** Carga los medios del perfil (ilustraciones estáticas, fotos y videos). */
function useCarouselItems(person: ProfilePerson): CarouselItem[] {
  const [items, setItems] = useState<CarouselItem[]>([])

  useEffect(() => {
    let cancelled = false
    const urls: string[] = []
    void (async () => {
      const rows = await mediaRepo.listByUser(person.id)
      const loaded: CarouselItem[] = []
      for (const row of rows) {
        if (row.kind === 'avatar') {
          if (row.storage === 'static') {
            const isLottie =
              row.path.endsWith('.json') || row.path.endsWith('.lottie')
            loaded.push({
              kind: isLottie ? 'lottie' : 'photo',
              url: import.meta.env.BASE_URL + row.path,
              mediaId: row.id,
            })
          } else {
            // Respaldo: avatares generados por piezas (SVG).
            loaded.push({ kind: 'avatar', seed: person.avatarSeed, mediaId: row.id })
          }
        } else if (row.storage === 'static') {
          const base = import.meta.env.BASE_URL
          loaded.push({
            kind: 'video',
            url: base + row.path,
            posterUrl: row.posterPath ? base + row.posterPath : null,
            durationS: row.durationS,
            mediaId: row.id,
          })
        } else {
          const blob = await loadMediaBlob({
            storage: row.storage as 'opfs' | 'idb',
            path: row.path,
          })
          if (!blob) continue
          const url = URL.createObjectURL(blob)
          urls.push(url)
          if (row.kind === 'video') {
            loaded.push({
              kind: 'video',
              url,
              posterUrl: null,
              durationS: row.durationS,
              mediaId: row.id,
            })
          } else {
            loaded.push({ kind: 'photo', url, mediaId: row.id })
          }
        }
      }
      if (!cancelled && loaded.length > 0) setItems(loaded)
    })()
    return () => {
      cancelled = true
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [person.id, person.avatarSeed])

  return items
}

export function ProfileCard({
  person,
  commonWith,
  onLikeMedia,
  onInfoTap,
}: ProfileCardProps) {
  const items = useCarouselItems(person)
  const common = new Set(commonWith)

  return (
    <article className="profile-card">
      <div className="profile-card__media">
        <MediaCarousel
          items={items}
          personName={person.name}
          onLike={onLikeMedia ? (item) => onLikeMedia(item.mediaId) : undefined}
        />
      </div>
      <div
        className="profile-card__info"
        onClick={onInfoTap}
        role={onInfoTap ? 'button' : undefined}
        tabIndex={onInfoTap ? 0 : undefined}
        onKeyDown={(e) => {
          if (onInfoTap && (e.key === 'Enter' || e.key === ' ')) onInfoTap()
        }}
      >
        <div className="profile-card__name-row">
          <span className="text-card-name">
            {person.name}, {person.age}
          </span>
          <SealCheck
            size={18}
            weight="regular"
            color="var(--color-primary)"
            aria-label="Perfil de demostración"
          />
        </div>
        <span className="profile-card__distance">
          {roundedDistance(person.distanceKm)} · {person.areaLabel}
        </span>
        <div className="profile-card__interests">
          {person.interests.slice(0, 4).map((interest) => (
            <span
              key={interest}
              className={`profile-card__interest${common.has(interest) ? ' profile-card__interest--common' : ''}`}
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
