/** Generación determinista de dummies por zona (CLAUDE.md §10.1).
 *  Función pura: la inserción en la base vive en DiscoveryRepo. */

import {
  floatBetween,
  intBetween,
  mulberry32,
  pick,
  pickMany,
  seedForZone,
  type Rng,
} from './prng'
import { BIO_TEMPLATES, INTERESTS, NAMES, PERSONALITIES } from './catalogs.es'
import { AVATAR_IMAGES } from './avatars'
import type { Gender } from '../data/repo/types'

export const SEED_VERSION = 1
export const DUMMIES_PER_ZONE = 40
const VIDEO_RATIO = 0.3

export type ZoneInput = {
  zoneKey: string
  lat: number
  lng: number
  radiusKm: number
}

export type DummySpec = {
  name: string
  gender: Gender
  seeking: Gender[]
  age: number
  birthdate: string
  ageMin: number
  ageMax: number
  interests: string[]
  bio: string
  personality: (typeof PERSONALITIES)[number]
  pickiness: number
  avatarSeed: number
  /** Ruta (relativa a BASE_URL) de la ilustración del dummy. */
  avatarPath: string
  lat: number
  lng: number
  areaLabel: string
  zoneKey: string
  /** Índice en videos.json, o null si este dummy no lleva video. */
  videoIndex: number | null
}

const GENDERS: Gender[] = ['mujer', 'hombre', 'no_binario']

function pickGender(rng: Rng): Gender {
  const roll = rng()
  if (roll < 0.45) return 'mujer'
  if (roll < 0.9) return 'hombre'
  return 'no_binario'
}

function pickSeeking(rng: Rng, own: Gender): Gender[] {
  // La mayoría busca un género; algunas personas, varios.
  const roll = rng()
  if (roll < 0.55) {
    return [pick(rng, GENDERS.filter((g) => g !== own))]
  }
  if (roll < 0.8) return [pick(rng, GENDERS)]
  return pickMany(rng, GENDERS, 2)
}

function birthdateForAge(rng: Rng, age: number): string {
  // Fecha estable (no depende del día en que se genere la zona).
  const year = 2026 - age - 1
  const month = intBetween(rng, 1, 12)
  const day = intBetween(rng, 1, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function makeBio(rng: Rng, interests: string[]): string {
  const template = pick(rng, BIO_TEMPLATES)
  const first = interests[0]!.toLowerCase()
  const second = (interests[1] ?? interests[0]!).toLowerCase()
  return template.replace('{interes}', first).replace('{interes2}', second)
}

/** Punto determinista dentro del radio (uniforme en el disco). */
function offsetPosition(rng: Rng, lat: number, lng: number, radiusKm: number) {
  const distance = radiusKm * Math.sqrt(rng())
  const bearing = rng() * 2 * Math.PI
  const dLat = (distance * Math.cos(bearing)) / 111.32
  const dLng =
    (distance * Math.sin(bearing)) /
    (111.32 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))
  return { lat: lat + dLat, lng: lng + dLng }
}

export function generateZoneDummies(
  zone: ZoneInput,
  videoCount: number,
): DummySpec[] {
  const rng = mulberry32(seedForZone(zone.zoneKey, SEED_VERSION))
  const dummies: DummySpec[] = []
  for (let i = 0; i < DUMMIES_PER_ZONE; i++) {
    const gender = pickGender(rng)
    const age = intBetween(rng, 18, 45)
    const interests = pickMany(rng, INTERESTS, intBetween(rng, 3, 6))
    const ageMin = Math.max(18, age - intBetween(rng, 3, 10))
    const ageMax = Math.min(60, age + intBetween(rng, 3, 10))
    const position = offsetPosition(rng, zone.lat, zone.lng, zone.radiusKm)
    const hasVideo = rng() < VIDEO_RATIO
    const videoRoll = rng()
    dummies.push({
      name: pick(rng, NAMES[gender]),
      gender,
      seeking: pickSeeking(rng, gender),
      age,
      birthdate: birthdateForAge(rng, age),
      ageMin,
      ageMax,
      interests,
      bio: makeBio(rng, interests),
      personality: pick(rng, PERSONALITIES),
      pickiness: floatBetween(rng, 0.2, 0.8),
      avatarSeed: intBetween(rng, 0, 2 ** 31 - 1),
      avatarPath: pick(rng, AVATAR_IMAGES[gender]),
      lat: position.lat,
      lng: position.lng,
      areaLabel: 'Cerca de ti',
      zoneKey: zone.zoneKey,
      videoIndex:
        hasVideo && videoCount > 0 ? Math.floor(videoRoll * videoCount) : null,
    })
  }
  return dummies
}

/** ~15% de los dummies con puntaje > 0.5 ya te dieron like al generarse
 *  (CLAUDE.md §10.3). Decisión determinista por dummy. */
export function likesYouOnSeed(avatarSeed: number, score: number): boolean {
  if (score <= 0.5) return false
  return mulberry32(avatarSeed ^ 0x51ca) () < 0.15
}
