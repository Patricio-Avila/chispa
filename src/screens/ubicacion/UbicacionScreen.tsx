import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { locationRepo, userRepo } from '../../data/repo'
import { getCurrentPosition } from '../../services/geo'
import { Button } from '../../components/Button'
import { RadarLoader } from './RadarLoader'
import './UbicacionScreen.css'

export function UbicacionScreen() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function allowLocation() {
    setBusy(true)
    const result = await getCurrentPosition()
    const user = await userRepo.getLocalUser()
    if (!user) {
      navigate('/registro', { replace: true })
      return
    }
    if (result.ok) {
      await locationRepo.set(user.id, {
        mode: 'aqui',
        lat: result.lat,
        lng: result.lng,
        label: 'Tu zona',
        radiusKm: Math.min(user.maxDistanceKm, 50),
        dateFrom: null,
        dateTo: null,
      })
      await userRepo.setOnboardingStep('done')
      navigate('/descubrir', { replace: true })
      return
    }
    // Negó, timeout o falló: a elegir zona en el mapa con un aviso breve.
    navigate('/mapa', { state: { geoFailed: true } })
  }

  return (
    <div className="ubicacion">
      <div className="ubicacion__body">
        <RadarLoader />
        <h1 className="text-title">Gente cerca de ti</h1>
        <p className="text-body ubicacion__text">
          Usamos tu ubicación para mostrarte gente cerca. Nadie ve tu punto
          exacto.
        </p>
      </div>
      <div className="ubicacion__footer">
        <Button onClick={() => void allowLocation()} disabled={busy}>
          {busy ? 'Buscando tu zona…' : 'Permitir ubicación'}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => navigate('/mapa')}
        >
          Prefiero elegir en el mapa
        </Button>
      </div>
    </div>
  )
}
