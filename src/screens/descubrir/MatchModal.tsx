import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatRepo, mediaRepo, userRepo } from '../../data/repo'
import { loadMediaBlob } from '../../services/media'
import { Button } from '../../components/Button'
import { quickRepliesForNode, personalityOf, sendAndReply } from '../chat/chatFlow'
import type { LastMatch } from './deckStore'
import './MatchModal.css'

type MatchModalProps = {
  match: LastMatch
  onClose: () => void
}

export function MatchModal({ match, onClose }: MatchModalProps) {
  const navigate = useNavigate()
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const personality = personalityOf(match.card)
  const suggestions = quickRepliesForNode(personality, 'saludo').slice(0, 3)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    void (async () => {
      const user = await userRepo.getLocalUser()
      if (user) {
        const media = await mediaRepo.listByUser(user.id)
        const photo = media.find((m) => m.kind === 'photo')
        if (photo) {
          const blob = await loadMediaBlob({
            storage: photo.storage as 'opfs' | 'idb',
            path: photo.path,
          })
          if (blob && !cancelled) {
            objectUrl = URL.createObjectURL(blob)
            setUserPhotoUrl(objectUrl)
          }
        }
      }
      const partnerMedia = await mediaRepo.listByUser(match.card.id)
      const avatar = partnerMedia.find((m) => m.kind === 'avatar')
      if (avatar && !cancelled) {
        setPartnerAvatarUrl(import.meta.env.BASE_URL + avatar.path)
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [match])

  async function openChat(suggestionIndex: number | null) {
    if (busy) return
    setBusy(true)
    const user = await userRepo.getLocalUser()
    if (!user) return
    if (suggestionIndex !== null) {
      const suggestion = suggestions[suggestionIndex]!
      await sendAndReply({
        matchId: match.matchId,
        user: { id: user.id, name: user.name, interests: user.interests },
        partner: {
          id: match.card.id,
          name: match.card.name,
          personality,
          interests: match.card.interests,
          areaLabel: match.card.areaLabel,
        },
        text: suggestion.text,
        input: { type: 'quickReply', next: suggestion.next },
        currentNode: 'saludo',
        turn: 0,
      })
    } else {
      await chatRepo.setState(match.matchId, 'saludo')
    }
    onClose()
    navigate(`/chat/${match.matchId}`)
  }

  return (
    <div className="match-modal" role="dialog" aria-modal="true" aria-label="Es un match">
      <div className="match-modal__content">
        <div className="match-modal__avatars" aria-hidden="true">
          <span className="match-modal__avatar match-modal__avatar--user">
            {userPhotoUrl ? <img src={userPhotoUrl} alt="" /> : <span className="match-modal__placeholder" />}
          </span>
          <span className="match-modal__avatar match-modal__avatar--partner">
            {partnerAvatarUrl ? <img src={partnerAvatarUrl} alt="" /> : <span className="match-modal__placeholder" />}
          </span>
        </div>
        <h1 className="text-display match-modal__title">¡Es un match!</h1>
        <p className="match-modal__sub">
          A {match.card.name} también le gustaste. Rompe el hielo:
        </p>
        <div className="match-modal__suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.text}
              type="button"
              className="match-modal__suggestion"
              disabled={busy}
              onClick={() => void openChat(index)}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
        <div className="match-modal__actions">
          <Button onClick={() => void openChat(null)} disabled={busy}>
            Enviar mensaje
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Seguir explorando
          </Button>
        </div>
      </div>
    </div>
  )
}
