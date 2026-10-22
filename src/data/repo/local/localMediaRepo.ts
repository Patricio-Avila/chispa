import { query } from '../../db/db'
import type { MediaItem, MediaKind, MediaRepo } from '../types'

type MediaRow = {
  id: string
  user_id: string
  kind: MediaItem['kind']
  position: number
  storage: MediaItem['storage']
  path: string
  poster_path: string | null
  duration_s: number | null
}

function toItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    position: row.position,
    storage: row.storage,
    path: row.path,
    posterPath: row.poster_path,
    durationS: row.duration_s,
  }
}

export const localMediaRepo: MediaRepo = {
  async listByUser(userId: string): Promise<MediaItem[]> {
    const rows = await query<MediaRow>(
      `select id, user_id, kind, position, storage, path, poster_path, duration_s
       from media where user_id = $1 order by kind, position`,
      [userId],
    )
    return rows.map(toItem)
  },

  async add(item: Omit<MediaItem, 'id'>): Promise<MediaItem> {
    const rows = await query<MediaRow>(
      `insert into media (user_id, kind, position, storage, path, poster_path, duration_s)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, user_id, kind, position, storage, path, poster_path, duration_s`,
      [
        item.userId,
        item.kind,
        item.position,
        item.storage,
        item.path,
        item.posterPath,
        item.durationS,
      ],
    )
    return toItem(rows[0]!)
  },

  async remove(id: string): Promise<void> {
    await query('delete from media where id = $1', [id])
  },

  async reorder(
    userId: string,
    kind: MediaKind,
    orderedIds: string[],
  ): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await query(
        'update media set position = $1 where id = $2 and user_id = $3 and kind = $4',
        [i, orderedIds[i], userId, kind],
      )
    }
  },
}
