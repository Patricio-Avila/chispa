import { describe, expect, it } from 'vitest'
import { fillTemplate, replyTo, SCRIPTS, type ChatVars } from './engine'

const VARS: ChatVars = {
  nombre: 'Patricio',
  interesComun: 'senderismo',
  zona: 'Barrio Antiguo',
}

const BASE = {
  personality: 'bromista' as const,
  vars: VARS,
  matchId: 'match-1',
}

describe('fillTemplate', () => {
  it('sustituye los tres marcadores', () => {
    expect(
      fillTemplate('Hola {nombre}, ¿{interes_comun} por {zona}?', VARS),
    ).toBe('Hola Patricio, ¿senderismo por Barrio Antiguo?')
  })
})

describe('replyTo', () => {
  it('recorre saludo → intereses → plan → cierre con respuestas rápidas', () => {
    const opening = replyTo({ ...BASE, node: 'saludo', input: { type: 'open' }, turn: 0 })
    expect(opening.nextNode).toBe('saludo')

    const r1 = replyTo({
      ...BASE,
      node: 'saludo',
      input: { type: 'quickReply', next: opening.quickReplies[0]!.next },
      turn: 1,
    })
    expect(r1.nextNode).toBe('intereses')

    const r2 = replyTo({
      ...BASE,
      node: 'intereses',
      input: { type: 'quickReply', next: r1.quickReplies[0]!.next },
      turn: 2,
    })
    expect(r2.nextNode).toBe('plan')

    const r3 = replyTo({
      ...BASE,
      node: 'plan',
      input: { type: 'quickReply', next: r2.quickReplies[0]!.next },
      turn: 3,
    })
    expect(r3.nextNode).toBe('cierre')
  })

  it('texto libre con intención de plan salta al nodo plan', () => {
    const reply = replyTo({
      ...BASE,
      node: 'intereses',
      input: { type: 'freeText', text: '¿cuándo nos vemos?' },
      turn: 2,
    })
    expect(reply.nextNode).toBe('plan')
    expect(reply.message).toContain('Barrio Antiguo')
  })

  it('texto sin intención cae en fallback sin perder el nodo', () => {
    const reply = replyTo({
      ...BASE,
      node: 'intereses',
      input: { type: 'freeText', text: 'zzzz' },
      turn: 2,
    })
    expect(reply.nextNode).toBe('intereses')
    expect(
      SCRIPTS.bromista.nodes.fallback.dummy.some((variant) =>
        reply.message.startsWith(variant.slice(0, 10)),
      ),
    ).toBe(true)
    expect(reply.quickReplies).toEqual(SCRIPTS.bromista.nodes.fallback.quickReplies)
  })

  it('los marcadores siempre quedan sustituidos', () => {
    const reply = replyTo({ ...BASE, node: 'saludo', input: { type: 'open' }, turn: 0 })
    expect(reply.message).not.toMatch(/\{(nombre|interes_comun|zona)\}/)
  })

  it('es determinista por (match, turno)', () => {
    const a = replyTo({ ...BASE, node: 'saludo', input: { type: 'open' }, turn: 0 })
    const b = replyTo({ ...BASE, node: 'saludo', input: { type: 'open' }, turn: 0 })
    expect(a).toEqual(b)
  })

  it('el delay respeta el rango de la personalidad', () => {
    for (const personality of ['bromista', 'directa', 'timida'] as const) {
      const [min, max] = SCRIPTS[personality].delayMsRange
      for (let turn = 0; turn < 10; turn++) {
        const reply = replyTo({
          personality,
          node: 'saludo',
          input: { type: 'open' },
          vars: VARS,
          matchId: 'm',
          turn,
        })
        expect(reply.delayMs).toBeGreaterThanOrEqual(min)
        expect(reply.delayMs).toBeLessThanOrEqual(max)
      }
    }
  })
})
