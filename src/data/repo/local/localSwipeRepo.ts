import { query } from '../../db/db'
import type { SwipeAction, SwipeRepo } from '../types'

export const localSwipeRepo: SwipeRepo = {
  async record(
    fromUser: string,
    toUser: string,
    action: SwipeAction,
  ): Promise<void> {
    await query(
      'insert into swipe (from_user, to_user, action) values ($1, $2, $3)',
      [fromUser, toUser, action],
    )
  },
}
