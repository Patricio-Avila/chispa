/** Avatares ilustrados de los dummies.
 *
 *  Producto entregó ilustraciones planas (sin personas reales) que viven en
 *  public/dummies/avatars/; se asignan por género de forma determinista.
 *  Las piezas SVG de abajo quedan como respaldo (AvatarIllustration). */

import { mulberry32, pick, type Rng } from './prng'
import type { Gender } from '../data/repo/types'

const HOMBRE_IMAGES = [
  'dummies/avatars/hombre-1.jpg',
  'dummies/avatars/hombre-2.jpg',
  'dummies/avatars/hombre-3.jpg',
  'dummies/avatars/hombre-4.jpg',
  'dummies/avatars/hombre-5.jpg',
  'dummies/avatars/hombre-6.jpg',
  'dummies/avatars/hombre-7.jpg',
  'dummies/avatars/hombre-8.jpg',
  'dummies/avatars/hombre-9.jpg',
  'dummies/avatars/hombre-10.jpg',
  'dummies/avatars/hombre-11.jpg',
  'dummies/avatars/hombre-12.jpg',
]

const MUJER_IMAGES = [
  'dummies/avatars/mujer-1.jpg',
  'dummies/avatars/mujer-2.jpg',
  'dummies/avatars/mujer-3.jpg',
  'dummies/avatars/mujer-4.jpg',
  'dummies/avatars/mujer-5.jpg',
  'dummies/avatars/mujer-6.jpg',
  'dummies/avatars/mujer-7.jpg',
  'dummies/avatars/mujer-8.jpg',
  'dummies/avatars/mujer-9.jpg',
  'dummies/avatars/mujer-10.jpg',
  'dummies/avatars/mujer-11.jpg',
  'dummies/avatars/mujer-12.jpg',
  'dummies/avatars/mujer-13.jpg',
  'dummies/avatars/mujer-14.jpg',
  'dummies/avatars/mujer-15.jpg',
  'dummies/avatars/mujer-16.jpg',
  'dummies/avatars/mujer-17.jpg',
]

export const AVATAR_IMAGES: Record<Gender, readonly string[]> = {
  hombre: HOMBRE_IMAGES,
  mujer: MUJER_IMAGES,
  no_binario: [...HOMBRE_IMAGES, ...MUJER_IMAGES],
}

/** Escenas Lottie animadas para el carrusel (provistas por producto). */
export const PROFILE_SCENES = ['dummies/lottie/escena-playa.json'] as const

export const BACKGROUNDS = [
  '#FFE3D8', '#FFD166', '#FDE4EF', '#DCEFD6', '#CFE3F5', '#F1E3DC',
] as const

export const ACCENT_SHAPES = [
  '#FFD166', '#E8434D', '#C21A5F', '#16A34A', '#D97706',
] as const

export const SKIN_TONES = [
  '#F5C9A6', '#E0A878', '#C98D5E', '#8D5A3B', '#7A4A30', '#5C3824',
] as const

export const HAIR_COLORS = ['#2A1A1F', '#4A2C1A', '#7A4A30', '#B5651D', '#6B6B6B'] as const

export const CLOTHES_COLORS = [
  '#B5175A', '#D93A52', '#16A34A', '#D97706', '#C21A5F', '#2A1A1F', '#3B6FB5',
] as const

/** Peinados dibujables como paths simples (ver AvatarIllustration). */
export const HAIRSTYLES = ['corto', 'largo', 'chongo', 'rizado', 'rapado'] as const
export type Hairstyle = (typeof HAIRSTYLES)[number]

export type AvatarSpec = {
  background: string
  accent1: string
  accent2: string
  skin: string
  hairColor: string
  hairstyle: Hairstyle
  clothes: string
  /** Posiciones de las figuras decorativas (determinista). */
  blobX: number
  blobY: number
}

export function avatarSpecFromSeed(avatarSeed: number): AvatarSpec {
  const rng: Rng = mulberry32(avatarSeed >>> 0)
  const accent1 = pick(rng, ACCENT_SHAPES)
  let accent2 = pick(rng, ACCENT_SHAPES)
  if (accent2 === accent1) accent2 = ACCENT_SHAPES[(ACCENT_SHAPES.indexOf(accent1) + 1) % ACCENT_SHAPES.length]!
  return {
    background: pick(rng, BACKGROUNDS),
    accent1,
    accent2,
    skin: pick(rng, SKIN_TONES),
    hairColor: pick(rng, HAIR_COLORS),
    hairstyle: pick(rng, HAIRSTYLES),
    clothes: pick(rng, CLOTHES_COLORS),
    blobX: 180 + Math.floor(rng() * 60),
    blobY: 30 + Math.floor(rng() * 50),
  }
}
