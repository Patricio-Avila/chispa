import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import {
  locationRepo,
  userRepo,
  type AppUser,
  type LocationContext,
} from '../../data/repo'
import { ageFromBirthdate } from '../registro/age'
import { ProfileCard } from '../../components/ProfileCard'
import './VistaScreen.css'

/** Tu propia tarjeta en formato Descubrir, sin acciones (§8.2-16). */
export function VistaScreen() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AppUser | null>(null)
  const [location, setLocation] = useState<LocationContext | null>(null)

  useEffect(() => {
    void (async () => {
      const localUser = await userRepo.getLocalUser()
      if (!localUser) {
        navigate('/', { replace: true })
        return
      }
      setUser(localUser)
      setLocation(await locationRepo.get(localUser.id))
    })()
  }, [navigate])

  if (!user) return null

  return (
    <div className="vista">
      <header className="vista__header">
        <button
          type="button"
          className="vista__back"
          aria-label="Volver"
          onClick={() => navigate('/perfil')}
        >
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        <h1 className="text-title">Así te ven</h1>
      </header>

      <div className="vista__card">
        <ProfileCard
          person={{
            id: user.id,
            name: user.name,
            age: ageFromBirthdate(user.birthdate),
            avatarSeed: 0,
            distanceKm: 1,
            areaLabel: location?.label ?? 'Tu zona',
            interests: user.interests,
          }}
          commonWith={[]}
          distanceText={location?.label ?? 'Tu zona'}
        />
      </div>
    </div>
  )
}
