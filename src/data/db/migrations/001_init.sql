create table app_user (
  id uuid primary key default gen_random_uuid(),
  is_dummy boolean not null default false,
  name text not null,
  birthdate date not null,
  gender text not null check (gender in ('mujer','hombre','no_binario')),
  seeking text[] not null,
  age_min int not null default 18,
  age_max int not null default 45,
  max_distance_km int not null default 25,
  bio text,
  interests text[] not null default '{}',
  lat double precision,
  lng double precision,
  area_label text,
  personality text check (personality in ('bromista','directa','timida')), -- solo dummies
  pickiness real,                                                            -- solo dummies, 0..1
  avatar_seed int,                                                           -- solo dummies
  zone_key text,                                                             -- zona en la que se generó
  created_at timestamptz not null default now()
);

create table location_context (
  user_id uuid primary key references app_user(id) on delete cascade,
  mode text not null check (mode in ('aqui','voy')),
  lat double precision not null,
  lng double precision not null,
  label text not null,
  radius_km int not null default 10,
  date_from date,
  date_to date,
  updated_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  kind text not null check (kind in ('photo','video','avatar')),
  position int not null,
  storage text not null check (storage in ('opfs','idb','static','generated')),
  path text not null,
  poster_path text,
  duration_s real,
  created_at timestamptz not null default now()
);

create table swipe (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references app_user(id) on delete cascade,
  to_user uuid not null references app_user(id) on delete cascade,
  action text not null check (action in ('skip','pasar','match')),
  created_at timestamptz not null default now()
);

create table media_like (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references app_user(id) on delete cascade,
  to_user uuid not null references app_user(id) on delete cascade,
  media_id uuid references media(id) on delete cascade, -- null = like al perfil
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

create table match (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references app_user(id) on delete cascade,
  user_b uuid not null references app_user(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table message (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references match(id) on delete cascade,
  sender uuid not null references app_user(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table chat_state (
  match_id uuid primary key references match(id) on delete cascade,
  node text not null,
  updated_at timestamptz not null default now()
);

create table notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  type text not null check (type in ('like_perfil','like_media','match','mensaje')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- app_meta la crea el runner de migraciones antes de correr esta migración
-- (necesita leer schema_version). Se deja aquí como referencia del esquema.
create table if not exists app_meta (
  key text primary key,
  value jsonb not null
);
-- Claves: schema_version, seed_version, onboarding_step, local_user_id,
--         notif_prompt_snoozed_until, incoming_likes_session_count

-- Distancia aproximada entre dos coordenadas, en km (fórmula de haversine).
-- Decisión anotada en docs/decisiones.md: se usa esto en lugar de PostGIS.
create or replace function haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;
