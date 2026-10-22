import { useNavigate, useRouteError } from 'react-router-dom'
import { Button } from '../components/Button'
import './ScreenError.css'

/** ErrorBoundary por pantalla (CLAUDE.md §14): mensaje amable y
 *  salida a Descubrir. */
export function ScreenError() {
  const navigate = useNavigate()
  const error = useRouteError()
  console.error('Error de pantalla', error)

  return (
    <div className="screen-error">
      <h1 className="text-title">Algo salió mal</h1>
      <p className="text-body screen-error__text">
        Esta pantalla tuvo un problema. Puedes volver a Descubrir y seguir
        explorando.
      </p>
      <Button onClick={() => navigate('/descubrir')}>Volver a Descubrir</Button>
    </div>
  )
}
