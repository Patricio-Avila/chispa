import './Slider.css'

type SliderProps = {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  ariaLabel: string
}

export function Slider({ min, max, step = 1, value, onChange, ariaLabel }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="slider">
      <div className="slider__track" aria-hidden="true">
        <div className="slider__fill" style={{ left: 0, width: `${pct}%` }} />
      </div>
      <input
        type="range"
        className="slider__input slider__input--single"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
