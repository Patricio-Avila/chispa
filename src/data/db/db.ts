import { PGliteWorker } from '@electric-sql/pglite/worker'
import migration001 from './migrations/001_init.sql?raw'

/**
 * Capa mínima de acceso a datos para la Fase 1.
 * Las pantallas no deben importar esto directamente: a partir de la Fase 2
 * se accede vía las interfaces de repositorio (src/data/repo).
 */

const DB_NAME = 'chispa'

let pg: PGliteWorker | null = null

function getDb(): PGliteWorker {
  if (!pg) {
    pg = new PGliteWorker(
      new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    )
  }
  return pg
}

const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1, sql: migration001 },
]

let initPromise: Promise<void> | null = null

export function initDb(): Promise<void> {
  // Deduplicado: StrictMode (en dev) o varios llamadores concurrentes
  // no deben correr las migraciones dos veces.
  initPromise ??= runInit().catch((error) => {
    initPromise = null
    throw error
  })
  return initPromise
}

async function runInit(): Promise<void> {
  const db = getDb()
  await db.waitReady
  // app_meta se crea antes de todo: el runner la necesita para schema_version.
  await db.exec(
    'create table if not exists app_meta (key text primary key, value jsonb not null)',
  )
  const current = (await getMeta<number>('schema_version')) ?? 0
  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      // Transacción: si la migración se interrumpe (recarga, error),
      // no deja la base a medias sin actualizar schema_version.
      await db.exec(
        `begin;\n${migration.sql}\n;\ninsert into app_meta (key, value) values ('schema_version', '${migration.version}'::jsonb)
         on conflict (key) do update set value = excluded.value;\ncommit;`,
      )
    }
  }
}

export async function query<T>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getDb().query<T>(sql, params)
  return result.rows
}

export type QueryFn = <T>(sql: string, params?: unknown[]) => Promise<T[]>

/** Agrupa muchas escrituras en una transacción: una sola sincronización
 *  a IndexedDB en lugar de una por query (clave para sembrar zonas). */
export async function withTransaction<T>(
  fn: (txQuery: QueryFn) => Promise<T>,
): Promise<T> {
  const db = getDb()
  const result = await db.transaction(async (tx) => {
    const txQuery: QueryFn = async <R>(sql: string, params?: unknown[]) => {
      const res = await tx.query<R>(sql, params)
      return res.rows
    }
    return fn(txQuery)
  })
  return result as T
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const rows = await query<{ value: T }>(
    'select value from app_meta where key = $1',
    [key],
  )
  return rows[0]?.value ?? null
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await query(
    `insert into app_meta (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, JSON.stringify(value)],
  )
}

/** Borra la base local por completo (botón "Borrar datos locales"). */
export async function wipeLocalData(): Promise<void> {
  if (pg) {
    await pg.close()
    pg = null
  }
  const names = [`/pglite/${DB_NAME}`, DB_NAME]
  await Promise.all(
    names.map(
      (name) =>
        new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(name)
          request.onsuccess = () => resolve()
          request.onerror = () => resolve()
          request.onblocked = () => resolve()
        }),
    ),
  )
}
