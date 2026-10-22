import { query, withTransaction } from '../../db/db'
import type { LikeRepo } from '../types'

export const localLikeRepo: LikeRepo = {
  async addProfileLikes(fromUsers: string[], toUser: string): Promise<void> {
    if (fromUsers.length === 0) return
    await withTransaction(async (txQuery) => {
      for (const fromUser of fromUsers) {
        await txQuery(
          'insert into media_like (from_user, to_user, media_id) values ($1, $2, null)',
          [fromUser, toUser],
        )
      }
    })
  },

  async addMediaLike(
    fromUser: string,
    toUser: string,
    mediaId: string | null,
  ): Promise<void> {
    await query(
      'insert into media_like (from_user, to_user, media_id) values ($1, $2, $3)',
      [fromUser, toUser, mediaId],
    )
  },

  async hasLikedMe(dummyId: string, userId: string): Promise<boolean> {
    const rows = await query<{ one: number }>(
      'select 1 as one from media_like where from_user = $1 and to_user = $2 limit 1',
      [dummyId, userId],
    )
    return rows.length > 0
  },

  async likersOf(userId: string): Promise<string[]> {
    const rows = await query<{ from_user: string }>(
      'select distinct from_user from media_like where to_user = $1',
      [userId],
    )
    return rows.map((row) => row.from_user)
  },
}
