/** Detección de intenciones del texto libre (CLAUDE.md §11). */

export type Intent =
  | 'saludo'
  | 'pregunta'
  | 'plan'
  | 'halago'
  | 'despedida'
  | 'desconocida'

/** Minúsculas y sin acentos. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const KEYWORDS: { intent: Intent; words: string[] }[] = [
  // El orden importa: plan y despedida ganan sobre saludo/pregunta.
  {
    intent: 'plan',
    words: ['cafe', 'salir', 'vernos', 'cita', 'cenar', 'tomar algo', 'cuando'],
  },
  { intent: 'despedida', words: ['adios', 'bye', 'luego', 'me voy'] },
  { intent: 'halago', words: ['guapa', 'guapo', 'bonita', 'me gusta tu'] },
  { intent: 'saludo', words: ['hola', 'que tal', 'hey', 'buenas'] },
  { intent: 'pregunta', words: ['?', '¿', 'que', 'como', 'cual', 'donde'] },
]

export function detectIntent(text: string): Intent {
  const normalized = normalize(text)
  if (normalized.trim() === '') return 'desconocida'
  for (const group of KEYWORDS) {
    for (const word of group.words) {
      if (normalized.includes(word)) return group.intent
    }
  }
  return 'desconocida'
}
