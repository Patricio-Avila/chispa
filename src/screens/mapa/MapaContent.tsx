import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { CaretLeft, MagnifyingGlass, MapPin, CrosshairSimple } from '@phosphor-icons/react'
import { divIcon, type LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  discoveryRepo,
  locationRepo,
  userRepo,
  type DeckRow,
  type LocationMode,
} from '../../data/repo'
import { getCurrentPosition } from '../../services/geo'
import {
  searchPlaces,
  PlacesError,
  type PlaceResult,
} from '../../services/places'
import { zoneKeyFor } from '../../sim/prng'
import { blobOffset, BLOB_RADIUS_M } from '../../sim/zoneBlobs'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { SegmentedToggle } from '../../components/SegmentedToggle'
import './MapaScreen.css'

/** Centro inicial: Monterrey (primera ciudad de referencia, CLAUDE.md §2). */
const DEFAULT_CENTER: [number, number] = [25.67, -100.31]
const RADIUS_OPTIONS = [5, 10, 25, 50]
const SEARCH_DEBOUNCE_MS = 350
const SEARCH_MIN_CHARS = 3

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

/** Recentra el mapa cuando el pin cambia (búsqueda o "mi ubicación"). */
function RecenterOnPin({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [map, center])
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
  const [mode, setMode] = useState<LocationMode>('aqui')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pickedLabel, setPickedLabel] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState(true)
  const [blobs, setBlobs] = useState<DeckRow[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(
    geoFailed ? 'No pudimos obtener tu ubicación. Elige tu zona tocando el mapa.' : null,
  )

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const debounceTimer = useRef<number | undefined>(undefined)

  // Estado inicial: location_context previo + modo onboarding.
  useEffect(() => {
    void (async () => {
      const step = await userRepo.getOnboardingStep()
      setOnboarding(step !== 'done')
      const user = await userRepo.getLocalUser()
      if (!user) return
      const context = await locationRepo.get(user.id)
      if (context) {
        setPin([context.lat, context.lng])
        setRadiusKm(context.radiusKm)
        setMode(context.mode)
        setDateFrom(context.dateFrom ?? '')
        setDateTo(context.dateTo ?? '')
      }
    })()
  }, [])

  // Manchas de zona de la zona sembrada actual (nunca puntos exactos).
  useEffect(() => {
    void (async () => {
      const user = await userRepo.getLocalUser()
      if (!user) return
      const context = await locationRepo.get(user.id)
      if (!context) return
      const zoneKey = zoneKeyFor(context.lat, context.lng)
      if (!(await discoveryRepo.isZoneSeeded(zoneKey))) return
      const rows = await discoveryRepo.getDeckRows(
        user.id,
        zoneKey,
        context.lat,
        context.lng,
      )
      setBlobs(rows)
    })()
  }, [])

  // Búsqueda Photon: debounce 350 ms, mínimo 3 caracteres, sesgo al pin.
  useEffect(() => {
    window.clearTimeout(debounceTimer.current)
    const trimmed = query.trim()
    if (trimmed.length < SEARCH_MIN_CHARS) {
      setResults([])
      return
    }
    debounceTimer.current = window.setTimeout(() => {
      void searchPlaces(trimmed, { lat: pin[0], lng: pin[1] })
        .then((found) => {
          setResults(found)
          if (found.length === 0) {
            setNotice('Sin resultados. También puedes elegir tocando el mapa.')
          }
        })
        .catch((error) => {
          setResults([])
          setNotice(
            error instanceof PlacesError
              ? `${error.message} Elige tocando el mapa.`
              : 'No se pudo buscar. Elige tocando el mapa.',
          )
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(debounceTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function choosePlace(place: PlaceResult) {
    setPin([place.lat, place.lng])
    setPickedLabel(place.name)
    setQuery('')
    setResults([])
    setNotice(null)
  }

  async function useMyLocation() {
    setBusy(true)
    const result = await getCurrentPosition()
    setBusy(false)
    if (result.ok) {
      setPin([result.lat, result.lng])
      setPickedLabel(null)
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
      mode,
      lat: pin[0],
      lng: pin[1],
      label: pickedLabel ?? 'Tu zona',
      radiusKm,
      dateFrom: mode === 'voy' && dateFrom ? dateFrom : null,
      dateTo: mode === 'voy' && dateTo ? dateTo : null,
    })
    if (!onboarding) {
      navigate('/generando', { replace: true })
      return
    }
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Búsqueda: Photon'
        />
        <TapHandler
          onTap={(latlng) => {
            setPin([latlng.lat, latlng.lng])
            setPickedLabel(null)
          }}
        />
        <RecenterOnPin center={pin} />
        <Marker position={pin} icon={pinIcon} />
        <Circle
          center={pin}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#D93A52', weight: 1.5, dashArray: '4 4', fillColor: '#E8434D', fillOpacity: 0.12 }}
        />
        {blobs.map((row) => {
          const offset = blobOffset(row.id, row.lat)
          return (
            <Circle
              key={row.id}
              center={[row.lat + offset.dLat, row.lng + offset.dLng]}
              radius={BLOB_RADIUS_M}
              pathOptions={{
                stroke: false,
                fillColor: '#E11D74',
                fillOpacity: 0.18,
              }}
              interactive={false}
            />
          )
        })}
      </MapContainer>

      <div className="mapa__top">
        <button
          type="button"
          className="mapa__back"
          aria-label="Volver"
          onClick={() => navigate(-1)}
        >
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        <label className="mapa__search">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar un lugar"
            aria-label="Buscar un lugar"
          />
        </label>
      </div>

      {results.length > 0 && (
        <ul className="mapa__results" role="listbox" aria-label="Resultados">
          {results.map((place, index) => (
            <li key={`${place.name}-${index}`}>
              <button
                type="button"
                className="mapa__result"
                onClick={() => choosePlace(place)}
              >
                <MapPin
                  size={18}
                  color={index === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  aria-hidden="true"
                />
                <span className="mapa__result-text">
                  <span className="mapa__result-name">{place.name}</span>
                  {place.detail && (
                    <span className="mapa__result-detail">{place.detail}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {notice && (
        <p className="mapa__notice" role="status">
          {notice}
        </p>
      )}

      <div className="mapa__sheet">
        <div className="mapa__handle" aria-hidden="true" />
        {onboarding ? (
          <p className="text-label mapa__sheet-title">
            {pickedLabel ?? 'Elige tu zona tocando el mapa'}
          </p>
        ) : (
          <SegmentedToggle
            ariaLabel="Modo de búsqueda"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'aqui', label: 'Estoy aquí' },
              { value: 'voy', label: 'Voy a ir' },
            ]}
          />
        )}
        {!onboarding && pickedLabel && (
          <p className="text-label mapa__sheet-title">{pickedLabel}</p>
        )}
        {mode === 'voy' && !onboarding && (
          <div className="mapa__dates">
            <label className="mapa__date">
              <span className="text-label">Desde</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Fecha desde"
              />
            </label>
            <label className="mapa__date">
              <span className="text-label">Hasta</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Fecha hasta"
              />
            </label>
          </div>
        )}
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
          <CrosshairSimple size={16} aria-hidden="true" /> Usar mi ubicación actual
        </button>
      </div>
    </div>
  )
}
