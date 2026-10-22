import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMeta, initDb, wipeLocalData } from '../../data/db/db'
import { Button } from '../../components/Button'
import { HeartLoader } from './HeartLoader'
import './LoadingScreen.css'

const MIN_VISIBLE_MS = 600

type OnboardingStep = 'registro' | 'medios' | 'ubicacion' | 'done'

function routeForStep(step: OnboardingStep | null): string {
  switch (step) {
    case 'registro':
      return '/registro'
    case 'medios':
      return '/medios'
    case 'ubicacion':
      return '/ubicacion'
    case 'done':
      return '/descubrir'
    default:
      return '/bienvenida'
  }
}

export function LoadingScreen() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    void (async () => {
      try {
        await initDb()
        const step = await getMeta<OnboardingStep>('onboarding_step')
        const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt)
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining))
        }
        if (!cancelled) {
          navigate(routeForStep(step), { replace: true })
        }
      } catch (error) {
        console.error('No se pudo iniciar la base de datos', error)
        if (!cancelled) {
          setFailed(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate, attempt])

  if (failed) {
    return (
      <div className="loading-screen">
        <h1 className="text-title">Algo salió mal</h1>
        <p className="text-body loading-screen__error">
          No pudimos preparar tus datos en este dispositivo.
        </p>
        <div className="loading-screen__actions">
          <Button
            onClick={() => {
              setFailed(false)
              setAttempt((n) => n + 1)
            }}
          >
            Reintentar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void wipeLocalData().then(() => {
                setFailed(false)
                setAttempt((n) => n + 1)
              })
            }}
          >
            Borrar datos locales
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="loading-screen">
      <HeartLoader />
    </div>
  )
}
