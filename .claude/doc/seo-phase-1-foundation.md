# SEO Phase 1: Foundation — Site Architecture & Core Components

Set up the foundational data layer, reusable SEO components, technical SEO files, and navigation updates that all subsequent phases depend on.

**Progress**: 13/13 tasks complete (100%)

---

## Section 1.1: Data Layer

### Task 1: Create services data mapping
- [x] Create `src/data/services.ts` with slug-to-database-name mapping for all 7 services
- [x] Export `SERVICE_SLUGS` array: `['dog-bath', 'dog-haircut', 'breed-specific-styling', 'nail-trimming', 'teeth-brushing', 'deshedding', 'flea-tick-treatment']`
- [x] Map each slug to its DB service name (e.g., `'dog-bath' -> 'basic'`), display name, H1 title, meta description, primary keyword, and pricing source (`'service_prices'` or `'addons'`)
- [x] Export helper `getServiceBySlug(slug: string)` returning the config or null
- [x] Export TypeScript type `ServiceConfig`
- **Files**: `src/data/services.ts`

### Task 2: Create cities data mapping
- [x] Create `src/data/cities.ts` with config for 9 cities (La Mirada, Norwalk, Buena Park, Whittier, Santa Fe Springs, Cerritos, Hacienda Heights, Fullerton, Brea)
- [x] Each city config includes: slug, name, distance, driving direction, key landmarks/neighborhoods, meta title, meta description, H1 title
- [x] Export `CITY_SLUGS` array and `getCityBySlug(slug: string)` helper
- [x] Export TypeScript type `CityConfig`
- **Files**: `src/data/cities.ts`

---

## Section 1.2: Reusable SEO Components

### Task 3: Create SchemaOrg component
- [x] Create `src/components/common/SchemaOrg.tsx` as a server component
- [x] Accept a generic `schema` prop (JSON-LD object or array of objects)
- [x] Render `<script type="application/ld+json">` with properly serialized and sanitized JSON
- [x] Ensure only server-controlled data is passed (no user input) to prevent injection
- **Files**: `src/components/common/SchemaOrg.tsx`

### Task 4: Create Breadcrumb component
- [x] Create `src/components/common/Breadcrumb.tsx`
- [x] Accept `items` prop: array of `{ label: string; href?: string }` (last item has no href)
- [x] Render visible breadcrumb nav with `>` separators, styled per design system (charcoal text, terracotta hover)
- [x] Include `BreadcrumbList` JSON-LD schema via `SchemaOrg` component
- [x] Use `aria-label="Breadcrumb"` and proper `<nav>` semantics
- **Files**: `src/components/common/Breadcrumb.tsx`

### Task 5: Create CTABooking component
- [x] Create `src/components/common/CTABooking.tsx` as a client component (triggers booking modal)
- [x] Accept `phone` prop passed from server parent
- [x] Render a booking CTA block: heading (customizable via prop), phone link, and "Book Now" button that triggers the booking modal
- [x] Style with warm cream background, rounded corners, soft shadow
- [x] Accept optional `heading` and `subheading` props for per-page customization
- **Files**: `src/components/common/CTABooking.tsx`

### Task 6: Create FAQAccordion component
- [x] Create `src/components/marketing/FAQAccordion.tsx`
- [x] Accept `items` prop: array of `{ question: string; answer: string }`
- [x] Use Framer Motion animated button/disclosure pattern
- [x] Include `FAQPage` JSON-LD schema inline (client component)
- [x] Animate open/close with Framer Motion
- [x] Style per design system (charcoal text, soft borders, rounded corners)
- [x] Added to barrel export in `src/components/marketing/index.ts`
- **Files**: `src/components/marketing/FAQAccordion.tsx`

### Task 7: Create GoogleMapEmbed component
- [x] Create `src/components/common/GoogleMapEmbed.tsx`
- [x] Accept `query` prop for the map location
- [x] Render a responsive Google Maps iframe (free embed, no API key needed)
- [x] Use `loading="lazy"` on the iframe
- [x] Add proper `title` attribute for accessibility
- [x] Wrap in a responsive container with rounded corners
- **Files**: `src/components/common/GoogleMapEmbed.tsx`

---

## Section 1.3: Technical SEO Files

### Task 8: Create dynamic sitemap.ts
- [x] Create `src/app/sitemap.ts` (at app root, NOT inside marketing route group)
- [x] Generate entries for: homepage, services hub + 7 service pages, areas hub + 9 city pages, blog index + 12 blog posts, FAQ, about, contact, gallery, reviews
- [x] Set appropriate `priority` and `changeFrequency` per page type
- [x] Use `MetadataRoute.Sitemap` type
- [x] Imports `SERVICE_SLUGS` and `CITY_SLUGS` from data layer
- **Files**: `src/app/sitemap.ts`

### Task 9: Create robots.ts
- [x] Create `src/app/robots.ts` (at app root)
- [x] Allow all crawlers on `/`
- [x] Disallow `/admin/`, `/login/`, `/api/`
- [x] Reference sitemap at `https://thepuppyday.com/sitemap.xml`
- **Files**: `src/app/robots.ts`

---

## Section 1.4: Navigation & Layout Updates

### Task 10: Update marketing layout metadata
- [x] Update `src/app/(marketing)/layout.tsx` to add title template: `'%s | Puppy Day Dog Grooming La Mirada'`
- [x] Set default title fallback
- [x] Keep existing layout functionality intact
- **Files**: `src/app/(marketing)/layout.tsx`

### Task 11: Update Header navigation
- [x] Modify `src/components/marketing/Header.tsx`
- [x] Replace hash-based links with proper Next.js `<Link>` routes: Services (`/services`), Gallery (`/gallery`), Reviews (`/reviews`), About Us (`/about`), Contact (`/contact`)
- [x] Use `usePathname()` for active state detection instead of scroll-based section detection
- [x] Keep mobile menu working with new links
- [x] Maintain existing styling and animations
- **Files**: `src/components/marketing/Header.tsx`

### Task 12: Update Footer with expanded links
- [x] Modify `src/components/marketing/Footer.tsx`
- [x] Add "Services" section with links to all 7 service pages
- [x] Add "Areas We Serve" section with links to all 9 city pages
- [x] Add "Quick Links" section with links to all pages including Blog, FAQ
- [x] Keep existing contact info and social links (dynamic from `getBusinessInfo()`)
- [x] 6-column responsive grid layout
- **Files**: `src/components/marketing/Footer.tsx`

---

## Section 1.5: Verification

### Task 13: Phase 1 build verification
- [x] Run `npm run build` — compiled successfully (23.7s). Only pre-existing Playwright type error in e2e/
- [x] Lint passes on all new files (only pre-existing `any` casts flagged)
- [x] All new components import correctly
- [x] Header/Footer nav links point to correct paths
