/** Piezas del avatar ilustrado (CLAUDE.md §10.1): elegidas de forma
 *  determinista desde avatar_seed. El dibujo vive en AvatarIllustration. */

import { mulberry32, pick, type Rng } from './prng'

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
