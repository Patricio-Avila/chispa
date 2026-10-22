import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userRepo } from '../../data/repo'
import { MediaManager } from '../../components/MediaManager'
import { Button } from '../../components/Button'
import './MediosScreen.css'

export function MediosScreen() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void userRepo.getLocalUser().then((user) => {
      if (!user) {
        navigate('/registro', { replace: true })
        return
      }
      setUserId(user.id)
    })
  }, [navigate])

  if (!userId) return null

  return (
    <div className="medios">
      <header className="medios__header">
        <h1 className="text-title">Tus fotos y video</h1>
        <p className="medios__sub">
          Mínimo 1 foto. La primera es tu foto principal; mantén presionada una
          foto y arrástrala para reordenar.
        </p>
      </header>

      <MediaManager
        userId={userId}
        onStatusChange={({ photoCount: count, busy: working }) => {
          setPhotoCount(count)
          setBusy(working)
        }}
      />

      <div className="medios__footer">
        <Button
          disabled={photoCount < 1 || busy}
          onClick={() => {
            void userRepo.setOnboardingStep('ubicacion').then(() => {
              navigate('/ubicacion')
            })
          }}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
