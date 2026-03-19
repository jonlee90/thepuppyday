/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  StaleWhileRevalidate,
  Serwist,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Custom runtime caching that rejects non-200 responses for navigation/API caches
const runtimeCaching = [
  // Google Fonts stylesheets
  {
    matcher: ({ url }: { url: URL }) => url.origin === 'https://fonts.googleapis.com',
    handler: new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 })],
    }),
  },
  // Google Fonts webfonts
  {
    matcher: ({ url }: { url: URL }) => url.origin === 'https://fonts.gstatic.com',
    handler: new StaleWhileRevalidate({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      ],
    }),
  },
  // Static assets (JS, CSS)
  {
    matcher: ({ request }: { request: Request }) =>
      request.destination === 'script' || request.destination === 'style',
    handler: new StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      ],
    }),
  },
  // Images
  {
    matcher: ({ request }: { request: Request }) => request.destination === 'image',
    handler: new StaleWhileRevalidate({
      cacheName: 'images',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      ],
    }),
  },
  // Pages / navigation — ONLY cache 200 responses
  {
    matcher: ({ request }: { request: Request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: 'pages',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }),
      ],
    }),
  },
  // RSC responses — ONLY cache 200
  {
    matcher: ({ request }: { request: Request }) =>
      request.headers.get('RSC') === '1' || request.headers.get('Next-Router-State-Tree') != null,
    handler: new NetworkFirst({
      cacheName: 'rsc',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }),
      ],
    }),
  },
  // API routes — ONLY cache 200
  {
    matcher: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
    handler: new NetworkFirst({
      cacheName: 'apis',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 }),
      ],
    }),
  },
  // Catch-all — ONLY cache 200
  {
    matcher: () => true,
    handler: new NetworkFirst({
      cacheName: 'others',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
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

// Allow purging bad caches on demand from the client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PURGE_BAD_CACHES') {
    const dynamicCaches = ['pages', 'rsc', 'others', 'apis'];
    event.waitUntil(
      Promise.all(
        dynamicCaches.map(async (name) => {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          return Promise.all(
            requests.map(async (req) => {
              const res = await cache.match(req);
              if (res && !res.ok) {
                await cache.delete(req);
              }
            })
          );
        })
      )
    );
  }
});

serwist.addEventListeners();
