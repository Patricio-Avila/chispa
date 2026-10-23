/** Tipos de dominio e interfaces de repositorio (CLAUDE.md §5.3).
 *  La UI solo importa de aquí y de las fábricas en repo/index.ts;
 *  nunca llama a PGlite directo. */

export type Gender = 'mujer' | 'hombre' | 'no_binario'

export type AppUser = {
  id: string
  isDummy: boolean
  name: string
  birthdate: string // ISO yyyy-mm-dd
  gender: Gender
  seeking: Gender[]
  ageMin: number
  ageMax: number
  maxDistanceKm: number
  bio: string | null
  interests: string[]
  lat: number | null
  lng: number | null
  areaLabel: string | null
}

/** Borrador del registro/edición: todo opcional mientras se llena. */
export type UserDraft = {
  name?: string
  birthdate?: string
  gender?: Gender
  seeking?: Gender[]
  ageMin?: number
  ageMax?: number
  maxDistanceKm?: number
  bio?: string
}

export type OnboardingStep = 'registro' | 'medios' | 'ubicacion' | 'done'

export type MediaKind = 'photo' | 'video' | 'avatar'
export type MediaStorage = 'opfs' | 'idb' | 'static' | 'generated'

export type MediaItem = {
  id: string
  userId: string
  kind: MediaKind
  position: number
  storage: MediaStorage
  path: string
  posterPath: string | null
  durationS: number | null
}

export type LocationMode = 'aqui' | 'voy'

export type LocationContext = {
  mode: LocationMode
  lat: number
  lng: number
  label: string
  radiusKm: number
  dateFrom: string | null
  dateTo: string | null
}

export interface UserRepo {
  /** El usuario local (is_dummy = false), o null si aún no existe. */
  getLocalUser(): Promise<AppUser | null>
  /** Crea o actualiza el borrador del registro. Devuelve el id local. */
  saveDraft(draft: UserDraft): Promise<string>
  setInterests(userId: string, interests: string[]): Promise<void>
  getOnboardingStep(): Promise<OnboardingStep | null>
  setOnboardingStep(step: OnboardingStep): Promise<void>
}

export type SwipeAction = 'skip' | 'pasar' | 'match'

/** Candidato de la baraja tal como sale de la base (sin puntaje aún). */
export type DeckRow = {
  id: string
  name: string
  birthdate: string
  gender: Gender
  seeking: Gender[]
  ageMin: number
  ageMax: number
  bio: string | null
  interests: string[]
  areaLabel: string
  personality: string | null
  pickiness: number
  avatarSeed: number
  lat: number
  lng: number
  distanceKm: number
  lastPasar: string | null
}

export interface DiscoveryRepo {
  isZoneSeeded(zoneKey: string): Promise<boolean>
  insertDummies(
    specs: import('../../sim/seed').DummySpec[],
    videos: { path: string; poster: string; durationS: number }[],
  ): Promise<string[]>
  /** Candidatos para la baraja: todos los dummies no deslizados, con su
   *  distancia al centro actual. El tope de distancia lo aplica la capa de
   *  filtros duros (maxDistanceKm), no la celda de zona. */
  getDeckRows(
    userId: string,
    centerLat: number,
    centerLng: number,
  ): Promise<DeckRow[]>
  /** Todos los perfiles generados, para las manchas del mapa (sin filtros
   *  ni swipes; solo posición aproximada, nunca el punto exacto). */
  listZoneBlobs(): Promise<{ id: string; lat: number; lng: number }[]>
  /** Un perfil por id (para Detalle desde chat o likes), o null. */
  getPersonById(
    id: string,
    centerLat: number,
    centerLng: number,
  ): Promise<DeckRow | null>
}

export interface SwipeRepo {
  record(fromUser: string, toUser: string, action: SwipeAction): Promise<void>
}

export type LikeTargetKind = 'perfil' | 'foto' | 'video'

export type Liker = {
  personId: string
  name: string
  birthdate: string
  avatarPath: string | null
  /** Qué le gustó en su like más reciente. */
  targetKind: LikeTargetKind
  likedAt: string
  seen: boolean
}

export interface LikeRepo {
  /** mediaId null = like al perfil. */
  addMediaLike(fromUser: string, toUser: string, mediaId: string | null): Promise<void>
  /** Likes al perfil en lote (siembra de la zona). */
  addProfileLikes(fromUsers: string[], toUser: string): Promise<void>
  hasLikedMe(dummyId: string, userId: string): Promise<boolean>
  likersOf(userId: string): Promise<string[]>
  /** Un renglón por persona que te dio like; no vistos primero. */
  listLikers(userId: string): Promise<Liker[]>
  markAllSeen(userId: string): Promise<void>
  unseenCount(userId: string): Promise<number>
}

export type NotificationType = 'like_perfil' | 'like_media' | 'match' | 'mensaje'

export interface NotificationRepo {
  add(userId: string, type: NotificationType, payload: unknown): Promise<void>
}

export interface MatchRepo {
  exists(userA: string, userB: string): Promise<boolean>
  create(userA: string, userB: string): Promise<string>
}

export type ChatMessage = {
  id: string
  matchId: string
  sender: string
  body: string
  createdAt: string
  readAt: string | null
}

export type ConversationSummary = {
  matchId: string
  partnerId: string
  partnerName: string
  partnerAvatarPath: string | null
  personality: string | null
  partnerInterests: string[]
  partnerAreaLabel: string
  lastMessage: string | null
  lastMessageAt: string | null
  lastSender: string | null
  unreadCount: number
}

export interface ChatRepo {
  /** Todas las conversaciones del usuario; sin mensajes = nuevo match. */
  listConversations(userId: string): Promise<ConversationSummary[]>
  messages(matchId: string): Promise<ChatMessage[]>
  send(matchId: string, sender: string, body: string): Promise<ChatMessage>
  /** Marca como leídos los mensajes del otro. */
  markRead(matchId: string, userId: string): Promise<void>
  getState(matchId: string): Promise<string | null>
  setState(matchId: string, node: string): Promise<void>
  unreadTotal(userId: string): Promise<number>
}

export interface MediaRepo {
  listByUser(userId: string): Promise<MediaItem[]>
  add(item: Omit<MediaItem, 'id'>): Promise<MediaItem>
  remove(id: string): Promise<void>
  /** Reordena: ids en el nuevo orden (posición 0 = principal). */
  reorder(userId: string, kind: MediaKind, orderedIds: string[]): Promise<void>
}

export interface LocationRepo {
  get(userId: string): Promise<LocationContext | null>
  set(userId: string, context: LocationContext): Promise<void>
}
