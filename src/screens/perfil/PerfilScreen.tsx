import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  locationRepo,
  mediaRepo,
  userRepo,
  type AppUser,
  type LocationContext,
} from '../../data/repo'
import { loadMediaBlob } from '../../services/media'
import { getPermission, requestPermission } from '../../services/notifications'
import { wipeLocalData } from '../../data/db/db'
import { wipeMediaFiles } from '../../services/media'
import { ageFromBirthdate } from '../registro/age'
import { formatZoneChip } from '../descubrir/zoneChip'
import { Button } from '../../components/Button'
import { BottomSheet } from '../../components/BottomSheet'
import './PerfilScreen.css'

const GENDER_LABEL: Record<string, string> = {
  mujer: 'Mujeres',
  hombre: 'Hombres',
  no_binario: 'Personas no binarias',
}

function notifStatusText(permission: NotificationPermission): string {
  switch (permission) {
    case 'granted':
      return 'Activadas'
    case 'denied':
      return 'Bloqueadas en el navegador'
    default:
      return 'Sin activar'
  }
}

export function PerfilScreen() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AppUser | null>(null)
  const [location, setLocation] = useState<LocationContext | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>(getPermission())
  const [notifHelpOpen, setNotifHelpOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    void (async () => {
      const localUser = await userRepo.getLocalUser()
      if (!localUser) {
        navigate('/', { replace: true })
        return
      }
      const [context, media] = await Promise.all([
        locationRepo.get(localUser.id),
        mediaRepo.listByUser(localUser.id),
      ])
      const photo = media.find((m) => m.kind === 'photo')
      if (photo) {
        const blob = await loadMediaBlob({
          storage: photo.storage as 'opfs' | 'idb',
          path: photo.path,
        })
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setPhotoUrl(objectUrl)
        }
      }
      if (cancelled) return
      setUser(localUser)
      setLocation(context)
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [navigate])

  if (!user) return null

  async function handleNotifications() {
    if (permission === 'default') {
      const result = await requestPermission()
      setPermission(result)
      return
    }
    setNotifHelpOpen(true)
  }

  async function deleteEverything() {
    setDeleting(true)
    await wipeMediaFiles()
    await wipeLocalData()
    // Recarga completa: la Carga re-inicializa la base y cae en Bienvenida.
    window.location.hash = '#/'
    window.location.reload()
  }

  return (
    <div className="perfil">
      <header className="perfil__header">
        {photoUrl ? (
          <img className="perfil__photo" src={photoUrl} alt="Tu foto principal" />
        ) : (
          <span className="perfil__photo perfil__photo--empty" aria-hidden="true" />
        )}
        <div className="perfil__header-text">
          <h1 className="text-card-name">
            {user.name}, {ageFromBirthdate(user.birthdate)}
          </h1>
          {location && (
            <span className="perfil__zone text-label">{formatZoneChip(location)}</span>
          )}
        </div>
      </header>

      {user.bio && <p className="text-body perfil__bio">{user.bio}</p>}

      {user.interests.length > 0 && (
        <section className="perfil__section">
          <h2 className="perfil__section-title">Intereses</h2>
          <div className="perfil__chips">
            {user.interests.map((interest) => (
              <span key={interest} className="perfil__chip">
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="perfil__section">
        <h2 className="perfil__section-title">Preferencias</h2>
        <dl className="perfil__facts">
          <div>
            <dt>Busco</dt>
            <dd>{user.seeking.map((g) => GENDER_LABEL[g] ?? g).join(', ')}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>
              {user.ageMin}–{user.ageMax} años
            </dd>
          </div>
          <div>
            <dt>Distancia</dt>
            <dd>Hasta {user.maxDistanceKm} km</dd>
          </div>
          <div>
            <dt>Notificaciones</dt>
            <dd>{notifStatusText(permission)}</dd>
          </div>
        </dl>
      </section>

      <div className="perfil__actions">
        <Button onClick={() => navigate('/perfil/editar')}>Editar perfil</Button>
        <Button variant="secondary" onClick={() => navigate('/perfil/vista')}>
          Ver cómo me ven
        </Button>
        <Button variant="secondary" onClick={() => navigate('/mapa')}>
          Cambiar ubicación
        </Button>
        <Button variant="secondary" onClick={() => void handleNotifications()}>
          Notificaciones
        </Button>
        <button
          type="button"
          className="perfil__danger"
          onClick={() => setDeleteOpen(true)}
        >
          Borrar mis datos
        </button>
      </div>

      <BottomSheet
        open={notifHelpOpen}
        onClose={() => setNotifHelpOpen(false)}
        title="Notificaciones"
      >
        <p className="text-body perfil__sheet-text">
          {permission === 'granted'
            ? 'Las notificaciones están activadas. Te avisamos cuando alguien te dé like o te escriba mientras la app esté abierta.'
            : 'Están bloqueadas en el navegador. Actívalas en la configuración del sitio (el candado junto a la dirección). En iPhone, primero agrega Chispa a tu pantalla de inicio para poder recibirlas.'}
        </p>
        <Button onClick={() => setNotifHelpOpen(false)}>Entendido</Button>
      </BottomSheet>

      <BottomSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="¿Borrar todos tus datos?"
      >
        <p className="text-body perfil__sheet-text">
          Se borran tu perfil, fotos, matches y conversaciones de este
          dispositivo. No se puede deshacer.
        </p>
        <Button
          className="perfil__delete-confirm"
          onClick={() => void deleteEverything()}
          disabled={deleting}
        >
          {deleting ? 'Borrando…' : 'Sí, borrar todo'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setDeleteOpen(false)}
          disabled={deleting}
        >
          Cancelar
        </Button>
      </BottomSheet>
    </div>
  )
}
