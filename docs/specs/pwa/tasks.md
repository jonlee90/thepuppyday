# PWA Implementation - Implementation Tasks

## Overview

Convert The Puppy Day web application into a Progressive Web App (PWA) using Serwist. This MVP phase covers installability on mobile/desktop, basic offline support via a branded fallback page, cached static assets using Serwist's `defaultCache`, and all required metadata and configuration changes.

**Progress**: 0/10 tasks complete (0%)

**Document References**:
- Design: `docs/specs/pwa/design.md`
- Implementation Plan: `.claude/doc/pwa-implementation-plan.md`

---

## Section 1: Dependencies and Build Configuration

### Task 0018: Install Serwist Packages
- [ ] Install `@serwist/next` as a production dependency
- [ ] Install `serwist` as a dev dependency
- [ ] Verify packages are added to `package.json` and `package-lock.json`
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Both `@serwist/next` and `serwist` appear in `package.json` dependencies; `npm install` completes without errors
- **References**: Design Section "Technology Choice: Serwist", Implementation Plan Step 1
- **Files**: `package.json`

### Task 0019: Update .gitignore with Serwist Build Artifacts
- [ ] Add `public/sw.js` to `.gitignore`
- [ ] Add `public/sw.js.map` to `.gitignore`
- [ ] Add `public/swe-worker-*.js` to `.gitignore`
- [ ] Add a comment header `# Serwist service worker build output` above the entries
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Build artifacts are gitignored; running `git status` after a build does not show `public/sw.js` or related files as untracked
- **References**: Design Section "Build Artifacts (Gitignored)", Implementation Plan Step 9
- **Files**: `.gitignore`

---

## Section 2: PWA Icon Assets

### Task 0020: Generate PWA Icon Assets from Source Logo
- [ ] Create `scripts/generate-pwa-icons.ts` using `sharp` to resize `public/images/logo.png`
- [ ] Generate `public/icons/icon-192x192.png` (192x192)
- [ ] Generate `public/icons/icon-384x384.png` (384x384)
- [ ] Generate `public/icons/icon-512x512.png` (512x512)
- [ ] Generate `public/icons/maskable-icon-512x512.png` (512x512 with 10% safe-zone padding, warm cream `#F8EEE5` background)
- [ ] Generate `public/icons/apple-touch-icon.png` (180x180)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All 5 icon files exist in `public/icons/` at the correct dimensions; maskable icon has visible padding around the logo; script is runnable with `npx tsx scripts/generate-pwa-icons.ts`
- **References**: Design Section "Icon Asset Specifications", Implementation Plan Step 2
- **Files**: `scripts/generate-pwa-icons.ts`, `public/icons/icon-192x192.png`, `public/icons/icon-384x384.png`, `public/icons/icon-512x512.png`, `public/icons/maskable-icon-512x512.png`, `public/icons/apple-touch-icon.png`

---

## Section 3: Web App Manifest

### Task 0021: Create Web App Manifest
- [ ] Create `src/app/manifest.ts` exporting a function returning `MetadataRoute.Manifest`
- [ ] Set `name` to `"The Puppy Day - Dog Grooming"`, `short_name` to `"Puppy Day"`
- [ ] Set `display: "standalone"`, `orientation: "portrait-primary"`, `start_url: "/"`
- [ ] Set `background_color: "#F8EEE5"` (warm cream), `theme_color: "#434E54"` (charcoal)
- [ ] Include icons array with all 4 entries (192, 384, 512, maskable 512) with correct `src`, `sizes`, `type`, and `purpose` fields
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Visiting `/manifest.webmanifest` returns valid JSON with all required PWA manifest fields; all icon paths resolve to existing files
- **References**: Design Section "1. Web App Manifest", Implementation Plan Step 3
- **Files**: `src/app/manifest.ts`

---

## Section 4: Service Worker and Next.js Configuration

### Task 0022: Create Service Worker Source File
- [ ] Create `src/sw.ts` with Serwist configuration
- [ ] Import `defaultCache` from `@serwist/next/worker` and `Serwist`, `PrecacheEntry`, `SerwistGlobalConfig` from `serwist`
- [ ] Declare `WorkerGlobalScope` extending `SerwistGlobalConfig` with `__SW_MANIFEST`
- [ ] Configure Serwist with `precacheEntries: self.__SW_MANIFEST`, `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true`, `runtimeCaching: defaultCache`
- [ ] Add `fallbacks.entries` for document requests falling back to `/~offline`
- [ ] Call `serwist.addEventListeners()`
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: File compiles without TypeScript errors; service worker configuration matches the design document exactly
- **References**: Design Section "2. Service Worker", Implementation Plan Step 5
- **Files**: `src/sw.ts`

### Task 0023: Create TypeScript Worker Environment Declaration
- [ ] Create `src/worker-env.d.ts` with `/// <reference lib="webworker" />` directive
- [ ] Update `tsconfig.json` to add `"@serwist/next/typings"` to the `compilerOptions.types` array
- [ ] Update `tsconfig.json` to add `"public/sw.js"` to the `exclude` array
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: No TypeScript errors related to `ServiceWorkerGlobalScope` or Serwist types; `public/sw.js` is excluded from type checking
- **References**: Design Section "6. TypeScript Configuration", Implementation Plan Step 8
- **Files**: `src/worker-env.d.ts`, `tsconfig.json`

### Task 0024: Integrate Serwist into Next.js Configuration
- [ ] Add `import withSerwistInit from '@serwist/next'` at the top of `next.config.mjs`
- [ ] Initialize `withSerwist` with `swSrc: 'src/sw.ts'`, `swDest: 'public/sw.js'`, `disable: process.env.NODE_ENV === 'development'`, and `additionalPrecacheEntries: [{ url: '/~offline', revision: crypto.randomUUID() }]`
- [ ] Add `"worker-src 'self'"` as a new line in the CSP directives array (after `"form-action 'self'"`)
- [ ] Change `export default nextConfig` to `export default withSerwist(nextConfig)` -- the Serwist wrapper must be the outermost layer
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: `npm run build` completes without errors from the Serwist plugin; `public/sw.js` is generated after build; CSP headers include `worker-src 'self'`
- **References**: Design Section "4. Next.js Configuration Changes", Implementation Plan Step 6
- **Files**: `next.config.mjs`

---

## Section 5: Root Layout Metadata Updates

### Task 0025: Update Root Layout with PWA Metadata and Viewport Export
- [ ] Add `Viewport` import from `next` alongside existing `Metadata` import
- [ ] Export a `viewport` constant of type `Viewport` with `themeColor: '#434E54'`
- [ ] Add `applicationName: 'Puppy Day'` to the existing `metadata` export
- [ ] Update `metadata.icons` to `{ icon: '/icons/icon-192x192.png', apple: '/icons/apple-touch-icon.png' }`
- [ ] Add `appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Puppy Day' }` to metadata
- [ ] Add `formatDetection: { telephone: false }` to metadata
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Page source includes `<meta name="theme-color" content="#434E54">`; `<meta name="apple-mobile-web-app-capable" content="yes">`; icon link tags point to `/icons/` paths; existing metadata (title, description, keywords, openGraph) is fully preserved
- **References**: Design Section "5. Root Layout Updates", Implementation Plan Step 4
- **Files**: `src/app/layout.tsx`

---

## Section 6: Offline Fallback Page

### Task 0026: Create Branded Offline Fallback Page
- [ ] Create `src/app/~offline/page.tsx` as a `'use client'` component
- [ ] Match the visual design of `src/app/not-found.tsx`: same gradient background (`from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7]`), white card with `rounded-xl shadow-lg`, `text-[#434E54]` heading
- [ ] Use `WifiOff` icon from `lucide-react` in a circular `bg-[#EAE0D5]` container (replacing the 404 text)
- [ ] Add `PawPrint` accent overlay for visual consistency with the 404 page
- [ ] Display "You're Offline" heading, descriptive paragraph explaining the user has no internet connection
- [ ] Add a "Try Again" button that calls `window.location.reload()` using the project's `Button` component with `variant="primary"`
- [ ] Add a link back to homepage `/`
- [ ] Add help text footer with `puppyday14936@gmail.com` contact email
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Page renders correctly at `/~offline`; visual design is consistent with the 404 page; "Try Again" button triggers page reload; page works as a client component served from service worker cache
- **References**: Design Section "3. Offline Fallback Page", Implementation Plan Step 7
- **Files**: `src/app/~offline/page.tsx`

---

## Section 7: Testing and Verification

### Task 0027: Write Automated Tests for PWA Manifest and Offline Page
- [ ] Create `__tests__/pwa/manifest.test.ts` that imports and validates the manifest function output:
  - Required fields present (`name`, `short_name`, `start_url`, `display`, `icons`)
  - At least one 192x192 icon and one 512x512 icon
  - At least one icon with `purpose: "maskable"`
  - Colors match design system (`background_color: "#F8EEE5"`, `theme_color: "#434E54"`)
  - `display` is `"standalone"`
- [ ] Create `__tests__/pwa/offline-page.test.tsx` that renders the offline page component and asserts:
  - "You're Offline" heading is present
  - "Try Again" button is present
  - Homepage link is present
  - Contact email `puppyday14936@gmail.com` is present
- [ ] All tests pass with `npm run test`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Both test files pass; manifest test validates all required PWA fields; offline page test confirms all UI elements render
- **References**: Design Section "6. Automated Tests (Vitest)"
- **Files**: `__tests__/pwa/manifest.test.ts`, `__tests__/pwa/offline-page.test.tsx`
