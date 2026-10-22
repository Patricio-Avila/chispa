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

### Scripts de npm
`npm run build` corre `tsc --noEmit && vite build` con un solo tsconfig
(sin project references) para mantener la configuración mínima.
