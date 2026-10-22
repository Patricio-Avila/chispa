/** Siembra 2–3 conversaciones ya empezadas en el primer arranque
 *  (CLAUDE.md §8.2-12); exactamente una queda con mensaje sin leer. */

import { getMeta, setMeta } from '../data/db/db'
import {
  chatRepo,
  matchRepo,
  swipeRepo,
  type AppUser,
  type DeckRow,
} from '../data/repo'
import { passesHardFilters, type ScoringProfile } from './scoring'
import { replyTo } from './chatbot/engine'
import {
  personalityOf,
  varsFor,
  type ChatPartner,
  type ChatUser,
} from '../screens/chat/chatFlow'
import { ageFromBirthdate } from '../screens/registro/age'

const META_KEY = 'conversations_seeded'

export async function seedConversationsIfNeeded(
  user: AppUser,
  userProfile: ScoringProfile,
  rows: DeckRow[],
): Promise<void> {
  if (await getMeta<boolean>(META_KEY)) return

  const candidates = rows
    .filter((row) =>
      passesHardFilters(
        userProfile,
        {
          id: row.id,
          gender: row.gender,
          seeking: row.seeking,
          age: ageFromBirthdate(row.birthdate),
          ageMin: row.ageMin,
          ageMax: row.ageMax,
          interests: row.interests,
        },
        row.distanceKm,
        user.maxDistanceKm,
      ),
    )
    .slice(0, 3)

  const chatUser: ChatUser = {
    id: user.id,
    name: user.name,
    interests: user.interests,
  }

  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i]!
    const partner: ChatPartner = {
      id: row.id,
      name: row.name,
      personality: personalityOf(row),
      interests: row.interests,
      areaLabel: row.areaLabel,
    }
    const matchId = await matchRepo.create(user.id, row.id)
    // El dummy ya no debe aparecer en la baraja.
    await swipeRepo.record(user.id, row.id, 'match')

    const vars = varsFor(chatUser, partner)
    const opening = replyTo({
      personality: partner.personality,
      node: 'saludo',
      input: { type: 'open' },
      vars,
      matchId,
      turn: 0,
    })
    await chatRepo.send(matchId, partner.id, opening.message)
    await chatRepo.setState(matchId, 'saludo')

    const isUnreadOne = i === candidates.length - 1
    if (isUnreadOne) {
      // Última conversación: solo el saludo del dummy, sin leer.
      continue
    }

    // Intercambio corto: respuesta rápida "del usuario" y réplica del dummy.
    const quickReply = opening.quickReplies[0]!
    await chatRepo.send(matchId, user.id, quickReply.text)
    const reply = replyTo({
      personality: partner.personality,
      node: 'saludo',
      input: { type: 'quickReply', next: quickReply.next },
      vars,
      matchId,
      turn: 2,
    })
    await chatRepo.send(matchId, partner.id, reply.message)
    await chatRepo.setState(matchId, reply.nextNode)
    await chatRepo.markRead(matchId, user.id)
  }

  await setMeta(META_KEY, true)
}
