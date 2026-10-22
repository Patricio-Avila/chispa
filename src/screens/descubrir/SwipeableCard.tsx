import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './SwipeableCard.css'

export type SwipeDirection = 'skip' | 'match' | 'pasar'

type SwipeableCardProps = {
  children: ReactNode
  onSwipe: (direction: SwipeDirection) => void
  /** Dispara la animación de salida desde los botones. */
  forceDirection?: SwipeDirection | null
  disabled?: boolean
}

const DRAG_START_PX = 8
const RATIO_THRESHOLD = 0.3
const VELOCITY_THRESHOLD = 0.5 // px/ms
const EXIT_MS = 260

/** Sin rotaciones con prefers-reduced-motion (CLAUDE.md §7). */
const MAX_ROTATION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : 12

const LABELS: Record<SwipeDirection, string> = {
  skip: 'SKIP',
  match: 'MATCH',
  pasar: 'PASAR',
}

export function SwipeableCard({
  children,
  onSwipe,
  forceDirection = null,
  disabled = false,
}: SwipeableCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragging = useRef(false)
  const lastDelta = useRef({ dx: 0, dy: 0 })
  const exiting = useRef(false)
  const [label, setLabel] = useState<SwipeDirection | null>(null)

  function setTransform(dx: number, dy: number, withTransition: boolean) {
    const el = ref.current
    if (!el) return
    const width = el.offsetWidth || 320
    const rotation = Math.max(-1, Math.min(1, dx / width)) * MAX_ROTATION
    el.style.transition = withTransition ? `transform ${EXIT_MS}ms ease` : 'none'
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`
  }

  function exit(direction: SwipeDirection) {
    if (exiting.current) return
    exiting.current = true
    setLabel(direction)
    const el = ref.current
    const width = el?.offsetWidth ?? 320
    const height = el?.offsetHeight ?? 480
    const target =
      direction === 'skip'
        ? { dx: -width * 1.5, dy: lastDelta.current.dy }
        : direction === 'match'
          ? { dx: width * 1.5, dy: lastDelta.current.dy }
          : { dx: lastDelta.current.dx, dy: height * 1.2 }
    setTransform(target.dx, target.dy, true)
    window.setTimeout(() => {
      onSwipe(direction)
    }, EXIT_MS)
  }

  useEffect(() => {
    if (forceDirection) exit(forceDirection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceDirection])

  function directionFor(dx: number, dy: number): SwipeDirection | null {
    if (Math.abs(dy) > Math.abs(dx) && dy > 0) return 'pasar'
    if (dx > 0) return 'match'
    if (dx < 0) return 'skip'
    return null
  }

  function onPointerDown(e: React.PointerEvent) {
    if (disabled || exiting.current) return
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() }
    dragging.current = false
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || exiting.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (!dragging.current) {
      if (Math.hypot(dx, dy) < DRAG_START_PX) return
      dragging.current = true
      ref.current?.setPointerCapture(e.pointerId)
    }
    // Hacia arriba la tarjeta se resiste (solo Pasar arrastra hacia abajo).
    const dampedDy = dy < 0 ? dy * 0.2 : dy
    lastDelta.current = { dx, dy: dampedDy }
    setTransform(dx, dampedDy, false)

    const el = ref.current
    const width = el?.offsetWidth ?? 320
    const dir = directionFor(dx, dampedDy)
    const strongEnough =
      dir === 'pasar' ? dampedDy > width * 0.12 : Math.abs(dx) > width * 0.12
    setLabel(dir && strongEnough ? dir : null)
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!start.current || exiting.current) return
    const { dx, dy } = lastDelta.current
    const elapsed = Math.max(1, Date.now() - start.current.t)
    const wasDragging = dragging.current
    start.current = null
    dragging.current = false
    if (!wasDragging) return

    ref.current?.releasePointerCapture(e.pointerId)
    const el = ref.current
    const width = el?.offsetWidth ?? 320
    const height = el?.offsetHeight ?? 480
    const vx = Math.abs(dx) / elapsed
    const vy = Math.abs(dy) / elapsed

    const dir = directionFor(dx, dy)
    if (dir === 'pasar' && (dy > height * RATIO_THRESHOLD || vy > VELOCITY_THRESHOLD)) {
      exit('pasar')
      return
    }
    if (dir === 'match' && (dx > width * RATIO_THRESHOLD || vx > VELOCITY_THRESHOLD)) {
      exit('match')
      return
    }
    if (dir === 'skip' && (-dx > width * RATIO_THRESHOLD || vx > VELOCITY_THRESHOLD)) {
      exit('skip')
      return
    }
    lastDelta.current = { dx: 0, dy: 0 }
    setLabel(null)
    setTransform(0, 0, true)
  }

  function onClickCapture(e: React.MouseEvent) {
    // Un arrastre no debe disparar los taps del carrusel o la info.
    if (Math.hypot(lastDelta.current.dx, lastDelta.current.dy) > DRAG_START_PX) {
      e.preventDefault()
      e.stopPropagation()
      lastDelta.current = { dx: 0, dy: 0 }
    }
  }

  return (
    <div
      ref={ref}
      className="swipeable"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {children}
      {label && (
        <span className={`swipeable__label swipeable__label--${label}`}>
          {LABELS[label]}
        </span>
      )}
    </div>
  )
}
