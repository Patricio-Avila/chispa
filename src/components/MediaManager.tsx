import { useEffect, useRef, useState } from 'react'
import { Plus, X, VideoCamera, SpinnerGap } from '@phosphor-icons/react'
import { mediaRepo, type MediaItem } from '../data/repo'
import {
  deleteMediaFile,
  loadMediaBlob,
  mediaErrorMessage,
  processPhoto,
  processVideo,
  saveMediaFile,
} from '../services/media'
import './MediaManager.css'

const MAX_PHOTOS = 6

type Tile = { media: MediaItem; url: string }

type MediaManagerProps = {
  userId: string
  /** Avisa a la pantalla cuántas fotos hay y si hay archivos procesándose. */
  onStatusChange?: (status: { photoCount: number; busy: boolean }) => void
}

/** Cuadrícula de 6 fotos + 1 video (CLAUDE.md §8.2-4): agregar, quitar y
 *  reordenar arrastrando. La usan Fotos y video (onboarding) y Editar. */
export function MediaManager({ userId, onStatusChange }: MediaManagerProps) {
  const [photos, setPhotos] = useState<Tile[]>([])
  const [video, setVideo] = useState<Tile | null>(null)
  const [pendingPhotos, setPendingPhotos] = useState(0)
  const [pendingVideo, setPendingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  const gridRef = useRef<HTMLDivElement>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const dragFrom = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    onStatusChange?.({
      photoCount: photos.length,
      busy: pendingPhotos > 0 || pendingVideo,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length, pendingPhotos, pendingVideo])

  useEffect(() => {
    let cancelled = false
    let urls: string[] = []
    void (async () => {
      const items = await mediaRepo.listByUser(userId)
      const loaded: Tile[] = []
      let videoTile: Tile | null = null
      for (const media of items) {
        const source =
          media.kind === 'video' && media.posterPath ? media.posterPath : media.path
        const blob = await loadMediaBlob({
          storage: media.storage as 'opfs' | 'idb',
          path: source,
        })
        if (!blob) continue
        const url = URL.createObjectURL(blob)
        urls.push(url)
        if (media.kind === 'video') videoTile = { media, url }
        else loaded.push({ media, url })
      }
      if (cancelled) return
      setPhotos(loaded)
      setVideo(videoTile)
    })()
    return () => {
      cancelled = true
      for (const url of urls) URL.revokeObjectURL(url)
      urls = []
    }
  }, [userId])

  async function addPhotos(files: FileList) {
    setError(null)
    const room = MAX_PHOTOS - photos.length
    const selected = Array.from(files).slice(0, room)
    for (const file of selected) {
      setPendingPhotos((n) => n + 1)
      try {
        const processed = await processPhoto(file)
        const saved = await saveMediaFile(`${crypto.randomUUID()}.webp`, processed.blob)
        const media = await mediaRepo.add({
          userId,
          kind: 'photo',
          position: photos.length,
          storage: saved.storage,
          path: saved.path,
          posterPath: null,
          durationS: null,
        })
        const url = URL.createObjectURL(processed.blob)
        setPhotos((prev) => [...prev, { media, url }])
      } catch (e) {
        setError(mediaErrorMessage(e))
      } finally {
        setPendingPhotos((n) => n - 1)
      }
    }
  }

  async function addVideo(file: File) {
    if (video) return
    setError(null)
    setPendingVideo(true)
    try {
      const processed = await processVideo(file)
      const ext = file.type.includes('webm') ? 'webm' : 'mp4'
      const base = crypto.randomUUID()
      const savedVideo = await saveMediaFile(`${base}.${ext}`, processed.blob)
      const savedPoster = await saveMediaFile(`${base}-poster.webp`, processed.poster)
      const media = await mediaRepo.add({
        userId,
        kind: 'video',
        position: 0,
        storage: savedVideo.storage,
        path: savedVideo.path,
        posterPath: savedPoster.path,
        durationS: processed.durationS,
      })
      setVideo({ media, url: URL.createObjectURL(processed.poster) })
    } catch (e) {
      setError(mediaErrorMessage(e))
    } finally {
      setPendingVideo(false)
    }
  }

  async function removeTile(tile: Tile) {
    await mediaRepo.remove(tile.media.id)
    await deleteMediaFile({
      storage: tile.media.storage as 'opfs' | 'idb',
      path: tile.media.path,
    })
    if (tile.media.posterPath) {
      await deleteMediaFile({
        storage: tile.media.storage as 'opfs' | 'idb',
        path: tile.media.posterPath,
      })
    }
    URL.revokeObjectURL(tile.url)
    if (tile.media.kind === 'video') setVideo(null)
    else setPhotos((prev) => prev.filter((p) => p.media.id !== tile.media.id))
  }

  /* --- Reordenar arrastrando (pointer events) --- */

  function onTilePointerDown(e: React.PointerEvent, id: string) {
    dragFrom.current = { x: e.clientX, y: e.clientY }
    setDragId(id)
  }

  function onGridPointerMove(e: React.PointerEvent) {
    if (!dragId || !gridRef.current) return
    const tiles = Array.from(
      gridRef.current.querySelectorAll<HTMLElement>('[data-photo-id]'),
    )
    let targetIndex = -1
    for (let i = 0; i < tiles.length; i++) {
      const rect = tiles[i]!.getBoundingClientRect()
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        targetIndex = i
        break
      }
    }
    if (targetIndex < 0) return
    setPhotos((prev) => {
      const fromIndex = prev.findIndex((p) => p.media.id === dragId)
      if (fromIndex < 0 || fromIndex === targetIndex) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(targetIndex, 0, moved!)
      return next
    })
  }

  function onGridPointerUp() {
    if (!dragId) return
    setDragId(null)
    dragFrom.current = null
    void mediaRepo.reorder(
      userId,
      'photo',
      photos.map((p) => p.media.id),
    )
  }

  return (
    <div className="media-manager">
      {error && (
        <p className="media-manager__error" role="alert">
          {error}
        </p>
      )}

      <div
        ref={gridRef}
        className="media-manager__grid"
        onPointerMove={onGridPointerMove}
        onPointerUp={onGridPointerUp}
        onPointerLeave={onGridPointerUp}
      >
        {photos.map((tile, index) => (
          <div
            key={tile.media.id}
            data-photo-id={tile.media.id}
            className={`media-manager__tile${dragId === tile.media.id ? ' media-manager__tile--dragging' : ''}`}
            onPointerDown={(e) => onTilePointerDown(e, tile.media.id)}
            style={{ touchAction: 'none' }}
          >
            <img src={tile.url} alt={`Foto ${index + 1}`} draggable={false} />
            {index === 0 && (
              <span className="media-manager__badge text-micro">Principal</span>
            )}
            <button
              type="button"
              className="media-manager__remove"
              aria-label={`Quitar foto ${index + 1}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => void removeTile(tile)}
            >
              <X size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ))}
        {Array.from({ length: pendingPhotos }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="media-manager__tile media-manager__tile--pending"
          >
            <SpinnerGap
              size={24}
              className="media-manager__spinner"
              aria-label="Procesando"
            />
          </div>
        ))}
        {photos.length + pendingPhotos < MAX_PHOTOS && (
          <button
            type="button"
            className="media-manager__tile media-manager__add"
            onClick={() => photoInput.current?.click()}
          >
            <Plus size={24} aria-hidden="true" />
            <span className="text-micro">Foto</span>
          </button>
        )}
      </div>

      <div className="media-manager__video-row">
        {video ? (
          <div className="media-manager__tile media-manager__tile--video">
            <img src={video.url} alt="Portada de tu video" draggable={false} />
            <span className="media-manager__badge text-micro">
              Video · {Math.round(video.media.durationS ?? 0)} s
            </span>
            <button
              type="button"
              className="media-manager__remove"
              aria-label="Quitar video"
              onClick={() => void removeTile(video)}
            >
              <X size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : pendingVideo ? (
          <div className="media-manager__tile media-manager__tile--video media-manager__tile--pending">
            <SpinnerGap
              size={24}
              className="media-manager__spinner"
              aria-label="Procesando"
            />
          </div>
        ) : (
          <button
            type="button"
            className="media-manager__tile media-manager__tile--video media-manager__add"
            onClick={() => videoInput.current?.click()}
          >
            <VideoCamera size={24} aria-hidden="true" />
            <span className="text-micro">Video · máx. 15 s</span>
          </button>
        )}
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void addPhotos(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/mp4,video/webm"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) void addVideo(e.target.files[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
