import { create } from 'zustand'
import { chatRepo, userRepo } from '../data/repo'

/** Badge de no leídos en la pestaña Conversaciones. */

type UnreadState = {
  conversations: number
  refresh(): Promise<void>
}

export const useUnreadStore = create<UnreadState>((set) => ({
  conversations: 0,

  async refresh() {
    const user = await userRepo.getLocalUser()
    if (!user) {
      set({ conversations: 0 })
      return
    }
    const total = await chatRepo.unreadTotal(user.id)
    set({ conversations: total })
  },
}))
