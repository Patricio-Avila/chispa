import './TabGuard.css'

/**
 * PGlite es de una sola conexión: si la app ya está abierta en otra pestaña,
 * esta pestaña se bloquea con un mensaje (caso borde de CLAUDE.md §8.4).
 */
export function TabBlockedScreen() {
  return (
    <div className="tab-blocked">
      <h1 className="text-title">La app ya está abierta en otra pestaña</h1>
      <p className="text-body tab-blocked__note">
        Cierra esta pestaña y sigue usando Chispa en la que ya tenías abierta.
      </p>
    </div>
  )
}

/**
 * Intenta tomar el candado de pestaña única. Devuelve false si otra
 * pestaña ya lo tiene. El candado se retiene hasta cerrar la pestaña.
 */
export function acquireTabLock(): Promise<boolean> {
  if (!('locks' in navigator)) {
    return Promise.resolve(true)
  }
  return new Promise((resolve) => {
    navigator.locks
      .request('chispa-single-tab', { ifAvailable: true }, (lock) => {
        resolve(lock !== null)
        if (lock === null) {
          return
        }
        // Nunca se resuelve: retiene el candado mientras viva la pestaña.
        return new Promise<void>(() => {})
      })
      .catch(() => resolve(true))
  })
}
