import { lazy, Suspense } from 'react'
import './MapaScreen.css'

/** Leaflet y react-leaflet solo se cargan al entrar aquí (CLAUDE.md §5.2). */
const MapaContent = lazy(() =>
  import('./MapaContent').then((m) => ({ default: m.MapaContent })),
)

export function MapaScreen() {
  return (
    <Suspense
      fallback={
        <div className="mapa__loading">
          <p className="text-body">Cargando el mapa…</p>
        </div>
      }
    >
      <MapaContent />
    </Suspense>
  )
}
