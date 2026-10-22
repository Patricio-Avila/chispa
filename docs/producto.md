# Chispa — Qué es, qué hace y qué necesita para crecer

> POC web móvil de una app de citas tipo Tinder. **Todo corre en el navegador, sin backend**, publicada en GitHub Pages: https://patricio-avila.github.io/chispa/
>
> Documento de producto e infraestructura. Última actualización: 22 oct 2026.

---

## 1. Qué hace la aplicación

Chispa simula la experiencia esencial de una app de citas de punta a punta: crear un perfil, descubrir gente cercana, reaccionar, hacer match, chatear y recibir atención — con 40 perfiles simulados (dummies) generados de forma determinista por zona geográfica.

### 1.1 Onboarding
- **Bienvenida** con aviso explícito de que es una demo y los datos viven solo en el dispositivo.
- **Registro en una sola pantalla**: nombre, fecha de nacimiento, género (mujer / hombre / no binario), a quién buscas (selección múltiple), rango de edad (18–60) y distancia máxima. **Bloqueo a menores de 18** sin guardar nada. El borrador se guarda en cada cambio: recargar a mitad retoma el paso exacto.
- **Fotos y video**: hasta 6 fotos (conversión automática a WebP 1080 px) y 1 video (máx. 15 s y 30 MB, con portada generada del primer segundo). Reordenado por arrastre; la primera foto es la principal.
- **Ubicación**: Geolocation API con pre-permiso explicativo; si se niega o falla, se elige la zona tocando un mapa.

### 1.2 Descubrir
- Tarjeta a pantalla completa con **carrusel de medios** (segmentos arriba, toque en los lados para navegar, videos en autoplay silenciado).
- **4 acciones**, por gesto y por botón:
  - **Skip** (arrastrar a la izquierda): descarta definitivo.
  - **Pasar** (arrastrar hacia abajo): vuelve al final de la baraja.
  - **Match** (arrastrar a la derecha): muestra interés; si el dummy acepta, hay match.
  - **Like** (doble toque): reacción a esa foto/video en específico, sin intentar match.
- Gestos con física real: umbral del 30 % o velocidad >0.5 px/ms, rotación hasta ±12°, etiquetas SKIP/PASAR/MATCH durante el arrastre.
- **Filtros** (edad, distancia, intereses), intereses en común resaltados, detalle de perfil completo y estado vacío con salidas ("Ampliar distancia", "Cambiar zona").

### 1.3 Match, conversaciones y chat
- Modal **"¡Es un match!"** con ambos avatares y 3 rompehielos sugeridos.
- **Conversaciones**: carrusel de nuevos matches + lista ordenada por último mensaje con vista previa, hora y punto de no leído. Al primer arranque se siembran 2–3 conversaciones ya empezadas (una sin leer).
- **Chat con chatbot por plantillas** (sin IA, sin llaves): máquina de estados saludo → intereses → plan → cierre con fallback, 3 personalidades (bromista, directa, tímida) con tono y tiempos de respuesta propios, detección de intenciones en texto libre (saludo, pregunta, plan, halago, despedida), indicador "escribiendo…" y respuestas rápidas. El dummy siempre termina proponiendo un plan en tu zona.

### 1.4 Likes y notificaciones
- **Pestaña Likes**: cuadrícula de quién te dio like, con etiqueta de qué le gustó (perfil / foto / video) y hace cuánto; los no vistos primero. Desde ahí, Match crea el match **al instante**.
- **Motor de likes entrantes**: con la app abierta, cada 45–120 s un dummy compatible te da like (60 % al perfil, 40 % a un medio), máximo 10 por sesión.
- **Avisos**: toast de 4 s con avatar, badges numéricos en Likes y Conversaciones, y **notificaciones del sistema** vía service worker cuando la pestaña está en segundo plano (tocar la notificación abre la pantalla correcta).
- **Pre-permiso** de notificaciones que aparece solo tras el primer like recibido (nunca al abrir), con snooze de 3 días.

### 1.5 Buscar en el mapa
- Mapa Leaflet + OpenStreetMap a pantalla completa con **buscador Photon** (autocompletado real, debounce 350 ms, caché, sesgo a tu ubicación).
- Modos **"Estoy aquí" / "Voy a ir"** con fechas de viaje; radio de 5/10/25/50 km.
- **Privacidad tipo Tinder**: los demás perfiles se ven como manchas difusas de ~400 m con desplazamiento aleatorio — nunca el punto exacto.
- El chip de Descubrir refleja la zona activa ("Parque Fundidora · 25–27 oct").

### 1.6 Perfil
- Ver y **editar** todo el perfil (datos, medios, bio de 300 caracteres, 3–8 intereses del catálogo).
- **"Ver cómo me ven"**: tu tarjeta exactamente como la ven los demás.
- Estado de notificaciones con ayuda contextual, cambio de ubicación, y **"Borrar mis datos"** (limpia base y archivos, vuelve a Bienvenida).

### 1.7 El simulador (lo que hace creíble la demo)
- **40 dummies por zona, deterministas**: la misma zona genera siempre la misma gente (semilla = hash de lat/lng redondeadas). Nombres mexicanos, bios por plantillas, 30 intereses, ilustraciones planas por género (nada de fotos de personas reales), algunas con escena Lottie animada.
- **Puntaje de compatibilidad** (0–1): 35 % intereses en común (Jaccard), 25 % cercanía, 20 % edades centradas, 20 % ruido determinista por pareja. Filtros duros de género/edad/distancia mutuos.
- **Comportamiento**: probabilidad de aceptar tu Match según puntaje y "exigencia" del dummy; ~15 % ya te dio like al generarse; 30 % de probabilidad de que escriba primero tras un match.
- `area_label` real vía reverse geocoding de Photon ("3 km · Obrera").

### 1.8 Plataforma
- **PWA instalable**: funciona **sin conexión** tras la primera carga (verificado apagando el servidor) salvo mapa y búsqueda; cachea app, fuentes y el WASM de Postgres.
- **Postgres real en el navegador** (PGlite en un Web Worker, persistido en IndexedDB) con migraciones atómicas; archivos de medios en OPFS con respaldo IndexedDB.
- **Design system "Chispa"** (tema claro, coral→magenta, Plus Jakarta Sans) con tokens CSS; móvil primero (360–430 px) y riel lateral desde 768 px.
- **Accesibilidad**: contraste AA, áreas táctiles ≥44 px, `aria-label` en botones de ícono, `prefers-reduced-motion` respetado en todo (sin rotaciones, Lotties en fotograma fijo).
- 76 pruebas unitarias (determinismo del simulador, puntaje, intenciones del chatbot, validaciones); deploy automático a GitHub Pages en cada push.

---

## 2. Pros y contras

### Pros
| | |
|---|---|
| **Costo cero de operación** | Hosting estático gratis, sin servidores, sin llaves de API. Se puede compartir con cualquier stakeholder con una URL. |
| **Flujo completo y creíble** | Del registro al plan de cita en chat: todo el ciclo emocional de una app de citas es demostrable hoy. |
| **Arquitectura lista para migrar** | La UI solo habla con interfaces de repositorio y el SQL es Postgres real: cambiar PGlite por Supabase no toca pantallas. |
| **Determinismo** | Mismas zonas → mismos perfiles. Las demos son reproducibles y los bugs también. |
| **Privacidad por diseño** | Nada sale del dispositivo; ilustraciones en vez de personas reales; zonas difusas en el mapa. |
| **PWA real** | Instalable y funcional sin conexión; se siente app sin pasar por tiendas. |

### Contras / limitaciones conocidas
| | |
|---|---|
| **Un solo usuario, un solo dispositivo** | No hay cuentas ni sincronización: borrar datos del navegador borra todo. |
| **Chat por plantillas** | Convincente en demo, repetitivo en uso prolongado; no hay memoria de conversación. |
| **Notificaciones limitadas** | Solo con la app abierta (aunque esté en segundo plano). Sin servidor no hay push real; en iPhone requiere instalar la PWA. |
| **Sin seguridad real** | La edad se declara, no se verifica; no hay moderación, ni bloquear/reportar (obligatorio en tiendas), ni aviso de privacidad LFPDPPP — listados como pendientes de producción. |
| **Carga inicial pesada** | El WASM de Postgres (~9 MB gzip ~3 MB) se descarga una vez; en redes lentas la primera carga se siente. |
| **Dependencias de cortesía** | Teselas OSM y Photon son servicios públicos sin SLA; para producción se necesita un proveedor con contrato. |
| **PGlite es monoconexión** | Una pestaña a la vez (la segunda se bloquea con aviso). |

---

## 3. Plan de infraestructura para producción

### 3.1 Principio
El POC se diseñó para que la migración sea **incremental**: las pantallas no cambian, solo las implementaciones de los repositorios. La ruta natural es **Supabase** (o equivalente Postgres gestionado), porque el SQL ya es Postgres.

### 3.2 Mapa de migración (qué sustituye a qué)

| Hoy (POC) | Producción | Notas |
|---|---|---|
| PGlite en el navegador | **Supabase Postgres + PostGIS** | El esquema actual migra casi tal cual; `haversine_km` se vuelve índice geoespacial PostGIS |
| `app_meta.local_user_id` | **Supabase Auth** (teléfono/OTP + Google/Apple) | Las apps de citas viven del registro sin fricción; verificación por SMS es el estándar |
| OPFS / IndexedDB | **Supabase Storage + CDN** | Derivados WebP/posters generados en Edge Functions; URLs firmadas |
| Chatbot por plantillas | **Supabase Realtime** (chat humano-humano) | El motor de plantillas puede quedarse como "icebreakers" sugeridos |
| Motor de likes simulado | Usuarios reales + **cola de eventos** (pg_cron / colas) | Los eventos like/match/mensaje ya existen como tabla `notification` |
| Notificaciones con app abierta | **Web Push (VAPID) + FCM/APNs** | Requiere backend; el service worker actual ya maneja clicks |
| Dummies deterministas | Siguen útiles para **frío inicial** (zonas sin densidad) y QA | Marcados `is_dummy`, ya separados en el esquema |
| GitHub Pages | Pages/Vercel para el front + Supabase para datos | El front sigue siendo estático: barato y cacheable |

### 3.3 Fases sugeridas

**Fase A — Multiusuario mínimo (4–6 semanas, ~50–500 USD/mes)**
Auth + Postgres/PostGIS + Storage + Realtime para chat. RLS (row-level security) para que cada quien vea solo lo suyo. Bloquear/reportar y borrado de cuenta (requisitos de tienda y LFPDPPP). Web Push. Suficiente para un piloto cerrado en Monterrey.

**Fase B — Confianza y crecimiento (2–3 meses adicionales)**
Moderación de medios (API de visión para NSFW + cola de revisión humana), verificación de edad/selfie, rate limiting y detección de spam/bots, analítica de producto (eventos de swipe/match/retención), geosearch con índices PostGIS y paginación de baraja server-side.

**Fase C — Escala (cuando el piloto valide)**
Servicio de recomendación propio (el puntaje actual es el baseline: Jaccard + distancia + edad), caché de barajas (Redis), colas de eventos (p. ej. Kafka/NATS) para feed de likes y notificaciones, data warehouse para experimentación A/B, y app nativa o wrapper (Capacitor) si las notificaciones push de iOS lo exigen.

### 3.4 Comparación con apps del mismo giro

| Capacidad | **Chispa (POC)** | **Chispa (plan prod.)** | **Tinder / Bumble / Hinge** |
|---|---|---|---|
| Usuarios | 1 local | Miles (Supabase) | Decenas de millones |
| Matching | Puntaje determinista en el cliente | Mismo puntaje server-side como baseline | Sistemas de recomendación con ML (historial de swipes, ELO-like, embeddings) |
| Geo | Haversine en SQL local | PostGIS + índices | Clusters de geosharding (Tinder usa shards geográficos sobre Elasticsearch) |
| Chat | Bot por plantillas local | Realtime (WebSockets) | Infra de mensajería dedicada, cifrado, detección de toxicidad en línea |
| Push | Solo app abierta | Web Push + FCM/APNs | Push nativo masivo con orquestación de campañas |
| Medios | OPFS local | Storage + CDN + moderación automática | Pipelines de moderación con ML + revisión humana 24/7 |
| Confianza y seguridad | — (pendiente declarado) | Reportar/bloquear, verificación | Equipos dedicados, verificación con selfie/video, foto-verificación |
| Monetización | — (fuera de alcance) | — | Suscripciones y compras (el grueso de su infra de negocio) |
| Costo mensual | $0 | ~$50–500 USD piloto | Decenas de millones USD/año |

**Lectura honesta**: el POC cubre ~80 % de la *experiencia* visible de estas apps con 0 % de su infraestructura. Lo que las apps grandes tienen y un piloto debe priorizar no es el matching sofisticado, sino **confianza y seguridad** (verificación, moderación, reportes): es lo que exigen las tiendas, la LFPDPPP y las usuarias. El recomendador con ML es lo último que se necesita — con pocos miles de usuarios, el puntaje actual más densidad geográfica funciona.

---

## 4. Referencias del repo
- Fuente de verdad del producto: [`CLAUDE.md`](../CLAUDE.md)
- Decisiones técnicas tomadas: [`docs/decisiones.md`](decisiones.md)
- Pendientes de producción declarados: CLAUDE.md §15
- App en vivo: https://patricio-avila.github.io/chispa/
