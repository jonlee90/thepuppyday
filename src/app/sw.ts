/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

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
  runtimeCaching: defaultCache,
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

// Bypass browser HTTP cache for page navigations.
// Prevents stale cached 502 error pages from being served after deploys.
// Must be registered BEFORE serwist.addEventListeners() so it takes priority.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        if (response.ok) return response;
        // Server returned an error — fall back to offline page
        return caches.match('/~offline') ?? response;
      })
      .catch(() =>
        caches.match('/~offline') ??
        new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      )
  );
});

serwist.addEventListeners();
