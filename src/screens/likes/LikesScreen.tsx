import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { likeRepo, userRepo, type Liker } from '../../data/repo'
import { useUnreadStore } from '../../app/unreadStore'
import { relativeTime } from '../../services/relativeTime'
import { ageFromBirthdate } from '../registro/age'
import './LikesScreen.css'

const LABELS: Record<Liker['targetKind'], string> = {
  perfil: 'Le gustó tu perfil',
  foto: 'Le gustó tu foto',
  video: 'Le gustó tu video',
}

export function LikesScreen() {
  const navigate = useNavigate()
  const [likers, setLikers] = useState<Liker[] | null>(null)
  const refreshUnread = useUnreadStore((s) => s.refresh)

  useEffect(() => {
    void (async () => {
      const user = await userRepo.getLocalUser()
      if (!user) return
      const list = await likeRepo.listLikers(user.id)
      setLikers(list)
      // Al entrar se marcan como vistos y se limpia el badge (§8.2-11).
      await likeRepo.markAllSeen(user.id)
      void refreshUnread()
    })()
  }, [refreshUnread])

  if (likers === null) return null

  return (
    <div className="likes">
      <h1 className="text-title likes__heading">Likes</h1>

      {likers.length === 0 ? (
        <div className="likes__empty">
          <p className="text-body">Aún no hay likes. Sigue explorando.</p>
        </div>
      ) : (
        <div className="likes__grid">
          {likers.map((liker) => (
            <button
              key={liker.personId}
              type="button"
              className="likes__card"
              onClick={() => navigate(`/persona/${liker.personId}`)}
            >
              <span className="likes__media">
                {liker.avatarPath ? (
                  <img
                    src={import.meta.env.BASE_URL + liker.avatarPath}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <span className="likes__media-empty" aria-hidden="true" />
                )}
                {!liker.seen && (
                  <span className="likes__new text-micro">Nuevo</span>
                )}
              </span>
              <span className="likes__name">
                {liker.name}, {ageFromBirthdate(liker.birthdate)}
              </span>
              <span className="likes__label">{LABELS[liker.targetKind]}</span>
              <span className="likes__time">{relativeTime(liker.likedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
