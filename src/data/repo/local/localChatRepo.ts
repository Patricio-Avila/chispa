import { query } from '../../db/db'
import type { ChatMessage, ChatRepo, ConversationSummary } from '../types'

type MessageRow = {
  id: string
  match_id: string
  sender: string
  body: string
  created_at: string
  read_at: string | null
}

function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    matchId: row.match_id,
    sender: row.sender,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  }
}

export const localChatRepo: ChatRepo = {
  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const rows = await query<{
      match_id: string
      partner_id: string
      partner_name: string
      personality: string | null
      partner_interests: string[]
      partner_area: string | null
      avatar_path: string | null
      last_body: string | null
      last_at: string | null
      last_sender: string | null
      unread: number
    }>(
      `select m.id as match_id,
              d.id as partner_id,
              d.name as partner_name,
              d.personality,
              d.interests as partner_interests,
              d.area_label as partner_area,
              av.path as avatar_path,
              lm.body as last_body,
              lm.created_at::text as last_at,
              lm.sender as last_sender,
              coalesce(u.unread, 0)::int as unread
       from match m
       join app_user d
         on d.id = case when m.user_a = $1 then m.user_b else m.user_a end
       left join lateral (
         select body, created_at, sender from message
         where match_id = m.id
         order by created_at desc limit 1
       ) lm on true
       left join (
         select match_id, count(*) as unread
         from message
         where read_at is null and sender <> $1
         group by match_id
       ) u on u.match_id = m.id
       left join lateral (
         select path from media
         where user_id = d.id and kind = 'avatar'
         order by position limit 1
       ) av on true
       where m.user_a = $1 or m.user_b = $1
       order by lm.created_at desc nulls last, m.created_at desc`,
      [userId],
    )
    return rows.map((row) => ({
      matchId: row.match_id,
      partnerId: row.partner_id,
      partnerName: row.partner_name,
      partnerAvatarPath: row.avatar_path,
      personality: row.personality,
      partnerInterests: row.partner_interests,
      partnerAreaLabel: row.partner_area ?? 'Cerca de ti',
      lastMessage: row.last_body,
      lastMessageAt: row.last_at,
      lastSender: row.last_sender,
      unreadCount: row.unread,
    }))
  },

  async messages(matchId: string): Promise<ChatMessage[]> {
    const rows = await query<MessageRow>(
      `select id, match_id, sender, body, created_at::text as created_at,
              read_at::text as read_at
       from message where match_id = $1 order by created_at`,
      [matchId],
    )
    return rows.map(toMessage)
  },

  async send(matchId: string, sender: string, body: string): Promise<ChatMessage> {
    const rows = await query<MessageRow>(
      `insert into message (match_id, sender, body)
       values ($1, $2, $3)
       returning id, match_id, sender, body, created_at::text as created_at,
                 read_at::text as read_at`,
      [matchId, sender, body],
    )
    return toMessage(rows[0]!)
  },

  async markRead(matchId: string, userId: string): Promise<void> {
    await query(
      `update message set read_at = now()
       where match_id = $1 and sender <> $2 and read_at is null`,
      [matchId, userId],
    )
  },

  async getState(matchId: string): Promise<string | null> {
    const rows = await query<{ node: string }>(
      'select node from chat_state where match_id = $1',
      [matchId],
    )
    return rows[0]?.node ?? null
  },

  async setState(matchId: string, node: string): Promise<void> {
    await query(
      `insert into chat_state (match_id, node, updated_at)
       values ($1, $2, now())
       on conflict (match_id) do update set node = excluded.node, updated_at = now()`,
      [matchId, node],
    )
  },

  async unreadTotal(userId: string): Promise<number> {
    const rows = await query<{ total: number }>(
      `select count(*)::int as total
       from message msg
       join match m on m.id = msg.match_id
       where (m.user_a = $1 or m.user_b = $1)
         and msg.sender <> $1
         and msg.read_at is null`,
      [userId],
    )
    return rows[0]?.total ?? 0
  },
}
