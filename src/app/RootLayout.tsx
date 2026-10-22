import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ToastHost } from '../components/ToastHost'
import { NotifPermissionSheet } from '../components/NotifPermissionSheet'
import { startIncomingLikes } from '../sim/incomingLikes'
import { userRepo } from '../data/repo'

/** Capa raíz: avisos globales y arranque del motor de likes entrantes. */
export function RootLayout() {
  useEffect(() => {
    void userRepo.getOnboardingStep().then((step) => {
      if (step === 'done') startIncomingLikes()
    })
  }, [])

  return (
    <>
      <Outlet />
      <ToastHost />
      <NotifPermissionSheet />
    </>
  )
}
