/** Procesamiento y almacenamiento de medios del usuario (CLAUDE.md §8.2-4).
 *  Archivos en OPFS con respaldo en IndexedDB; metadatos en PGlite (MediaRepo). */

export const PHOTO_MAX_SIDE = 1080
export const PHOTO_QUALITY = 0.8
export const VIDEO_MAX_SECONDS = 15
export const VIDEO_MAX_BYTES = 30 * 1024 * 1024

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type MediaErrorCode =
  | 'formato_no_soportado'
  | 'video_muy_largo'
  | 'video_muy_pesado'
  | 'almacenamiento_lleno'
  | 'error_procesando'

export class MediaError extends Error {
  readonly code: MediaErrorCode

  constructor(code: MediaErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export function mediaErrorMessage(error: unknown): string {
  if (error instanceof MediaError) return error.message
  return 'No se pudo procesar el archivo. Intenta con otro.'
}

/* ---------- Fotos ---------- */

export type ProcessedPhoto = { blob: Blob }

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new MediaError('formato_no_soportado', 'Usa JPG, PNG o WebP')
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new MediaError('formato_no_soportado', 'Usa JPG, PNG o WebP')
  }
  try {
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new MediaError('error_procesando', 'No se pudo procesar la foto.')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await canvasToBlob(canvas, 'image/webp', PHOTO_QUALITY)
    return { blob }
  } finally {
    bitmap.close()
  }
}

/* ---------- Video ---------- */

export type VideoValidationInput = { sizeBytes: number; durationS: number }

/** Reglas puras de validación (probadas en Vitest). */
export function validateVideo({ sizeBytes, durationS }: VideoValidationInput): void {
  if (sizeBytes > VIDEO_MAX_BYTES) {
    throw new MediaError(
      'video_muy_pesado',
      'El video pesa más de 30 MB. Elige uno más ligero.',
    )
  }
  if (durationS > VIDEO_MAX_SECONDS) {
    throw new MediaError(
      'video_muy_largo',
      'El video dura más de 15 segundos. Elige uno más corto.',
    )
  }
}

export type ProcessedVideo = { blob: Blob; poster: Blob; durationS: number }

export async function processVideo(file: File): Promise<ProcessedVideo> {
  if (!file.type.startsWith('video/')) {
    throw new MediaError('formato_no_soportado', 'Elige un archivo de video (MP4 o WebM).')
  }
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = url

    await videoEvent(video, 'loadedmetadata')
    const durationS = video.duration
    validateVideo({ sizeBytes: file.size, durationS })

    // Portada: fotograma del primer segundo.
    video.currentTime = Math.min(1, durationS / 2)
    await videoEvent(video, 'seeked')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new MediaError('error_procesando', 'No se pudo leer el video.')
    ctx.drawImage(video, 0, 0)
    const poster = await canvasToBlob(canvas, 'image/webp', PHOTO_QUALITY)

    return { blob: file, poster, durationS }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/* ---------- Almacenamiento (OPFS con respaldo en IndexedDB) ---------- */

export type SavedFile = { storage: 'opfs' | 'idb'; path: string }

const MEDIA_DIR = 'media'
const IDB_NAME = 'chispa-media'
const IDB_STORE = 'files'

function hasOpfs(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.storage &&
    typeof navigator.storage.getDirectory === 'function'
  )
}

export async function saveMediaFile(name: string, blob: Blob): Promise<SavedFile> {
  const path = `${MEDIA_DIR}/${name}`
  try {
    if (hasOpfs()) {
      const root = await navigator.storage.getDirectory()
      const dir = await root.getDirectoryHandle(MEDIA_DIR, { create: true })
      const handle = await dir.getFileHandle(name, { create: true })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return { storage: 'opfs', path }
    }
    await idbPut(path, blob)
    return { storage: 'idb', path }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new MediaError(
        'almacenamiento_lleno',
        'El almacenamiento está lleno. Borra algunos medios e intenta de nuevo.',
      )
    }
    throw error
  }
}

export async function loadMediaBlob(saved: SavedFile): Promise<Blob | null> {
  try {
    if (saved.storage === 'opfs') {
      const root = await navigator.storage.getDirectory()
      const dir = await root.getDirectoryHandle(MEDIA_DIR)
      const name = saved.path.split('/').pop()!
      const handle = await dir.getFileHandle(name)
      return await handle.getFile()
    }
    return await idbGet(saved.path)
  } catch {
    return null
  }
}

export async function deleteMediaFile(saved: SavedFile): Promise<void> {
  try {
    if (saved.storage === 'opfs') {
      const root = await navigator.storage.getDirectory()
      const dir = await root.getDirectoryHandle(MEDIA_DIR)
      await dir.removeEntry(saved.path.split('/').pop()!)
      return
    }
    await idbDelete(saved.path)
  } catch {
    // Borrar un archivo ya ausente no es un error para la UI.
  }
}

/** Borra todos los medios locales (lo usa "Borrar mis datos" en Fase 7). */
export async function wipeMediaFiles(): Promise<void> {
  try {
    if (hasOpfs()) {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(MEDIA_DIR, { recursive: true })
    }
  } catch {
    /* ya no existía */
  }
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(IDB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

/* ---------- Auxiliares ---------- */

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new MediaError('error_procesando', 'No se pudo convertir la imagen.')),
      type,
      quality,
    )
  })
}

function videoEvent(video: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onDone = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new MediaError('formato_no_soportado', 'No se pudo leer el video. Usa MP4 o WebM.'))
    }
    const cleanup = () => {
      video.removeEventListener(event, onDone)
      video.removeEventListener('error', onError)
    }
    video.addEventListener(event, onDone, { once: true })
    video.addEventListener('error', onError, { once: true })
  })
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB error'))
  })
}

async function idbPut(key: string, blob: Blob): Promise<void> {
  const db = await openIdb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(blob, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB error'))
    })
  } finally {
    db.close()
  }
}

async function idbGet(key: string): Promise<Blob | null> {
  const db = await openIdb()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(key)
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB error'))
    })
  } finally {
    db.close()
  }
}

async function idbDelete(key: string): Promise<void> {
  const db = await openIdb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB error'))
    })
  } finally {
    db.close()
  }
}
