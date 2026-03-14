# PWA Implementation Plan — The Puppy Day

## Context

The Puppy Day is a dog grooming SaaS app (Next.js 16, App Router, Turbopack) with zero PWA infrastructure. The goal is to make the app **installable** on mobile/desktop for both customers and staff, with **basic offline support** (fallback page + cached static assets). This is an MVP — push notifications, IndexedDB, and background sync are deferred to a future phase.

**Technology choice: Serwist** — the actively maintained successor to next-pwa, with native Turbopack compatibility. Uses Workbox under the hood.

---

## Implementation Steps

### Step 1: Install Serwist

```bash
npm install @serwist/next serwist
```

### Step 2: Generate PWA Icons

Source: `public/images/logo.png`
Target directory: `public/icons/`

| File | Size | Purpose |
|------|------|---------|
| `icon-192x192.png` | 192×192 | Android home screen, manifest |
| `icon-384x384.png` | 384×384 | Android splash |
| `icon-512x512.png` | 512×512 | PWA install / splash |
| `maskable-icon-512x512.png` | 512×512 | Maskable (10% safe-zone padding) |
| `apple-touch-icon.png` | 180×180 | iOS home screen |

Use `sharp` (one-time script) or online tool to resize.

### Step 3: Create Web App Manifest

**New file:** `src/app/manifest.ts`

- `name`: "The Puppy Day - Dog Grooming"
- `short_name`: "Puppy Day"
- `display`: "standalone"
- `background_color`: "#F8EEE5" (warm cream)
- `theme_color`: "#434E54" (charcoal)
- `orientation`: "portrait-primary"
- `start_url`: "/"
- Icons array referencing Step 2 assets (including maskable)

Next.js auto-discovers `manifest.ts` — no manual `<link>` needed.

### Step 4: Update Root Layout Meta Tags

**File:** `src/app/layout.tsx`

Changes:
1. Add `Viewport` export with `themeColor: '#434E54'`
2. Update `metadata.icons` to point to new icon paths (`/icons/icon-192x192.png`, `/icons/apple-touch-icon.png`)
3. Add `metadata.other` with:
   - `mobile-web-app-capable: 'yes'`
   - `apple-mobile-web-app-capable: 'yes'`
   - `apple-mobile-web-app-status-bar-style: 'default'`
   - `apple-mobile-web-app-title: 'Puppy Day'`

### Step 5: Create Service Worker

**New file:** `src/sw.ts`

```ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{
      url: '/~offline',
      matcher({ request }) { return request.destination === 'document'; },
    }],
  },
});
serwist.addEventListeners();
```

- `defaultCache` provides: cache-first for static assets, network-first for pages, network-only for API
- `skipWaiting + clientsClaim` = instant activation
- Offline fallback for uncached navigation requests

### Step 6: Configure Serwist in Next.js Config

**File:** `next.config.mjs`

Wrap existing config with Serwist plugin:

```js
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

// ... existing nextConfig ...

export default withSerwist(nextConfig);
```

**Also add `worker-src 'self'`** to the CSP directives in the same file (alongside existing script-src, connect-src, etc.).

### Step 7: Create Offline Fallback Page

**New file:** `src/app/~offline/page.tsx`

Client component matching the design of `src/app/not-found.tsx`:
- Same gradient background (`from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7]`)
- WifiOff icon in circular `bg-[#EAE0D5]` container
- PawPrint accent
- White card with "You're Offline" heading
- "Try Again" button (calls `window.location.reload()`)
- Link back to homepage
- Help text with contact email

### Step 8: TypeScript Config for Service Worker

**File:** `tsconfig.json`

Add `"webworker"` to `lib` array. If this causes type conflicts, create a `src/worker-env.d.ts` file instead with `/// <reference lib="webworker" />`.

### Step 9: Update .gitignore

**File:** `.gitignore`

Add Serwist build artifacts:
```
# Serwist service worker build output
public/sw.js
public/sw.js.map
public/swe-worker-*.js
```

---

## Caching Strategy (MVP)

| Content Type | Strategy | Rationale |
|---|---|---|
| Static assets (JS, CSS, fonts) | Cache-first | Versioned by content hash, safe to cache aggressively |
| Marketing pages (ISR) | Stale-while-revalidate | Show cached version instantly, refresh in background |
| Admin/customer pages (SSR) | Network-first | Always prefer fresh data, fallback to cache |
| API routes | Network-only | No caching for mutations or real-time data |
| Uncached navigation | Offline fallback page | Branded `/~offline` page |

All handled by Serwist's `defaultCache` — no custom routing rules needed for MVP.

---

## Files to Modify

| File | Action |
|------|--------|
| `next.config.mjs` | Wrap with Serwist plugin + add `worker-src` to CSP |
| `src/app/layout.tsx` | Add Viewport export + PWA meta tags + update icon paths |
| `tsconfig.json` | Add `"webworker"` to lib |
| `.gitignore` | Add SW build artifacts |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/manifest.ts` | Web app manifest |
| `src/sw.ts` | Service worker entry |
| `src/app/~offline/page.tsx` | Offline fallback page |
| `public/icons/*.png` | PWA icon assets (5 files) |

---

## Verification

1. **Build test**: `npm run build` — verify no errors from Serwist plugin
2. **Local test**: `npm run build && npm start` → Chrome DevTools > Application tab:
   - Manifest loads with correct name, icons, theme color
   - Service worker registers and activates
   - Cache Storage shows precached assets
3. **Offline test**: DevTools > Network > Offline toggle:
   - Uncached pages show branded `/~offline` fallback
   - Previously visited pages load from cache
4. **Install test**: Chrome address bar install icon / mobile "Add to Home Screen"
   - App opens in standalone mode with correct splash/theme
5. **Lighthouse**: Run PWA audit — target all core checks passing
6. **iOS Safari**: Share > Add to Home Screen — verify apple-touch-icon and standalone mode

---

## Future Phases (Not in MVP)

- **Phase 2**: Push notifications (VAPID keys, subscription storage, appointment reminders)
- **Phase 3**: Offline data (IndexedDB for past appointments, loyalty points, service menu)
- **Phase 4**: Background sync (queue booking mutations when offline, retry on reconnect)
