import { create } from 'zustand'
import { shouldPrompt } from '../services/notifications'

/** Pre-permiso de notificaciones: aparece tras el PRIMER like recibido,
 *  nunca al abrir la app (CLAUDE.md §8.2-17). */

type NotifPromptState = {
  open: boolean
  /** Lo dispara el motor de likes tras el primer like de la sesión. */
  maybeOpen(): Promise<void>
  close(): void
}

export const useNotifPromptStore = create<NotifPromptState>((set) => ({
  open: false,

  async maybeOpen() {
    if (await shouldPrompt()) set({ open: true })
  },

  close() {
    set({ open: false })
  },
}))
