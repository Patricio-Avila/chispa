import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CaretDown, Faders } from '@phosphor-icons/react'
import { useDeckStore } from './deckStore'
import { SwipeableCard, type SwipeDirection } from './SwipeableCard'
import { ProfileCard } from '../../components/ProfileCard'
import { ActionBar } from '../../components/ActionBar'
import { Button } from '../../components/Button'
import { FiltersSheet } from './FiltersSheet'
import './DescubrirScreen.css'

export function DescubrirScreen() {
  const navigate = useNavigate()
  const { status, cards, userInterests, zoneLabel } = useDeckStore()
  const load = useDeckStore((s) => s.load)
  const act = useDeckStore((s) => s.act)
  const likeMedia = useDeckStore((s) => s.likeMedia)
  const widenDistance = useDeckStore((s) => s.widenDistance)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [flyOut, setFlyOut] = useState<SwipeDirection | null>(null)

  useEffect(() => {
    if (status === 'idle') void load()
    if (status === 'unseeded') navigate('/generando', { replace: true })
  }, [status, load, navigate])

  const current = cards[0]
  const next = cards[1]

  async function handleSwipe(direction: SwipeDirection) {
    setFlyOut(null)
    await act(direction)
  }

  return (
    <div className="descubrir">
      <header className="descubrir__topbar">
        <button
          type="button"
          className="descubrir__location"
          onClick={() => navigate('/mapa')}
        >
          <MapPin size={16} color="var(--color-primary)" aria-hidden="true" />
          <span className="descubrir__location-label">{zoneLabel}</span>
          <CaretDown size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="descubrir__filters"
          aria-label="Filtros"
          onClick={() => setFiltersOpen(true)}
        >
          <Faders size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="descubrir__stage">
        {status === 'loading' && (
          <p className="descubrir__hint text-body">Preparando la baraja…</p>
        )}

        {status === 'empty' && (
          <div className="descubrir__empty">
            <h2 className="text-title">Ya viste a todos por aquí</h2>
            <p className="text-body descubrir__hint">
              Amplía tu búsqueda o cambia de zona para ver más gente.
            </p>
            <div className="descubrir__empty-actions">
              <Button onClick={() => void widenDistance()}>Ampliar distancia</Button>
              <Button variant="secondary" onClick={() => navigate('/mapa')}>
                Cambiar zona
              </Button>
              <Button variant="secondary" onClick={() => void load()}>
                Ver los que pasaste
              </Button>
            </div>
          </div>
        )}

        {status === 'ready' && current && (
          <>
            {next && (
              <div className="descubrir__next-card" aria-hidden="true">
                <ProfileCard
                  person={{
                    id: next.id,
                    name: next.name,
                    age: next.age,
                    avatarSeed: next.avatarSeed,
                    distanceKm: next.distanceKm,
                    areaLabel: next.areaLabel,
                    interests: next.interests,
                  }}
                  commonWith={userInterests}
                />
              </div>
            )}
            <SwipeableCard
              key={current.id + String(current.lastPasar)}
              forceDirection={flyOut}
              onSwipe={(direction) => void handleSwipe(direction)}
            >
              <ProfileCard
                person={{
                  id: current.id,
                  name: current.name,
                  age: current.age,
                  avatarSeed: current.avatarSeed,
                  distanceKm: current.distanceKm,
                  areaLabel: current.areaLabel,
                  interests: current.interests,
                }}
                commonWith={userInterests}
                onLikeMedia={(mediaId) => void likeMedia(mediaId)}
                onInfoTap={() => navigate(`/persona/${current.id}`)}
              />
            </SwipeableCard>
          </>
        )}
      </div>

      {status === 'ready' && current && (
        <ActionBar
          disabled={flyOut !== null}
          onSkip={() => setFlyOut('skip')}
          onPasar={() => setFlyOut('pasar')}
          onMatch={() => setFlyOut('match')}
        />
      )}

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  )
}
