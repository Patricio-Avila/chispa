import { lazy, Suspense, useState } from 'react'
import './RadarLoader.css'

const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then((m) => ({
    default: m.DotLottieReact,
  })),
)

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Pin con ondas de radar: fotograma base en CSS, Lottie encima.
 *  Con prefers-reduced-motion se queda el pin estático. */
export function RadarLoader() {
  const [lottieReady, setLottieReady] = useState(false)

  return (
    <div className="radar-loader" role="img" aria-label="Buscando tu zona">
      <div
        className={`radar-loader__css${lottieReady ? ' radar-loader__css--hidden' : ''}`}
        aria-hidden="true"
      >
        <span className="radar-loader__pin" />
        <span className="radar-loader__dot" />
      </div>
      {!REDUCED_MOTION && (
        <Suspense fallback={null}>
          <DotLottieReact
            className={`radar-loader__lottie${lottieReady ? ' radar-loader__lottie--visible' : ''}`}
            src={`${import.meta.env.BASE_URL}lottie/radar.lottie`}
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
