import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import { useDeckStore } from '../descubrir/deckStore'
import { discoveryRepo, locationRepo, userRepo, type DeckRow } from '../../data/repo'
import { ageFromBirthdate } from '../registro/age'
import { ProfileCard, roundedDistance } from '../../components/ProfileCard'
import { ActionBar } from '../../components/ActionBar'
import './PersonaScreen.css'

export function PersonaScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { status, cards, userInterests } = useDeckStore()
  const load = useDeckStore((s) => s.load)
  const act = useDeckStore((s) => s.act)
  const likeMedia = useDeckStore((s) => s.likeMedia)
  const [fallback, setFallback] = useState<(DeckRow & { age: number }) | null>(null)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  const deckPerson = cards.find((card) => card.id === id)
  const isCurrent = cards[0]?.id === id
  const common = new Set(userInterests)

  // Fuera de la baraja (p. ej. "Ver perfil" desde un chat): carga directa.
  useEffect(() => {
    if (deckPerson || !id || (status !== 'ready' && status !== 'empty')) return
    let cancelled = false
    void (async () => {
      const user = await userRepo.getLocalUser()
      const location = user ? await locationRepo.get(user.id) : null
      const row = await discoveryRepo.getPersonById(
        id,
        location?.lat ?? 0,
        location?.lng ?? 0,
      )
      if (cancelled) return
      if (!row) {
        navigate('/descubrir', { replace: true })
        return
      }
      setFallback({ ...row, age: ageFromBirthdate(row.birthdate) })
    })()
    return () => {
      cancelled = true
    }
  }, [deckPerson, id, status, navigate])

  const person = deckPerson ?? fallback
  if (!person) return null

  async function actAndReturn(action: 'skip' | 'pasar' | 'match') {
    await act(action)
    navigate('/descubrir')
  }

  return (
    <div className="persona">
      <button
        type="button"
        className="persona__back"
        aria-label="Volver"
        onClick={() => navigate(-1)}
      >
        <CaretLeft size={20} weight="bold" aria-hidden="true" />
      </button>

      <div className="persona__card">
        <ProfileCard
          person={{
            id: person.id,
            name: person.name,
            age: person.age,
            avatarSeed: person.avatarSeed,
            distanceKm: person.distanceKm,
            areaLabel: person.areaLabel,
            interests: person.interests,
          }}
          commonWith={userInterests}
          onLikeMedia={isCurrent ? (mediaId) => void likeMedia(mediaId) : undefined}
        />
      </div>

      <div className="persona__details">
        {person.bio && <p className="text-body">{person.bio}</p>}
        <div className="persona__interests">
          {person.interests.map((interest) => (
            <span
              key={interest}
              className={`persona__interest${common.has(interest) ? ' persona__interest--common' : ''}`}
            >
              {interest}
            </span>
          ))}
        </div>
        <span className="persona__zone text-label">
          {roundedDistance(person.distanceKm)} · {person.areaLabel}
        </span>
      </div>

      {isCurrent && (
        <ActionBar
          onSkip={() => void actAndReturn('skip')}
          onPasar={() => void actAndReturn('pasar')}
          onMatch={() => void actAndReturn('match')}
        />
      )}
    </div>
  )
}
