import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Play, Heart } from '@phosphor-icons/react'
import { AvatarIllustration } from './AvatarIllustration'
import './MediaCarousel.css'

const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then((m) => ({
    default: m.DotLottieReact,
  })),
)

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export type CarouselItem =
  | { kind: 'avatar'; seed: number; mediaId: string | null }
  | { kind: 'photo'; url: string; mediaId: string | null }
  | { kind: 'lottie'; url: string; mediaId: string | null }
  | { kind: 'video'; url: string; posterUrl: string | null; durationS: number | null; mediaId: string | null }

type MediaCarouselProps = {
  items: CarouselItem[]
  personName: string
  /** Like al medio visible (doble toque o botón). */
  onLike?: (item: CarouselItem) => void
}

const DOUBLE_TAP_MS = 300

export function MediaCarousel({ items, personName, onLike }: MediaCarouselProps) {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [likeBurst, setLikeBurst] = useState(false)
  const lastTap = useRef(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const current = items[Math.min(index, items.length - 1)]

  // Videos solo se reproducen si la pestaña está visible.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onVisibility = () => {
      if (document.hidden) video.pause()
      else void video.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [current])

  if (!current) return null

  function triggerLike() {
    if (!onLike || !current) return
    onLike(current)
    setLikeBurst(true)
    window.setTimeout(() => setLikeBurst(false), 700)
  }

  function handleTap(e: React.MouseEvent) {
    const now = Date.now()
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0
      triggerLike()
      return
    }
    lastTap.current = now

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    if (x < 0.3) {
      setIndex((i) => Math.max(0, i - 1))
    } else if (x > 0.7) {
      setIndex((i) => Math.min(items.length - 1, i + 1))
    } else if (current?.kind === 'video') {
      setMuted((m) => !m)
    }
  }

  return (
    <div className="carousel" onClick={handleTap}>
      {items.length > 1 && (
        <div className="carousel__segments" aria-hidden="true">
          {items.map((_, i) => (
            <span
              key={i}
              className={`carousel__segment${i === index ? ' carousel__segment--active' : ''}`}
            />
          ))}
        </div>
      )}

      {current.kind === 'avatar' && (
        <AvatarIllustration
          seed={current.seed}
          name={personName}
          className="carousel__media"
        />
      )}
      {current.kind === 'photo' && (
        <img className="carousel__media" src={current.url} alt={`Foto de ${personName}`} />
      )}
      {current.kind === 'lottie' && (
        <Suspense fallback={<span className="carousel__media" />}>
          <DotLottieReact
            className="carousel__media carousel__media--lottie"
            src={current.url}
            loop
            autoplay={!REDUCED_MOTION}
            layout={{ fit: 'cover', align: [0.5, 0.5] }}
          />
        </Suspense>
      )}
      {current.kind === 'video' && (
        <>
          <video
            ref={videoRef}
            className="carousel__media"
            src={current.url}
            poster={current.posterUrl ?? undefined}
            autoPlay
            loop
            muted={muted}
            playsInline
          />
          <span className="carousel__video-badge text-label">
            <Play size={12} weight="fill" aria-hidden="true" />
            Video{current.durationS ? ` · 0:${String(Math.round(current.durationS)).padStart(2, '0')}` : ''}
            {muted ? ' · toca para oír' : ''}
          </span>
        </>
      )}

      {onLike && (
        <button
          type="button"
          className="carousel__like"
          aria-label={`Like a este ${current.kind === 'video' ? 'video' : 'medio'}`}
          onClick={(e) => {
            e.stopPropagation()
            triggerLike()
          }}
        >
          <Heart size={20} weight="fill" aria-hidden="true" />
        </button>
      )}

      {likeBurst && (
        <span className="carousel__burst" aria-hidden="true">
          <Heart size={72} weight="fill" />
        </span>
      )}
    </div>
  )
}
