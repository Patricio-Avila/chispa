/* Clic en una notificación del sistema: enfoca la app (o la abre)
   en la ruta indicada. Importado por el service worker generado. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const route = (event.notification.data && event.notification.data.route) || '/likes'
  const scope = self.registration.scope // p. ej. https://usuario.github.io/chispa/
  const targetUrl = scope + '#' + route
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(scope) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
