import { lazy, Suspense, useState } from 'react'
import './CardsLoader.css'

const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then((m) => ({
    default: m.DotLottieReact,
  })),
)

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tarjetas apiladas que se deslizan: fotograma base en CSS, Lottie encima. */
export function CardsLoader() {
  const [lottieReady, setLottieReady] = useState(false)

  return (
    <div className="cards-loader" role="img" aria-label="Generando perfiles">
      <div
        className={`cards-loader__css${lottieReady ? ' cards-loader__css--hidden' : ''}`}
        aria-hidden="true"
      >
        <span className="cards-loader__card cards-loader__card--back" />
        <span className="cards-loader__card cards-loader__card--middle" />
        <span className="cards-loader__card cards-loader__card--top" />
      </div>
      {!REDUCED_MOTION && (
        <Suspense fallback={null}>
          <DotLottieReact
            className={`cards-loader__lottie${lottieReady ? ' cards-loader__lottie--visible' : ''}`}
            src={`${import.meta.env.BASE_URL}lottie/cards.lottie`}
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
