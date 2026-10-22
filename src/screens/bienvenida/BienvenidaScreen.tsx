import { useNavigate } from 'react-router-dom'
import { userRepo } from '../../data/repo'
import { Button } from '../../components/Button'
import './BienvenidaScreen.css'

export function BienvenidaScreen() {
  const navigate = useNavigate()

  return (
    <div className="bienvenida">
      <div className="bienvenida__body">
        <div className="bienvenida__logo" aria-hidden="true">
          <span className="bienvenida__half bienvenida__half--left" />
          <span className="bienvenida__half bienvenida__half--right" />
        </div>
        <h1 className="text-display">Chispa</h1>
        <p className="text-body bienvenida__tagline">
          Conoce gente cerca de ti y pasa del chat al plan.
        </p>
      </div>
      <div className="bienvenida__footer">
        <p className="bienvenida__demo text-label">
          Es una demo: tus datos solo viven en este dispositivo.
        </p>
        <Button
          onClick={() => {
            void userRepo.setOnboardingStep('registro').then(() => {
              navigate('/registro')
            })
          }}
        >
          Crear mi perfil
        </Button>
      </div>
    </div>
  )
}
