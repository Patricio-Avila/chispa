import './Slider.css'

type DualSliderProps = {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (valueMin: number, valueMax: number) => void
  ariaLabelMin: string
  ariaLabelMax: string
}

/** Slider doble sin dependencias: dos <input type="range"> superpuestos.
 *  Los pulgares reciben el puntero; las pistas no (pointer-events). */
export function DualSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  ariaLabelMin,
  ariaLabelMax,
}: DualSliderProps) {
  const lowPct = ((valueMin - min) / (max - min)) * 100
  const highPct = ((valueMax - min) / (max - min)) * 100

  return (
    <div className="slider slider--dual">
      <div className="slider__track" aria-hidden="true">
        <div
          className="slider__fill"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
      </div>
      <input
        type="range"
        className="slider__input"
        min={min}
        max={max}
        value={valueMin}
        aria-label={ariaLabelMin}
        onChange={(e) =>
          onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)
        }
      />
      <input
        type="range"
        className="slider__input"
        min={min}
        max={max}
        value={valueMax}
        aria-label={ariaLabelMax}
        onChange={(e) =>
          onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))
        }
      />
    </div>
  )
}
