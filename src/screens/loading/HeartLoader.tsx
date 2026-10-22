import { lazy, Suspense, useState } from 'react'
import './HeartLoader.css'

const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then((m) => ({
    default: m.DotLottieReact,
  })),
)

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Corazón de carga: el primer fotograma es CSS puro (aparece al instante)
 * y encima se reproduce la Lottie del corazón que se arma con dos mitades.
 * Con prefers-reduced-motion se queda el fotograma fijo en CSS.
 */
export function HeartLoader() {
  const [lottieReady, setLottieReady] = useState(false)

  return (
    <div className="heart-loader" role="img" aria-label="Cargando">
      <div
        className={`heart-loader__css${lottieReady ? ' heart-loader__css--hidden' : ''}`}
        aria-hidden="true"
      >
        <span className="heart-loader__half heart-loader__half--left" />
        <span className="heart-loader__half heart-loader__half--right" />
      </div>
      {!REDUCED_MOTION && (
        <Suspense fallback={null}>
          <DotLottieReact
            className={`heart-loader__lottie${lottieReady ? ' heart-loader__lottie--visible' : ''}`}
            src={`${import.meta.env.BASE_URL}lottie/heart.lottie`}
            loop
            autoplay
            dotLottieRefCallback={(dotLottie) => {
              dotLottie?.addEventListener('load', () => setLottieReady(true))
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
