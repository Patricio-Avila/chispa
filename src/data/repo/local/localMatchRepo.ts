import { query } from '../../db/db'
import type { MatchRepo } from '../types'

function ordered(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export const localMatchRepo: MatchRepo = {
  async exists(userA: string, userB: string): Promise<boolean> {
    const [a, b] = ordered(userA, userB)
    const rows = await query<{ one: number }>(
      'select 1 as one from match where user_a = $1 and user_b = $2 limit 1',
      [a, b],
    )
    return rows.length > 0
  },

  async create(userA: string, userB: string): Promise<string> {
    const [a, b] = ordered(userA, userB)
    const rows = await query<{ id: string }>(
      `insert into match (user_a, user_b) values ($1, $2)
       on conflict (user_a, user_b) do update set user_a = excluded.user_a
       returning id`,
      [a, b],
    )
    return rows[0]!.id
  },
}
