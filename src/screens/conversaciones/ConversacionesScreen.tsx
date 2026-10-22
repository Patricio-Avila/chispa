import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatRepo, userRepo, type ConversationSummary } from '../../data/repo'
import { useUnreadStore } from '../../app/unreadStore'
import { parseDbDate } from '../../services/relativeTime'
import './ConversacionesScreen.css'

function timeLabel(iso: string): string {
  const date = parseDbDate(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function Avatar({ conversation }: { conversation: ConversationSummary }) {
  if (conversation.partnerAvatarPath) {
    return (
      <img
        className="convos__avatar"
        src={import.meta.env.BASE_URL + conversation.partnerAvatarPath}
        alt=""
      />
    )
  }
  return <span className="convos__avatar convos__avatar--empty" aria-hidden="true" />
}

export function ConversacionesScreen() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null)
  const refreshUnread = useUnreadStore((s) => s.refresh)

  useEffect(() => {
    void (async () => {
      const user = await userRepo.getLocalUser()
      if (!user) return
      setConversations(await chatRepo.listConversations(user.id))
      void refreshUnread()
    })()
  }, [refreshUnread])

  if (conversations === null) return null

  const fresh = conversations.filter((c) => c.lastMessage === null)
  const started = conversations.filter((c) => c.lastMessage !== null)

  return (
    <div className="convos">
      <h1 className="text-title convos__heading">Conversaciones</h1>

      {conversations.length === 0 && (
        <div className="convos__empty">
          <p className="text-body">
            Cuando hagas match, tus conversaciones aparecen aquí.
          </p>
        </div>
      )}

      {fresh.length > 0 && (
        <section className="convos__section">
          <h2 className="text-label convos__subheading">Nuevos matches</h2>
          <div className="convos__new-row">
            {fresh.map((conversation) => (
              <button
                key={conversation.matchId}
                type="button"
                className="convos__new-item"
                onClick={() => navigate(`/chat/${conversation.matchId}`)}
              >
                <Avatar conversation={conversation} />
                <span className="text-micro">{conversation.partnerName}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {started.length > 0 && (
        <section className="convos__section">
          {fresh.length > 0 && (
            <h2 className="text-label convos__subheading">Mensajes</h2>
          )}
          <ul className="convos__list">
            {started.map((conversation) => (
              <li key={conversation.matchId}>
                <button
                  type="button"
                  className="convos__row"
                  onClick={() => navigate(`/chat/${conversation.matchId}`)}
                >
                  <Avatar conversation={conversation} />
                  <span className="convos__row-main">
                    <span className="convos__row-top">
                      <span className="convos__name">{conversation.partnerName}</span>
                      <span className="convos__time">
                        {conversation.lastMessageAt ? timeLabel(conversation.lastMessageAt) : ''}
                      </span>
                    </span>
                    <span
                      className={`convos__preview${conversation.unreadCount > 0 ? ' convos__preview--unread' : ''}`}
                    >
                      {conversation.lastMessage}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="convos__dot" aria-label="Mensajes sin leer" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
