import { query } from '../../db/db'
import type { NotificationRepo, NotificationType } from '../types'

export const localNotificationRepo: NotificationRepo = {
  async add(
    userId: string,
    type: NotificationType,
    payload: unknown,
  ): Promise<void> {
    await query(
      'insert into notification (user_id, type, payload) values ($1, $2, $3)',
      [userId, type, JSON.stringify(payload ?? {})],
    )
  },
}
