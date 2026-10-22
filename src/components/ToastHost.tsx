import { useNavigate } from 'react-router-dom'
import { useToastStore } from '../app/toastStore'
import './ToastHost.css'

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  const navigate = useNavigate()

  if (toasts.length === 0) return null

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="toast"
          onClick={() => {
            dismiss(toast.id)
            if (toast.route) navigate(toast.route)
          }}
        >
          {toast.avatarPath && (
            <img
              className="toast__avatar"
              src={import.meta.env.BASE_URL + toast.avatarPath}
              alt=""
            />
          )}
          <span className="toast__text">{toast.text}</span>
        </button>
      ))}
    </div>
  )
}
