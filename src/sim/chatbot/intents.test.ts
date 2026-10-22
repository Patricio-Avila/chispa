import { describe, expect, it } from 'vitest'
import { detectIntent, normalize } from './intents'

describe('normalize', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalize('¿CUÁNDO Café?')).toBe('¿cuando cafe?')
    expect(normalize('Adiós')).toBe('adios')
  })
})

describe('detectIntent (palabras clave de CLAUDE.md §11)', () => {
  it('saludo', () => {
    expect(detectIntent('Hola!!')).toBe('saludo')
    expect(detectIntent('buenas noches')).toBe('saludo')
    expect(detectIntent('hey')).toBe('saludo')
  })

  it('plan (gana sobre pregunta)', () => {
    expect(detectIntent('¿Cuándo nos vemos?')).toBe('plan')
    expect(detectIntent('vamos por un café')).toBe('plan')
    expect(detectIntent('me late tomar algo')).toBe('plan')
    expect(detectIntent('quiero una cita contigo')).toBe('plan')
  })

  it('pregunta', () => {
    expect(detectIntent('¿de dónde eres?')).toBe('pregunta')
    expect(detectIntent('y tú a qué te dedicas')).toBe('pregunta')
  })

  it('halago', () => {
    expect(detectIntent('qué guapa saliste')).toBe('halago')
    expect(detectIntent('me gusta tu sonrisa')).toBe('halago')
  })

  it('despedida', () => {
    expect(detectIntent('bueno, me voy')).toBe('despedida')
    expect(detectIntent('bye!')).toBe('despedida')
  })

  it('desconocida', () => {
    expect(detectIntent('asdfgh')).toBe('desconocida')
    expect(detectIntent('')).toBe('desconocida')
  })
})
