/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheableResponsePlugin, Serwist } from 'serwist';

// Prevent caching 502/5xx error responses that can get stuck after deployments.
// Without this, the SW's runtime cache captures Nginx 502 pages during deploys
// and serves them even after the server recovers.
const cacheableOkPlugin = new CacheableResponsePlugin({ statuses: [0, 200] });
const safeCache = defaultCache.map((entry) => {
  if (entry.handler && 'plugins' in entry.handler) {
    entry.handler.plugins = [...(entry.handler.plugins || []), cacheableOkPlugin];
  }
  return entry;
});

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: safeCache,
  cleanupOutdatedCaches: true,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

// Clean up bad cache entries on activate (e.g., cached 502 responses from deploys)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          return Promise.all(
            requests.map(async (request) => {
              const response = await cache.match(request);
              if (response && !response.ok) {
                await cache.delete(request);
              }
            })
          );
        })
      )
    )
  );
});

serwist.addEventListeners();
