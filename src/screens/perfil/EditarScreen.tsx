import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import { userRepo, type Gender } from '../../data/repo'
import { INTERESTS } from '../../sim/catalogs.es'
import { toast } from '../../services/notifications'
import { useDeckStore } from '../descubrir/deckStore'
import {
  BIO_MAX_LENGTH,
  validateBio,
  validateInterests,
} from './profileValidation'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Input } from '../../components/Input'
import { Field } from '../../components/Field'
import { DualSlider } from '../../components/DualSlider'
import { Slider } from '../../components/Slider'
import { MediaManager } from '../../components/MediaManager'
import { ageFromBirthdate, isAdult } from '../registro/age'
import './EditarScreen.css'

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'mujer', label: 'Mujer' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'no_binario', label: 'No binario' },
]

export function EditarScreen() {
  const navigate = useNavigate()
  const invalidateDeck = useDeckStore((s) => s.invalidate)

  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [gender, setGender] = useState<Gender>('mujer')
  const [seeking, setSeeking] = useState<Gender[]>([])
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(45)
  const [maxDistanceKm, setMaxDistanceKm] = useState(25)
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [mediaBusy, setMediaBusy] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void userRepo.getLocalUser().then((user) => {
      if (!user) {
        navigate('/', { replace: true })
        return
      }
      setUserId(user.id)
      setName(user.name)
      setBirthdate(user.birthdate)
      setGender(user.gender)
      setSeeking(user.seeking)
      setAgeMin(user.ageMin)
      setAgeMax(user.ageMax)
      setMaxDistanceKm(user.maxDistanceKm)
      setBio(user.bio ?? '')
      setInterests(user.interests)
    })
  }, [navigate])

  if (!userId) return null

  const underage = birthdate !== '' && !isAdult(birthdate)
  const bioError = validateBio(bio)
  const interestsError = interests.length > 0 ? validateInterests(interests) : null
  const valid =
    name.trim().length >= 2 &&
    birthdate !== '' &&
    !underage &&
    seeking.length > 0 &&
    photoCount >= 1 &&
    !mediaBusy &&
    bioError === null &&
    (interests.length === 0 || interestsError === null)

  async function save() {
    if (!valid || !userId) return
    setSaving(true)
    await userRepo.saveDraft({
      name: name.trim(),
      birthdate,
      gender,
      seeking,
      ageMin,
      ageMax,
      maxDistanceKm,
      bio,
    })
    await userRepo.setInterests(userId, interests)
    // Los intereses y preferencias cambian el puntaje y los resaltados.
    invalidateDeck()
    toast('Cambios guardados', null, null)
    navigate('/perfil')
  }

  return (
    <div className="editar">
      <header className="editar__header">
        <button
          type="button"
          className="editar__back"
          aria-label="Volver"
          onClick={() => navigate('/perfil')}
        >
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        <h1 className="text-title">Editar perfil</h1>
      </header>

      <Field label="Fotos y video">
        <MediaManager
          userId={userId}
          onStatusChange={({ photoCount: count, busy }) => {
            setPhotoCount(count)
            setMediaBusy(busy)
          }}
        />
      </Field>

      <Field label="Nombre">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
      </Field>

      <Field
        label="Fecha de nacimiento"
        error={underage ? 'Chispa es solo para mayores de 18 años.' : undefined}
        hint={
          birthdate && !underage ? `Tienes ${ageFromBirthdate(birthdate)} años` : undefined
        }
      >
        <Input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>

      <Field
        label={`Bio (${bio.length}/${BIO_MAX_LENGTH})`}
        error={bioError ?? undefined}
      >
        <textarea
          className="editar__bio"
          value={bio}
          maxLength={BIO_MAX_LENGTH}
          rows={4}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntales algo de ti"
          aria-label="Bio"
        />
      </Field>

      <Field
        label={`Intereses (${interests.length})`}
        hint="Elige de 3 a 8"
        error={interestsError ?? undefined}
      >
        <div className="editar__chips">
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

      <Field label="Género">
        <div className="editar__chips" role="radiogroup" aria-label="Género">
          {GENDER_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={gender === option.value}
              onClick={() => setGender(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="¿A quién buscas?">
        <div className="editar__chips" role="group" aria-label="A quién buscas">
          {GENDER_OPTIONS.map((option) => {
            const selected = seeking.includes(option.value)
            return (
              <Chip
                key={option.value}
                selected={selected}
                onClick={() =>
                  setSeeking((prev) =>
                    selected
                      ? prev.filter((g) => g !== option.value)
                      : [...prev, option.value],
                  )
                }
              >
                {option.label}
              </Chip>
            )
          })}
        </div>
      </Field>

      <Field label={`Rango de edad: ${ageMin}–${ageMax} años`}>
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

      <Field label={`Distancia máxima: ${maxDistanceKm} km`}>
        <Slider
          min={5}
          max={100}
          step={5}
          value={maxDistanceKm}
          onChange={setMaxDistanceKm}
          ariaLabel="Distancia máxima en kilómetros"
        />
      </Field>

      <Button onClick={() => void save()} disabled={!valid || saving}>
        {saving ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}
