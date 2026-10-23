# Decisiones del proyecto

Registro de decisiones tomadas donde CLAUDE.md dejaba la opción abierta
(o pedía medir antes de decidir).

## Fase 1

### Distancia: haversine en SQL, no PostGIS
**Fecha:** 2026-10-21

CLAUDE.md §9 pedía medir cuánto pesa cargar la extensión PostGIS de PGlite.
Resultado: `@electric-sql/pglite` 0.3.16 **no incluye PostGIS** (solo las
extensiones contrib de Postgres: `cube`, `earthdistance`, etc.). No hay nada
que cargar. Se crea la función `haversine_km(lat1, lng1, lat2, lng2)` en SQL
(migración `001_init.sql`), suficiente para ordenar por cercanía y filtrar
por radio en el POC. La migración a Supabase podrá sustituirla por PostGIS
real sin cambiar las consultas de forma significativa.

### `app_meta` la crea el runner de migraciones
El runner necesita leer `schema_version` antes de aplicar migraciones, así
que crea `app_meta` con `create table if not exists` al arrancar. La tabla
sigue apareciendo en `001_init.sql` (también con `if not exists`) para que
el esquema completo de CLAUDE.md §9 viva en un solo archivo.

### Guardia de pestaña única con Web Locks
PGlite es de una sola conexión. Se usa `navigator.locks` con `ifAvailable`
para detectar una segunda pestaña y mostrar el mensaje del caso borde de
CLAUDE.md §8.4. En navegadores sin Web Locks la guardia se omite (riesgo
aceptable para un POC).

### Íconos PWA generados fuera del repo de código
Los PNG 192/512 (y el maskable) se generaron una vez con un script de
PowerShell (System.Drawing: gradiente de marca + corazón) y se versionan
como assets en `public/icons/`. No se agregó ninguna dependencia de build
para rasterizar.

### Avatares de dummies: ilustraciones provistas por producto
**Fecha:** 2026-10-21

CLAUDE.md §3 preveía avatares SVG generados por piezas. Producto entregó 7
ilustraciones planas hechas por IA (3 hombres, 4 mujeres; sin personas
reales), que se prefieren por calidad visual. Viven en
`public/dummies/avatars/` (JPG 800×800, ~35 KB c/u) y se asignan por género
de forma determinista con el PRNG de la zona. El generador SVG por piezas
(`AvatarIllustration`) queda como respaldo para datos antiguos. Para
no binario se usa el conjunto completo mientras producto entrega
ilustraciones propias.

### Escenas Lottie animadas en el carrusel de dummies
**Fecha:** 2026-10-22

Producto entregó una animación Lottie de escena de perfil
("Chispa_Valeria_Playa", 264×276, loop de 3 s). Se integra como segundo
medio del carrusel para ~30% de los dummies (asignación determinista con
el PRNG de la zona), en `public/dummies/lottie/`. Se guarda como fila
`media` kind `avatar` storage `static` posición 1 — el esquema no cambia;
el carrusel detecta `.json`/`.lottie` y lo reproduce con dotLottie
(fotograma fijo con `prefers-reduced-motion`). Más escenas solo se
agregan a `PROFILE_SCENES` en `src/sim/avatars.ts`.

### Scripts de npm
`npm run build` corre `tsc --noEmit && vite build` con un solo tsconfig
(sin project references) para mantener la configuración mínima.

### Catálogo ampliado de avatares (22 ilustraciones nuevas)
Producto entregó 23 imágenes más (carpeta Chipo); una era duplicado exacto
(mismo hash MD5), así que se integraron 22: 13 mujeres y 9 hombres, ya
clasificadas por género y redimensionadas a 512 px (~30 KB cada una) para
no inflar el precache de la PWA. El catálogo queda en 29 (17 mujeres,
12 hombres). La migración `002_avatar_catalog.sql` redistribuye los
avatares de dummies ya sembrados usando `avatar_seed` (determinista),
para que las zonas existentes también muestren la variedad nueva sin
re-sembrar.

### Todos los perfiles en la ZM de Monterrey y baraja por distancia
Producto pidió que todos los perfiles ya dados de alta vivan en la zona
metropolitana de Monterrey. La migración `003_monterrey_metro.sql` los
reubica de forma determinista alrededor de 12 núcleos de la ZM (Centro,
San Pedro, Guadalupe, San Nicolás, Apodaca, Escobedo, Santa Catarina,
Cumbres, Mitras, Valle Oriente, Barrio Antiguo, Contry) y actualiza su
`area_label`. Además, la baraja ya no filtra por la celda `zone_key`
(~1 km, frágil al mover el pin): ahora considera todos los dummies y el
tope lo pone el filtro duro de distancia (`maxDistanceKm`). El `zone_key`
se conserva solo para no re-sembrar zonas ya generadas. Los likes
sembrados al explorar una zona nueva se limitan a los dummies recién
creados para no duplicarlos.

### Búsqueda de lugares más rápida y confiable
La instancia pública de Photon a veces tarda o falla. El buscador ahora:
cancela la petición anterior al teclear (una respuesta vieja no pisa a la
nueva), corta a los 7 s, reintenta una vez ante error, refuerza el sesgo
local con `zoom=12` y `location_bias_scale=0.4`, reintenta sin sesgo si
la búsqueda local no arroja nada, y muestra "Buscando…" mientras espera.
El debounce de 350 ms, mínimo 3 caracteres, `limit=5`, caché y la
prohibición de Nominatim (CLAUDE.md §3) se conservan.

### El gesto de Pasar ahora es hacia arriba
Producto pidió invertirlo: arrastrar hacia abajo choca con el gesto de
recargar la pantalla (pull-to-refresh) del navegador en celulares. Pasar
se lanza de abajo hacia arriba; hacia abajo la tarjeta ahora se resiste.
CLAUDE.md §6 quedó actualizado. La tarjeta ya tenía `touch-action: none`
y el body `overscroll-behavior-y: none`, pero algunos navegadores
disparan el refresh de todos modos.
