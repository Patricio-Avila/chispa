import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CaretLeft, PaperPlaneRight } from '@phosphor-icons/react'
import {
  chatRepo,
  userRepo,
  type ChatMessage,
  type ConversationSummary,
} from '../../data/repo'
import { useUnreadStore } from '../../app/unreadStore'
import {
  isChatNode,
  personalityOf,
  quickRepliesForNode,
  sendAndReply,
  type ChatPartner,
  type ChatUser,
} from './chatFlow'
import type { ChatInput, ChatNodeName, QuickReply } from '../../sim/chatbot/engine'
import './ChatScreen.css'

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function ChatScreen() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const refreshUnread = useUnreadStore((s) => s.refresh)

  const [user, setUser] = useState<ChatUser | null>(null)
  const [conversation, setConversation] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [node, setNode] = useState<ChatNodeName>('saludo')
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!matchId) return
    let cancelled = false
    void (async () => {
      const localUser = await userRepo.getLocalUser()
      if (!localUser) {
        navigate('/', { replace: true })
        return
      }
      const conversations = await chatRepo.listConversations(localUser.id)
      const current = conversations.find((c) => c.matchId === matchId)
      if (!current) {
        navigate('/conversaciones', { replace: true })
        return
      }
      const history = await chatRepo.messages(matchId)
      await chatRepo.markRead(matchId, localUser.id)
      void refreshUnread()
      const savedNode = await chatRepo.getState(matchId)
      const currentNode: ChatNodeName = isChatNode(savedNode) ? savedNode : 'saludo'
      if (cancelled) return
      setUser({
        id: localUser.id,
        name: localUser.name,
        interests: localUser.interests,
      })
      setConversation(current)
      setMessages(history)
      setNode(currentNode)
      setQuickReplies(
        quickRepliesForNode(personalityOf(current), currentNode),
      )
    })()
    return () => {
      cancelled = true
      window.clearTimeout(typingTimer.current)
    }
  }, [matchId, navigate, refreshUnread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' })
  }, [messages, typing])

  if (!matchId || !conversation || !user) return null

  const partner: ChatPartner = {
    id: conversation.partnerId,
    name: conversation.partnerName,
    personality: personalityOf(conversation),
    interests: conversation.partnerInterests,
    areaLabel: conversation.partnerAreaLabel,
  }

  async function send(text: string, input: ChatInput) {
    if (typing || text.trim() === '') return
    setDraft('')
    setQuickReplies([])
    const result = await sendAndReply({
      matchId: matchId!,
      user: user!,
      partner,
      text: text.trim(),
      input,
      currentNode: node,
      turn: messages.length,
    })
    setMessages((prev) => [...prev, result.userMessage])
    setNode(result.reply.nextNode)
    setTyping(true)
    const delay = REDUCED_MOTION ? 50 : result.reply.delayMs
    typingTimer.current = window.setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, result.dummyMessage])
      setQuickReplies(result.reply.quickReplies)
      void chatRepo.markRead(matchId!, user!.id).then(() => refreshUnread())
    }, delay)
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <button
          type="button"
          className="chat__back"
          aria-label="Volver"
          onClick={() => navigate('/conversaciones')}
        >
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        {conversation.partnerAvatarPath && (
          <img
            className="chat__avatar"
            src={import.meta.env.BASE_URL + conversation.partnerAvatarPath}
            alt=""
          />
        )}
        <span className="chat__name">{conversation.partnerName}</span>
        <button
          type="button"
          className="chat__profile-link"
          onClick={() => navigate(`/persona/${conversation.partnerId}`)}
        >
          Ver perfil
        </button>
      </header>

      <div className="chat__messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat__bubble ${
              message.sender === user.id
                ? 'chat__bubble--mine'
                : 'chat__bubble--theirs'
            }`}
          >
            {message.body}
          </div>
        ))}
        {typing && (
          <div className="chat__bubble chat__bubble--theirs chat__typing" aria-label="Escribiendo">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat__composer">
        {quickReplies.length > 0 && !typing && (
          <div className="chat__quick-replies">
            {quickReplies.map((reply) => (
              <button
                key={reply.text}
                type="button"
                className="chat__quick-reply"
                onClick={() =>
                  void send(reply.text, { type: 'quickReply', next: reply.next })
                }
              >
                {reply.text}
              </button>
            ))}
          </div>
        )}
        <form
          className="chat__input-row"
          onSubmit={(e) => {
            e.preventDefault()
            void send(draft, { type: 'freeText', text: draft })
          }}
        >
          <input
            className="chat__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribe un mensaje"
            aria-label="Mensaje"
            maxLength={300}
          />
          <button
            type="submit"
            className="chat__send"
            aria-label="Enviar"
            disabled={typing || draft.trim() === ''}
          >
            <PaperPlaneRight size={20} weight="fill" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}
