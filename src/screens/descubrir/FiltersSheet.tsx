import { useEffect, useState } from 'react'
import { userRepo } from '../../data/repo'
import { INTERESTS } from '../../sim/catalogs.es'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Field } from '../../components/Field'
import { DualSlider } from '../../components/DualSlider'
import { Slider } from '../../components/Slider'
import { useDeckStore } from './deckStore'

type FiltersSheetProps = {
  open: boolean
  onClose: () => void
}

export function FiltersSheet({ open, onClose }: FiltersSheetProps) {
  const storeFilters = useDeckStore((s) => s.filters)
  const setFilters = useDeckStore((s) => s.setFilters)
  const load = useDeckStore((s) => s.load)

  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(45)
  const [distance, setDistance] = useState(25)
  const [interests, setInterests] = useState<string[]>([])
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (!open) return
    setInterests(storeFilters.interests)
    void userRepo.getLocalUser().then((user) => {
      if (user) {
        setAgeMin(user.ageMin)
        setAgeMax(user.ageMax)
        setDistance(user.maxDistanceKm)
      }
    })
  }, [open, storeFilters])

  async function apply() {
    setApplying(true)
    await userRepo.saveDraft({ ageMin, ageMax, maxDistanceKm: distance })
    await setFilters({ interests })
    await load()
    setApplying(false)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Filtros">
      <Field label={`Edad: ${ageMin}–${ageMax} años`}>
        <DualSlider
          min={18}
          max={60}
          valueMin={ageMin}
          valueMax={ageMax}
          onChange={(min, max) => {
            setAgeMin(min)
            setAgeMax(max)
          }}
          ariaLabelMin="Edad mínima"
          ariaLabelMax="Edad máxima"
        />
      </Field>
      <Field label={`Distancia máxima: ${distance} km`}>
        <Slider
          min={5}
          max={100}
          step={5}
          value={distance}
          onChange={setDistance}
          ariaLabel="Distancia máxima en kilómetros"
        />
      </Field>
      <Field label="Intereses" hint="Muestra solo gente con estos intereses">
        <div className="filters-sheet__chips">
          {INTERESTS.map((interest) => {
            const selected = interests.includes(interest)
            return (
              <Chip
                key={interest}
                selected={selected}
                onClick={() =>
                  setInterests((prev) =>
                    selected
                      ? prev.filter((i) => i !== interest)
                      : [...prev, interest],
                  )
                }
              >
                {interest}
              </Chip>
            )
          })}
        </div>
      </Field>
      <Button onClick={() => void apply()} disabled={applying}>
        {applying ? 'Aplicando…' : 'Aplicar filtros'}
      </Button>
    </BottomSheet>
  )
}
