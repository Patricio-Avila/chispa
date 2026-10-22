/** Notificaciones (CLAUDE.md §10.4): aviso in-app si la pestaña está
 *  visible; notificación del sistema (vía service worker) si está oculta
 *  y hay permiso. Sin servidor no hay push con la app cerrada. */

import { getMeta, setMeta } from '../data/db/db'
import { useToastStore } from '../app/toastStore'

const SNOOZE_KEY = 'notif_prompt_snoozed_until'
const SNOOZE_DAYS = 3

export function getPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied'
  return Notification.permission
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export async function snoozePrompt(): Promise<void> {
  const until = new Date(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000)
  await setMeta(SNOOZE_KEY, until.toISOString())
}

/** ¿Procede mostrar el pre-permiso? Permiso aún no decidido y sin snooze. */
export async function shouldPrompt(): Promise<boolean> {
  if (getPermission() !== 'default') return false
  const snoozedUntil = await getMeta<string>(SNOOZE_KEY)
  if (snoozedUntil && new Date(snoozedUntil) > new Date()) return false
  return true
}

export type NotifyOptions = {
  title: string
  body: string
  avatarPath: string | null
  route: string
}

/** Pestaña oculta + permiso → notificación del sistema; si no, toast. */
export async function notify(options: NotifyOptions): Promise<void> {
  const { title, body, avatarPath, route } = options
  if (document.hidden && getPermission() === 'granted') {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        // En Android `new Notification()` truena: siempre vía SW (§10.4).
        await registration.showNotification(title, {
          body,
          icon: avatarPath
            ? import.meta.env.BASE_URL + avatarPath
            : import.meta.env.BASE_URL + 'icons/icon-192.png',
          badge: import.meta.env.BASE_URL + 'icons/icon-192.png',
          data: { route },
          tag: route,
        })
        return
      }
    } catch {
      // cae al toast
    }
  }
  useToastStore.getState().show({ text: body, avatarPath, route })
}

/** Aviso simple dentro de la app (siempre toast). */
export function toast(text: string, avatarPath: string | null, route: string | null) {
  useToastStore.getState().show({ text, avatarPath, route })
}
