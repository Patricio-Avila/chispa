import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet'
import { CaretLeft } from '@phosphor-icons/react'
import { divIcon, type LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { locationRepo, userRepo } from '../../data/repo'
import { getCurrentPosition } from '../../services/geo'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import './MapaScreen.css'

/** Centro inicial: Monterrey (primera ciudad de referencia, CLAUDE.md §2). */
const DEFAULT_CENTER: [number, number] = [25.67, -100.31]
const RADIUS_OPTIONS = [5, 10, 25, 50]

const pinIcon = divIcon({
  className: 'mapa__pin',
  html: '<span class="mapa__pin-drop"></span><span class="mapa__pin-dot"></span>',
  iconSize: [40, 48],
  iconAnchor: [20, 46],
})

function TapHandler({ onTap }: { onTap: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onTap(e.latlng)
    },
  })
  return null
}

export function MapaContent() {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const geoFailed = Boolean(
    (routerLocation.state as { geoFailed?: boolean } | null)?.geoFailed,
  )

  const [pin, setPin] = useState<[number, number]>(DEFAULT_CENTER)
  const [radiusKm, setRadiusKm] = useState(10)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(
    geoFailed ? 'No pudimos obtener tu ubicación. Elige tu zona tocando el mapa.' : null,
  )

  async function useMyLocation() {
    setBusy(true)
    const result = await getCurrentPosition()
    setBusy(false)
    if (result.ok) {
      setPin([result.lat, result.lng])
      setNotice(null)
    } else {
      setNotice('No pudimos obtener tu ubicación. Elige tu zona tocando el mapa.')
    }
  }

  async function exploreZone() {
    setBusy(true)
    const user = await userRepo.getLocalUser()
    if (!user) {
      navigate('/registro', { replace: true })
      return
    }
    await locationRepo.set(user.id, {
      mode: 'aqui',
      lat: pin[0],
      lng: pin[1],
      label: 'Tu zona',
      radiusKm,
      dateFrom: null,
      dateTo: null,
    })
    await userRepo.setOnboardingStep('done')
    navigate('/generando', { replace: true })
  }

  return (
    <div className="mapa">
      <MapContainer
        center={pin}
        zoom={12}
        className="mapa__map"
        attributionControl={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <TapHandler onTap={(latlng) => setPin([latlng.lat, latlng.lng])} />
        <Marker position={pin} icon={pinIcon} />
        <Circle
          center={pin}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#D93A52', weight: 1.5, dashArray: '4 4', fillColor: '#E8434D', fillOpacity: 0.12 }}
        />
      </MapContainer>

      <button
        type="button"
        className="mapa__back"
        aria-label="Volver"
        onClick={() => navigate(-1)}
      >
        <CaretLeft size={20} weight="bold" aria-hidden="true" />
      </button>

      {notice && (
        <p className="mapa__notice" role="status">
          {notice}
        </p>
      )}

      <div className="mapa__sheet">
        <div className="mapa__handle" aria-hidden="true" />
        <p className="text-label mapa__sheet-title">Elige tu zona tocando el mapa</p>
        <div className="mapa__radius" role="group" aria-label="Radio de búsqueda">
          {RADIUS_OPTIONS.map((option) => (
            <Chip
              key={option}
              selected={radiusKm === option}
              onClick={() => setRadiusKm(option)}
            >
              {option} km
            </Chip>
          ))}
        </div>
        <Button onClick={() => void exploreZone()} disabled={busy}>
          Explorar esta zona
        </Button>
        <button
          type="button"
          className="mapa__use-location"
          onClick={() => void useMyLocation()}
          disabled={busy}
        >
          Usar mi ubicación actual
        </button>
      </div>
    </div>
  )
}
