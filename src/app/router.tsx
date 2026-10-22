import { createHashRouter } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { ScreenError } from './ScreenError'
import { AppShell } from './AppShell'
import { LoadingScreen } from '../screens/loading/LoadingScreen'
import { BienvenidaScreen } from '../screens/bienvenida/BienvenidaScreen'
import { RegistroScreen } from '../screens/registro/RegistroScreen'
import { MediosScreen } from '../screens/medios/MediosScreen'
import { UbicacionScreen } from '../screens/ubicacion/UbicacionScreen'
import { MapaScreen } from '../screens/mapa/MapaScreen'
import { GenerandoScreen } from '../screens/generando/GenerandoScreen'
import { DescubrirScreen } from '../screens/descubrir/DescubrirScreen'
import { PersonaScreen } from '../screens/persona/PersonaScreen'
import { ConversacionesScreen } from '../screens/conversaciones/ConversacionesScreen'
import { LikesScreen } from '../screens/likes/LikesScreen'
import { PerfilScreen } from '../screens/perfil/PerfilScreen'
import { EditarScreen } from '../screens/perfil/EditarScreen'
import { VistaScreen } from '../screens/perfil/VistaScreen'
import { ChatScreen } from '../screens/chat/ChatScreen'

export const router = createHashRouter([
  {
    element: <RootLayout />,
    errorElement: <ScreenError />,
    children: [
  { path: '/', element: <LoadingScreen /> },

  /* Onboarding y pantallas sin barra inferior */
  { path: '/bienvenida', element: <BienvenidaScreen /> },
  { path: '/registro', element: <RegistroScreen /> },
  { path: '/medios', element: <MediosScreen /> },
  { path: '/ubicacion', element: <UbicacionScreen /> },
  { path: '/mapa', element: <MapaScreen /> },
  { path: '/generando', element: <GenerandoScreen /> },
  { path: '/persona/:id', element: <PersonaScreen /> },
  { path: '/chat/:matchId', element: <ChatScreen /> },
  { path: '/perfil/editar', element: <EditarScreen /> },
  { path: '/perfil/vista', element: <VistaScreen /> },

  /* Pestañas con barra inferior / riel lateral */
  {
    element: <AppShell />,
    children: [
      { path: '/descubrir', element: <DescubrirScreen /> },
      { path: '/likes', element: <LikesScreen /> },
      { path: '/conversaciones', element: <ConversacionesScreen /> },
      { path: '/perfil', element: <PerfilScreen /> },
    ],
  },
    ],
  },
])
