import { useNotifPromptStore } from '../app/notifPromptStore'
import { requestPermission, snoozePrompt } from '../services/notifications'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

export function NotifPermissionSheet() {
  const open = useNotifPromptStore((s) => s.open)
  const close = useNotifPromptStore((s) => s.close)

  return (
    <BottomSheet open={open} onClose={() => void snoozePrompt().then(close)} title="No te pierdas nada">
      <p className="text-body" style={{ color: 'var(--color-text-muted)' }}>
        Te avisamos cuando alguien te dé like o te escriba.
      </p>
      <Button
        onClick={() => {
          void requestPermission().finally(close)
        }}
      >
        Activar
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          void snoozePrompt().then(close)
        }}
      >
        Ahora no
      </Button>
    </BottomSheet>
  )
}
