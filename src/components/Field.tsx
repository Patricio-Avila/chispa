import type { ReactNode } from 'react'
import './Field.css'

type FieldProps = {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="field">
      <span className="field__label text-label">{label}</span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
