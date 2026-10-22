/** Máquina de estados del chatbot (CLAUDE.md §11). Funciones puras. */

import scriptsJson from './scripts.es.json'
import { detectIntent } from './intents'
import { hashString, mulberry32 } from '../prng'

export type ChatNodeName = 'saludo' | 'intereses' | 'plan' | 'cierre' | 'fallback'

export type QuickReply = { text: string; next: ChatNodeName }

type ScriptNode = { dummy: string[]; quickReplies: QuickReply[] }

export type PersonalityScript = {
  delayMsRange: [number, number]
  nodes: Record<ChatNodeName, ScriptNode>
}

export type Personality = 'bromista' | 'directa' | 'timida'

export const SCRIPTS = scriptsJson as unknown as Record<Personality, PersonalityScript>

export type ChatVars = {
  /** Nombre del usuario local (el dummy le habla a esta persona). */
  nombre: string
  interesComun: string
  zona: string
}

export type ChatInput =
  | { type: 'quickReply'; next: ChatNodeName }
  | { type: 'freeText'; text: string }
  | { type: 'open' } /* el dummy abre la conversación (nodo saludo) */

export type ChatReply = {
  message: string
  nextNode: ChatNodeName
  quickReplies: QuickReply[]
  delayMs: number
}

export function fillTemplate(template: string, vars: ChatVars): string {
  return template
    .replaceAll('{nombre}', vars.nombre)
    .replaceAll('{interes_comun}', vars.interesComun)
    .replaceAll('{zona}', vars.zona)
}

/** Siguiente nodo "natural" al avanzar sin intención clara. */
const NATURAL_NEXT: Record<ChatNodeName, ChatNodeName> = {
  saludo: 'intereses',
  intereses: 'plan',
  plan: 'cierre',
  cierre: 'cierre',
  fallback: 'intereses',
}

function resolveTarget(current: ChatNodeName, input: ChatInput): ChatNodeName {
  if (input.type === 'open') return 'saludo'
  if (input.type === 'quickReply') return input.next
  switch (detectIntent(input.text)) {
    case 'plan':
      return 'plan'
    case 'despedida':
      return 'cierre'
    case 'saludo':
      // Responde en el nodo actual (otra variante), sin retroceder.
      return current === 'fallback' ? 'intereses' : current
    case 'pregunta':
    case 'halago':
      return NATURAL_NEXT[current]
    default:
      return 'fallback'
  }
}

/** Respuesta del dummy. Determinista: misma (matchId, turno, entrada) → misma salida. */
export function replyTo(options: {
  personality: Personality
  node: ChatNodeName
  input: ChatInput
  vars: ChatVars
  matchId: string
  turn: number
}): ChatReply {
  const { personality, node, input, vars, matchId, turn } = options
  const script = SCRIPTS[personality]
  const target = resolveTarget(node, input)
  const scriptNode = script.nodes[target]
  const rng = mulberry32(hashString(`${matchId}:${turn}:${target}`))

  const variant = scriptNode.dummy[Math.floor(rng() * scriptNode.dummy.length)]!
  const message = fillTemplate(variant, vars)

  const [minDelay, maxDelay] = script.delayMsRange
  // Proporcional al largo del mensaje dentro del rango de la personalidad.
  const lengthFactor = Math.min(1, message.length / 80)
  const base = minDelay + (maxDelay - minDelay) * lengthFactor
  const jitter = (rng() - 0.5) * 0.3 * (maxDelay - minDelay)
  const delayMs = Math.round(Math.min(maxDelay, Math.max(minDelay, base + jitter)))

  // Tras un fallback el estado se queda donde estaba para re-ofrecer salida,
  // pero las quick replies mostradas son las del fallback.
  const nextNode = target === 'fallback' ? node : target

  return {
    message,
    nextNode,
    quickReplies: scriptNode.quickReplies,
    delayMs,
  }
}
