import { createHashRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { LoadingScreen } from '../screens/loading/LoadingScreen'
import { PlaceholderScreen } from '../screens/placeholder/PlaceholderScreen'
import { BienvenidaScreen } from '../screens/bienvenida/BienvenidaScreen'
import { RegistroScreen } from '../screens/registro/RegistroScreen'
import { MediosScreen } from '../screens/medios/MediosScreen'
import { UbicacionScreen } from '../screens/ubicacion/UbicacionScreen'
import { MapaScreen } from '../screens/mapa/MapaScreen'
import { GenerandoScreen } from '../screens/generando/GenerandoScreen'
import { DescubrirScreen } from '../screens/descubrir/DescubrirScreen'
import { PersonaScreen } from '../screens/persona/PersonaScreen'

export const router = createHashRouter([
  { path: '/', element: <LoadingScreen /> },

  /* Onboarding y pantallas sin barra inferior */
  { path: '/bienvenida', element: <BienvenidaScreen /> },
  { path: '/registro', element: <RegistroScreen /> },
  { path: '/medios', element: <MediosScreen /> },
  { path: '/ubicacion', element: <UbicacionScreen /> },
  { path: '/mapa', element: <MapaScreen /> },
  { path: '/generando', element: <GenerandoScreen /> },
  { path: '/persona/:id', element: <PersonaScreen /> },
  { path: '/chat/:matchId', element: <PlaceholderScreen title="Chat" phase={4} /> },
  { path: '/perfil/editar', element: <PlaceholderScreen title="Editar perfil" phase={7} /> },
  { path: '/perfil/vista', element: <PlaceholderScreen title="Ver cómo me ven" phase={7} /> },

  /* Pestañas con barra inferior / riel lateral */
  {
    element: <AppShell />,
    children: [
      { path: '/descubrir', element: <DescubrirScreen /> },
      { path: '/likes', element: <PlaceholderScreen title="Likes" phase={5} /> },
      { path: '/conversaciones', element: <PlaceholderScreen title="Conversaciones" phase={4} /> },
      { path: '/perfil', element: <PlaceholderScreen title="Perfil" phase={7} /> },
    ],
  },
])
