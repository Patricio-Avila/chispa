import { describe, expect, it } from 'vitest'
import {
  MediaError,
  validateVideo,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_SECONDS,
} from './media'

describe('validateVideo', () => {
  it('acepta un video dentro de los límites', () => {
    expect(() =>
      validateVideo({ sizeBytes: 2 * 1024 * 1024, durationS: 10 }),
    ).not.toThrow()
  })

  it('acepta exactamente 15 s y 30 MB', () => {
    expect(() =>
      validateVideo({ sizeBytes: VIDEO_MAX_BYTES, durationS: VIDEO_MAX_SECONDS }),
    ).not.toThrow()
  })

  it('rechaza más de 15 segundos', () => {
    let error: unknown
    try {
      validateVideo({ sizeBytes: 1024, durationS: 15.4 })
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(MediaError)
    expect((error as MediaError).code).toBe('video_muy_largo')
    expect((error as MediaError).message).toContain('15 segundos')
  })

  it('rechaza más de 30 MB', () => {
    let error: unknown
    try {
      validateVideo({ sizeBytes: VIDEO_MAX_BYTES + 1, durationS: 5 })
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(MediaError)
    expect((error as MediaError).code).toBe('video_muy_pesado')
  })
})
