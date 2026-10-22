import { create } from 'zustand'
import { chatRepo, likeRepo, userRepo } from '../data/repo'

/** Badges de la TabBar: Likes y Conversaciones (CLAUDE.md §7). */

type UnreadState = {
  conversations: number
  likes: number
  refresh(): Promise<void>
}

export const useUnreadStore = create<UnreadState>((set) => ({
  conversations: 0,
  likes: 0,

  async refresh() {
    const user = await userRepo.getLocalUser()
    if (!user) {
      set({ conversations: 0, likes: 0 })
      return
    }
    const [conversations, likes] = await Promise.all([
      chatRepo.unreadTotal(user.id),
      likeRepo.unseenCount(user.id),
    ])
    set({ conversations, likes })
  },
}))
