# Marketing Site Routes - Architecture Documentation

> **Module**: Public Marketing Site
> **Status**: Completed (Phase 2 + SEO Phase)
> **Base Path**: `(marketing)/`
> **Authentication**: Not Required
> **Last Updated**: 2026-05-03

## Overview

The marketing site is the public-facing portion of The Puppy Day application. It serves as the primary customer acquisition channel with SEO-optimized content, service information, photo galleries, testimonials, and prominent booking CTAs.

---

## Route Structure

```
src/app/(marketing)/
├── layout.tsx              # Marketing layout (Header, Footer, StickyBookingButton)
├── page.tsx                # Homepage (/)
├── loading.tsx             # Homepage loading skeleton
├── error.tsx               # Marketing error boundary
├── about/
│   └── page.tsx            # About page (/about)
├── blog/
│   ├── page.tsx            # Blog index (/blog)
│   ├── signs-dog-needs-grooming/
│   │   └── page.tsx        # Blog article
│   ├── dog-grooming-cost-la-mirada/
│   │   └── page.tsx        # Blog article
│   └── goldendoodle-grooming-guide/
│       └── page.tsx        # Blog article
├── book/
│   ├── page.tsx            # Booking page (/book)
│   └── loading.tsx         # Booking page loading skeleton
├── contact/
│   └── page.tsx            # Contact page (/contact)
├── dog-grooming/
│   ├── page.tsx            # Location hub (/dog-grooming)
│   └── [city]/
│       └── page.tsx        # City-specific SEO page (/dog-grooming/la-mirada)
├── faq/
│   └── page.tsx            # FAQ page (/faq)
├── gallery/
│   └── page.tsx            # Gallery page (/gallery)
├── privacy/
│   └── page.tsx            # Privacy policy (/privacy)
├── reviews/
│   └── page.tsx            # Reviews page (/reviews)
├── services/
│   ├── page.tsx            # Services listing (/services)
│   └── [slug]/
│       └── page.tsx        # Individual service page (/services/basic-grooming)
├── terms/
│   └── page.tsx            # Terms of service (/terms)
├── review/
│   ├── page.tsx            # Review submission (/review) — landing page from review-request email
│   └── ReviewForm.tsx
└── accessibility/
    └── page.tsx            # Accessibility statement (/accessibility)
```

### Public Routes Outside `(marketing)/`

```
src/app/
├── unsubscribe/
│   ├── success/page.tsx    # /unsubscribe/success — email unsubscribe confirmation
│   └── error/page.tsx      # /unsubscribe/error  — invalid/expired token landing
└── (public)/
    └── report-cards/
        └── [uuid]/page.tsx # /report-cards/[uuid] — public report card share link
```

### Additional SEO Files

```
src/app/
├── robots.ts               # Robots.txt generation
└── sitemap.ts              # Sitemap XML generation
```

### Route Group Behavior

The `(marketing)` directory is a route group that does NOT create a URL segment. Routes are `/` and `/book` (not `/marketing/`).

---

## Routes

### 1. Homepage (`/`)

**File**: `src/app/(marketing)/page.tsx`

Server component that fetches all marketing data in parallel and renders sections.

**Component Render Order** (post-refactor — `Section` wrappers each own their `<section>` element):
```tsx
<div className="bg-[#FFFBF7]">
  <PromoBannerCarousel />       {/* Active promo banners carousel */}
  <HeroSection />               {/* Above-fold hero with CTA */}
  <BeforeAfterSection />        {/* Wraps BeforeAfterCarousel */}
  <ServiceSection />            {/* Service cards with pricing (was ServiceGrid) */}
  <GallerySection />            {/* Photo gallery grid (was GalleryGrid) */}
  <TestimonialsSection />       {/* Yelp reviews with groomed dog photos */}
  <AboutSection />              {/* Business info and trust signals */}
  <ContactSection />            {/* Contact info, phone, email, address */}
  {/* Schema.org structured data (JSON-LD) */}
</div>
```

All marketing components are imported from the barrel export `@/components/marketing` (`src/components/marketing/index.ts`). See [marketing-dynamic-content.md](../marketing-dynamic-content.md) for content sources.

**Data Fetching** (Server Component):
```typescript
async function getMarketingData() {
  const [siteContent, servicesRes, bannersRes, beforeAfterRes, galleryRes, settingsRes] =
    await Promise.all([
      getSiteContent(),
      supabase.from('services').select('*, prices:service_prices(*)').eq('is_active', true),
      supabase.from('promo_banners').select('*').eq('is_active', true),
      supabase.from('before_after_pairs').select('*'),
      supabase.from('gallery_images').select('*').eq('is_published', true),
      supabase.from('settings').select('*').single(),
    ]);
  // ...
}
```

**Dynamic SEO Metadata**: Generated from `site_content` table via `getSiteContent()`. Includes OpenGraph, Twitter card, robots directives, and Google bot config.

**Revalidation**:
```typescript
export const revalidate = 900; // ISR: Revalidate every 15 minutes
```

**Structured Data**: Schema.org `LocalBusiness` JSON-LD with dynamic business info, opening hours, geo coordinates, social links, and **dynamic `aggregateRating`** computed from real reviews (re-introduced in commit `1b042f7` once the review-collection flow began producing verified data; city pages also include their own `aggregateRating`).

---

### 2. Booking Page (`/book`)

**File**: `src/app/(marketing)/book/page.tsx`

Standalone booking page with `BookingWizard` component.

**Query Parameters**: `?service=<service_id>` to pre-select a service.

**Loading State** (`book/loading.tsx`): Skeleton placeholder for booking wizard.

---

### 3. Services (`/services`)

**File**: `src/app/(marketing)/services/page.tsx`

Services listing page with all active grooming services and pricing.

### 4. Service Detail (`/services/[slug]`)

**File**: `src/app/(marketing)/services/[slug]/page.tsx`

Individual service page with detailed description, size-based pricing, and booking CTA. Dynamic route using service slug.

### 5. Blog (`/blog`)

**File**: `src/app/(marketing)/blog/page.tsx`

Blog index page listing all SEO articles. Individual articles use static routes (not dynamic `[slug]`):

| Article | Route |
|---------|-------|
| Signs Your Dog Needs Grooming | `/blog/signs-dog-needs-grooming` |
| Dog Grooming Cost in La Mirada | `/blog/dog-grooming-cost-la-mirada` |
| Goldendoodle Grooming Guide | `/blog/goldendoodle-grooming-guide` |

### 6. Location-Based SEO Pages (`/dog-grooming`)

**File**: `src/app/(marketing)/dog-grooming/page.tsx` (hub) + `[city]/page.tsx` (city pages)

Location hub page linking to city-specific landing pages. Each city page targets "dog grooming in [city]" keywords. Renamed from `/areas` for better SEO keyword ranking.

### 7. About (`/about`)

**File**: `src/app/(marketing)/about/page.tsx` — Business story, team, and trust signals.

### 8. Contact (`/contact`)

**File**: `src/app/(marketing)/contact/page.tsx` — Contact form, map, business info.

### 9. Gallery (`/gallery`)

**File**: `src/app/(marketing)/gallery/page.tsx` — Full photo gallery with lightbox.

### 10. Reviews (`/reviews`)

**File**: `src/app/(marketing)/reviews/page.tsx` — Customer reviews and ratings (read-only display).

### 10a. Review Submission (`/review`)

**File**: `src/app/(marketing)/review/page.tsx` (with `ReviewForm.tsx`) — Public review collection landing page reached from the post-grooming review-request email. Submits to `POST /api/reviews/submit`. The collected reviews feed the dynamic `aggregateRating` on the homepage and city pages.

### 11. FAQ (`/faq`)

**File**: `src/app/(marketing)/faq/page.tsx` — Frequently asked questions.

### 12. Legal Pages

- **Privacy Policy** (`/privacy`): `src/app/(marketing)/privacy/page.tsx`
- **Terms of Service** (`/terms`): `src/app/(marketing)/terms/page.tsx`
- **Accessibility** (`/accessibility`): `src/app/(marketing)/accessibility/page.tsx`

### 13. Unsubscribe Landing Pages

These are public landing pages users hit after clicking the unsubscribe link in a notification email. They live **outside** the `(marketing)` group (no marketing layout) so they render minimally without the booking CTA.

- **Success** (`/unsubscribe/success`): `src/app/unsubscribe/success/page.tsx` — confirmation that the user's email was unsubscribed.
- **Error** (`/unsubscribe/error`): `src/app/unsubscribe/error/page.tsx` — shown when the unsubscribe token is invalid or expired.

The actual unsubscribe action runs through `GET /api/unsubscribe` (HMAC-signed token); these pages are the redirect targets.

---

## Layout (`layout.tsx`)

**File**: `src/app/(marketing)/layout.tsx`

Server component that fetches business info for the footer.

**Structure**:
```tsx
<BookingModalProvider>
  <Header />
  <main className="min-h-screen pt-[160px]">
    {children}
  </main>
  <Footer businessInfo={businessInfo} />
  <StickyBookingButton />
</BookingModalProvider>
```

**Components**:

### Header
- Fixed navigation with logo, section links (Services, Gallery, Reviews, About Us, Contact)
- Scroll spy highlights active section based on viewport position (sections: `services`, `gallery`, `testimonials`, `about`, `contact`)
- Logo click scrolls to top and resets active section
- "Sign In" CTA button (desktop), "Book Now" in mobile menu
- Mobile hamburger menu with AnimatePresence slide animation

### Footer
- Business info (address, phone, email)
- Business hours, social media links
- Legal links, copyright

### StickyBookingButton
- Floating "Book Now" button that appears after scrolling past 600px
- Opens the `BookingModal` in `customer` mode

### BookingModalProvider
- Wraps the layout to enable booking modal from any marketing page

---

## Error & Loading States

**Error Boundary** (`error.tsx`): Marketing-specific error page with retry, home link, and phone contact.

**Loading State** (`loading.tsx`): Full-page skeleton with hero, services, and gallery placeholders.

---

## SEO Strategy

### Server-Side Rendering
All pages rendered on the server for full SEO crawlability.

### Dynamic Metadata
Fetched from `site_content` database table, editable via admin panel.

### Structured Data
Schema.org `LocalBusiness` with address, phone, hours, geo, social links, and dynamic `aggregateRating` (computed from collected reviews — see review collection flow below).

### ISR
Pages revalidate every 15 minutes (900 seconds) matching banner cache TTL.

### Multi-Page SEO Architecture
- **Blog articles**: Targeting long-tail keywords (e.g., "dog grooming cost La Mirada", "signs dog needs grooming")
- **Location pages** (`/dog-grooming/[city]`): Targeting "[city] dog grooming" search queries for surrounding cities
- **Service pages** (`/services/[slug]`): Individual service pages with detailed descriptions and pricing
- **Standalone pages**: About, contact, gallery, reviews, FAQ each have dedicated URLs for search engine indexing

---

## Performance

- Parallel data fetching via `Promise.all()`
- ISR for fast page loads with fresh content
- Image optimization via `next/image`
- Conditional rendering (BeforeAfter and Gallery only show if data exists)

---

## API Endpoints Consumed

Marketing pages consume these public endpoints (all server-side):

| Endpoint | Purpose |
|----------|---------|
| `/api/services` | Active services with pricing |
| `/api/availability` | Appointment availability (booking widget) |
| `/api/booking/settings` | Booking configuration |

Data is primarily fetched directly via Supabase server client, not through API routes.

---

## Related Documentation

- [Booking Flow Architecture](../components/booking-flow.md)
- [API Routes](./api.md)
- [Admin Settings - Site Content](./admin-panel.md#11-settings)
