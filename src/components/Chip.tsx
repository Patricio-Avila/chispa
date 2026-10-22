import type { ButtonHTMLAttributes } from 'react'
import './Chip.css'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export function Chip({ selected = false, className, ...rest }: ChipProps) {
  const classes = ['chip', selected && 'chip--selected', className]
    .filter(Boolean)
    .join(' ')
  return <button type="button" aria-pressed={selected} className={classes} {...rest} />
}
