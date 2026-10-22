import type { InputHTMLAttributes } from 'react'
import './Input.css'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...rest }: InputProps) {
  const classes = ['input', className].filter(Boolean).join(' ')
  return <input className={classes} {...rest} />
}
