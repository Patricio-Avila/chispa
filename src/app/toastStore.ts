import { create } from 'zustand'

/** Avisos emergentes dentro de la app (CLAUDE.md §10.4): 4 s, con avatar. */

export type Toast = {
  id: number
  text: string
  avatarPath: string | null
  route: string | null
}

const TOAST_MS = 4000
let nextId = 1

type ToastState = {
  toasts: Toast[]
  show(toast: Omit<Toast, 'id'>): void
  dismiss(id: number): void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show(toast) {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, TOAST_MS)
  },

  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
