// Self-destructing service worker. Replaces the old Serwist SW that was caching
// 502 responses. Installs -> activates -> unregisters -> clears caches ->
// reloads every controlled client. No-op for users who never had the old SW.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    try {
      await self.registration.unregister();
    } catch {}
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    } catch {}
  })());
});

self.addEventListener('fetch', () => {});
