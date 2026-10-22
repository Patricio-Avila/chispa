/** Orquestación del chat: persiste mensajes y estado, y genera la
 *  respuesta del dummy con el engine. Los mensajes se guardan de
 *  inmediato (persisten ante recargas); el retraso de "escribiendo…"
 *  es solo visual en la pantalla. */

import { chatRepo } from '../../data/repo'
import {
  replyTo,
  SCRIPTS,
  type ChatInput,
  type ChatNodeName,
  type ChatReply,
  type ChatVars,
  type Personality,
  type QuickReply,
} from '../../sim/chatbot/engine'
import type { ChatMessage } from '../../data/repo'

export type ChatPartner = {
  id: string
  name: string
  personality: Personality
  interests: string[]
  areaLabel: string
}

export type ChatUser = {
  id: string
  name: string
  interests: string[]
}

export function varsFor(user: ChatUser, partner: ChatPartner): ChatVars {
  const common = partner.interests.find((i) => user.interests.includes(i))
  const interesComun = (common ?? partner.interests[0] ?? 'salir').toLowerCase()
  // Sin nombre real de colonia (Photon llega en F6), "la zona" lee natural
  // en frases como "¿Un café por {zona}?".
  const zona = partner.areaLabel === 'Cerca de ti' ? 'la zona' : partner.areaLabel
  return { nombre: user.name, interesComun, zona }
}

export function personalityOf(partner: { personality: string | null }): Personality {
  const value = partner.personality
  if (value === 'bromista' || value === 'directa' || value === 'timida') return value
  return 'bromista'
}

export function quickRepliesForNode(
  personality: Personality,
  node: ChatNodeName,
): QuickReply[] {
  return SCRIPTS[personality].nodes[node].quickReplies
}

export function isChatNode(value: string | null): value is ChatNodeName {
  return (
    value === 'saludo' ||
    value === 'intereses' ||
    value === 'plan' ||
    value === 'cierre' ||
    value === 'fallback'
  )
}

export type SendResult = {
  userMessage: ChatMessage
  dummyMessage: ChatMessage
  reply: ChatReply
}

/** Envía el mensaje del usuario, genera y persiste la respuesta del dummy. */
export async function sendAndReply(options: {
  matchId: string
  user: ChatUser
  partner: ChatPartner
  text: string
  input: ChatInput
  currentNode: ChatNodeName
  turn: number
}): Promise<SendResult> {
  const { matchId, user, partner, text, input, currentNode, turn } = options
  const userMessage = await chatRepo.send(matchId, user.id, text)
  const reply = replyTo({
    personality: partner.personality,
    node: currentNode,
    input,
    vars: varsFor(user, partner),
    matchId,
    turn,
  })
  const dummyMessage = await chatRepo.send(matchId, partner.id, reply.message)
  await chatRepo.setState(matchId, reply.nextNode)
  return { userMessage, dummyMessage, reply }
}

/** El dummy abre la conversación (saludo), p. ej. primer mensaje tras match. */
export async function dummyOpens(options: {
  matchId: string
  user: ChatUser
  partner: ChatPartner
}): Promise<ChatMessage> {
  const { matchId, user, partner } = options
  const reply = replyTo({
    personality: partner.personality,
    node: 'saludo',
    input: { type: 'open' },
    vars: varsFor(user, partner),
    matchId,
    turn: 0,
  })
  const message = await chatRepo.send(matchId, partner.id, reply.message)
  await chatRepo.setState(matchId, 'saludo')
  return message
}
