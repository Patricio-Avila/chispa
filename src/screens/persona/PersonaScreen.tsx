import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import { useDeckStore } from '../descubrir/deckStore'
import {
  discoveryRepo,
  likeRepo,
  locationRepo,
  matchRepo,
  swipeRepo,
  userRepo,
  type DeckRow,
} from '../../data/repo'
import { compatibilityScore, pairSeed, type ScoringProfile } from '../../sim/scoring'
import { acceptsMatch } from '../../sim/dummyBehavior'
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
  const setLastMatch = useDeckStore((s) => s.setLastMatch)
  const [fallback, setFallback] = useState<(DeckRow & { age: number }) | null>(null)
  const [likedMe, setLikedMe] = useState(false)

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
      const liked = user ? await likeRepo.hasLikedMe(row.id, user.id) : false
      if (cancelled) return
      setFallback({ ...row, age: ageFromBirthdate(row.birthdate) })
      setLikedMe(liked)
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

  /** Acciones sobre un perfil que no es la tarjeta actual (p. ej. desde
   *  Likes). Con like previo, Match crea el match al instante (§8.2-9). */
  async function directAct(action: 'skip' | 'pasar' | 'match') {
    const target = person
    const user = await userRepo.getLocalUser()
    if (!target || !user) return
    const liked = likedMe || (await likeRepo.hasLikedMe(target.id, user.id))
    await swipeRepo.record(user.id, target.id, action)
    if (action === 'match') {
      const userProfile: ScoringProfile = {
        id: user.id,
        gender: user.gender,
        seeking: user.seeking,
        age: ageFromBirthdate(user.birthdate),
        ageMin: user.ageMin,
        ageMax: user.ageMax,
        interests: user.interests,
      }
      const location = await locationRepo.get(user.id)
      const score = compatibilityScore(
        userProfile,
        {
          id: target.id,
          gender: target.gender,
          seeking: target.seeking,
          age: target.age,
          ageMin: target.ageMin,
          ageMax: target.ageMax,
          interests: target.interests,
        },
        target.distanceKm,
        location?.radiusKm ?? 10,
      )
      const accepted =
        liked || acceptsMatch(score, target.pickiness, pairSeed(user.id, target.id))
      if (accepted) {
        const matchId = await matchRepo.create(user.id, target.id)
        setLastMatch({
          matchId,
          card: { ...target, lastPasar: null, score, likedYou: liked },
        })
      }
    }
    await load()
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

      {isCurrent ? (
        <ActionBar
          onSkip={() => void actAndReturn('skip')}
          onPasar={() => void actAndReturn('pasar')}
          onMatch={() => void actAndReturn('match')}
        />
      ) : (
        <ActionBar
          onSkip={() => void directAct('skip')}
          onPasar={() => void directAct('pasar')}
          onMatch={() => void directAct('match')}
        />
      )}
    </div>
  )
}
