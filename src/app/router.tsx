import { createHashRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { LoadingScreen } from '../screens/loading/LoadingScreen'
import { PlaceholderScreen } from '../screens/placeholder/PlaceholderScreen'

export const router = createHashRouter([
  { path: '/', element: <LoadingScreen /> },

  /* Onboarding y pantallas sin barra inferior */
  { path: '/bienvenida', element: <PlaceholderScreen title="Bienvenida" phase={2} /> },
  { path: '/registro', element: <PlaceholderScreen title="Registro rápido" phase={2} /> },
  { path: '/medios', element: <PlaceholderScreen title="Fotos y video" phase={2} /> },
  { path: '/ubicacion', element: <PlaceholderScreen title="Pre-permiso de ubicación" phase={2} /> },
  { path: '/mapa', element: <PlaceholderScreen title="Buscar en el mapa" phase={6} /> },
  { path: '/generando', element: <PlaceholderScreen title="Generando perfiles" phase={3} /> },
  { path: '/persona/:id', element: <PlaceholderScreen title="Detalle de perfil" phase={3} /> },
  { path: '/chat/:matchId', element: <PlaceholderScreen title="Chat" phase={4} /> },
  { path: '/perfil/editar', element: <PlaceholderScreen title="Editar perfil" phase={7} /> },
  { path: '/perfil/vista', element: <PlaceholderScreen title="Ver cómo me ven" phase={7} /> },

  /* Pestañas con barra inferior / riel lateral */
  {
    element: <AppShell />,
    children: [
      { path: '/descubrir', element: <PlaceholderScreen title="Descubrir" phase={3} /> },
      { path: '/likes', element: <PlaceholderScreen title="Likes" phase={5} /> },
      { path: '/conversaciones', element: <PlaceholderScreen title="Conversaciones" phase={4} /> },
      { path: '/perfil', element: <PlaceholderScreen title="Perfil" phase={7} /> },
    ],
  },
])
