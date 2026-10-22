import { X, ArrowsDownUp, Heart } from '@phosphor-icons/react'
import './ActionBar.css'

type ActionBarProps = {
  onSkip: () => void
  onPasar: () => void
  onMatch: () => void
  disabled?: boolean
}

export function ActionBar({ onSkip, onPasar, onMatch, disabled }: ActionBarProps) {
  return (
    <div className="action-bar">
      <button
        type="button"
        className="action-bar__btn action-bar__btn--skip"
        aria-label="Skip"
        onClick={onSkip}
        disabled={disabled}
      >
        <X size={22} weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="action-bar__btn action-bar__btn--pasar"
        aria-label="Pasar"
        onClick={onPasar}
        disabled={disabled}
      >
        <ArrowsDownUp size={20} weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="action-bar__btn action-bar__btn--match"
        aria-label="Match"
        onClick={onMatch}
        disabled={disabled}
      >
        <Heart size={26} weight="regular" aria-hidden="true" />
      </button>
    </div>
  )
}
