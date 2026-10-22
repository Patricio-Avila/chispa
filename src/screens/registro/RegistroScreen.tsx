import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userRepo, type Gender, type UserDraft } from '../../data/repo'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Input } from '../../components/Input'
import { Field } from '../../components/Field'
import { DualSlider } from '../../components/DualSlider'
import { Slider } from '../../components/Slider'
import { ageFromBirthdate, isAdult } from './age'
import './RegistroScreen.css'

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'mujer', label: 'Mujer' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'no_binario', label: 'No binario' },
]

type FormState = {
  name: string
  birthdate: string
  gender: Gender | null
  seeking: Gender[]
  ageMin: number
  ageMax: number
  maxDistanceKm: number
}

const INITIAL: FormState = {
  name: '',
  birthdate: '',
  gender: null,
  seeking: [],
  ageMin: 18,
  ageMax: 45,
  maxDistanceKm: 25,
}

export function RegistroScreen() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [hydrated, setHydrated] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)

  // Rehidratar el borrador guardado (recarga a mitad del registro).
  useEffect(() => {
    void userRepo.getLocalUser().then((user) => {
      if (user) {
        setForm({
          name: user.name,
          birthdate: user.birthdate === '2000-01-01' && !user.name ? '' : user.birthdate,
          gender: user.name ? user.gender : null,
          seeking: user.seeking,
          ageMin: user.ageMin,
          ageMax: user.ageMax,
          maxDistanceKm: user.maxDistanceKm,
        })
      }
      setHydrated(true)
    })
  }, [])

  const underage = form.birthdate !== '' && !isAdult(form.birthdate)
  const age = form.birthdate ? ageFromBirthdate(form.birthdate) : null

  const valid =
    form.name.trim().length >= 2 &&
    form.birthdate !== '' &&
    !underage &&
    form.gender !== null &&
    form.seeking.length > 0

  function update(patch: Partial<FormState>) {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      scheduleSave(next)
      return next
    })
  }

  // Guardar borrador en cada cambio (con un pequeño debounce).
  // A menores de 18 no se les guarda nada (caso borde CLAUDE.md §8.4).
  function scheduleSave(state: FormState) {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      if (state.birthdate !== '' && !isAdult(state.birthdate)) return
      const draft: UserDraft = {
        name: state.name || undefined,
        birthdate: state.birthdate || undefined,
        gender: state.gender ?? undefined,
        seeking: state.seeking.length > 0 ? state.seeking : undefined,
        ageMin: state.ageMin,
        ageMax: state.ageMax,
        maxDistanceKm: state.maxDistanceKm,
      }
      void userRepo.saveDraft(draft)
    }, 400)
  }

  if (!hydrated) return null

  return (
    <div className="registro">
      <header className="registro__header">
        <h1 className="text-title">Cuéntanos de ti</h1>
        <p className="registro__sub">Solo lo esencial para empezar.</p>
      </header>

      <form
        className="registro__form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          window.clearTimeout(saveTimer.current)
          void userRepo
            .saveDraft({
              name: form.name,
              birthdate: form.birthdate,
              gender: form.gender!,
              seeking: form.seeking,
              ageMin: form.ageMin,
              ageMax: form.ageMax,
              maxDistanceKm: form.maxDistanceKm,
            })
            .then(() => userRepo.setOnboardingStep('medios'))
            .then(() => navigate('/medios'))
        }}
      >
        <Field label="Nombre">
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Tu nombre"
            autoComplete="given-name"
            maxLength={40}
          />
        </Field>

        <Field
          label="Fecha de nacimiento"
          error={
            underage
              ? 'Chispa es solo para mayores de 18 años. No guardamos tus datos.'
              : undefined
          }
          hint={age !== null && !underage ? `Tienes ${age} años` : undefined}
        >
          <Input
            type="date"
            value={form.birthdate}
            onChange={(e) => update({ birthdate: e.target.value })}
            max={new Date().toISOString().slice(0, 10)}
          />
        </Field>

        <Field label="Género">
          <div className="registro__chips" role="radiogroup" aria-label="Género">
            {GENDER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={form.gender === option.value}
                onClick={() => update({ gender: option.value })}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="¿A quién buscas?" hint="Puedes elegir más de una opción">
          <div className="registro__chips" role="group" aria-label="A quién buscas">
            {GENDER_OPTIONS.map((option) => {
              const selected = form.seeking.includes(option.value)
              return (
                <Chip
                  key={option.value}
                  selected={selected}
                  onClick={() =>
                    update({
                      seeking: selected
                        ? form.seeking.filter((g) => g !== option.value)
                        : [...form.seeking, option.value],
                    })
                  }
                >
                  {option.label}
                </Chip>
              )
            })}
          </div>
        </Field>

        <Field label={`Rango de edad: ${form.ageMin}–${form.ageMax} años`}>
          <DualSlider
            min={18}
            max={60}
            valueMin={form.ageMin}
            valueMax={form.ageMax}
            onChange={(ageMin, ageMax) => update({ ageMin, ageMax })}
            ariaLabelMin="Edad mínima"
            ariaLabelMax="Edad máxima"
          />
        </Field>

        <Field label={`Distancia máxima: ${form.maxDistanceKm} km`}>
          <Slider
            min={5}
            max={100}
            step={5}
            value={form.maxDistanceKm}
            onChange={(maxDistanceKm) => update({ maxDistanceKm })}
            ariaLabel="Distancia máxima en kilómetros"
          />
        </Field>

        <Button type="submit" disabled={!valid}>
          Continuar
        </Button>
      </form>
    </div>
  )
}
