import { query, withTransaction } from '../../db/db'
import type { LikeRepo, Liker, LikeTargetKind } from '../types'

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

  async listLikers(userId: string): Promise<Liker[]> {
    const rows = await query<{
      person_id: string
      name: string
      birthdate: string
      avatar_path: string | null
      media_kind: string | null
      liked_at: string
      seen: boolean
    }>(
      `select d.id as person_id, d.name, d.birthdate::text as birthdate,
              av.path as avatar_path,
              md.kind as media_kind,
              last_like.created_at::text as liked_at,
              last_like.seen
       from (
         select distinct on (from_user) from_user, media_id, created_at, seen
         from media_like
         where to_user = $1
         order by from_user, created_at desc
       ) last_like
       join app_user d on d.id = last_like.from_user
       left join media md on md.id = last_like.media_id
       left join lateral (
         select path from media
         where user_id = d.id and kind = 'avatar'
         order by position limit 1
       ) av on true
       order by last_like.seen asc, last_like.created_at desc`,
      [userId],
    )
    return rows.map((row) => {
      const targetKind: LikeTargetKind =
        row.media_kind === 'video'
          ? 'video'
          : row.media_kind === 'photo'
            ? 'foto'
            : 'perfil'
      return {
        personId: row.person_id,
        name: row.name,
        birthdate: row.birthdate.slice(0, 10),
        avatarPath: row.avatar_path,
        targetKind,
        likedAt: row.liked_at,
        seen: row.seen,
      }
    })
  },

  async markAllSeen(userId: string): Promise<void> {
    await query('update media_like set seen = true where to_user = $1 and not seen', [
      userId,
    ])
  },

  async unseenCount(userId: string): Promise<number> {
    const rows = await query<{ total: number }>(
      `select count(distinct from_user)::int as total
       from media_like where to_user = $1 and not seen`,
      [userId],
    )
    return rows[0]?.total ?? 0
  },
}
