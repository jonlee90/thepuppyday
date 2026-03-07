# Marketing Site Routes - Architecture Documentation

> **Module**: Public Marketing Site
> **Status**: Completed (Phase 2)
> **Base Path**: `(marketing)/`
> **Authentication**: Not Required
> **Last Updated**: 2026-03-06

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
└── book/
    ├── page.tsx            # Booking page (/book)
    └── loading.tsx         # Booking page loading skeleton
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

**Component Render Order**:
```tsx
<div className="bg-[#FFFBF7]">
  <PromoBannerCarousel />       {/* Active promo banners carousel */}
  <HeroSection />               {/* Above-fold hero with CTA */}
  <BeforeAfterCarousel />       {/* Before/after transformation sliders */}
  <ServiceGrid />               {/* Service cards with pricing */}
  <GalleryGrid />               {/* Photo gallery grid */}
  <TestimonialsSection />       {/* Hardcoded Yelp reviews with groomed dog photos */}
  <AboutSection />              {/* Business info and trust signals */}
  <ContactSection />            {/* Contact info, phone, email, address */}
  {/* Schema.org structured data (JSON-LD) */}
</div>
```

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

**Structured Data**: Schema.org `LocalBusiness` JSON-LD with dynamic business info, opening hours, geo coordinates, and aggregate rating.

---

### 2. Booking Page (`/book`)

**File**: `src/app/(marketing)/book/page.tsx`

Standalone booking page with `BookingWizard` component.

**Query Parameters**: `?service=<service_id>` to pre-select a service.

**Loading State** (`book/loading.tsx`): Skeleton placeholder for booking wizard.

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
- Fixed navigation with logo, section links (Home, Services, Gallery, About, Contact)
- "Book Now" CTA button
- Mobile hamburger menu

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
Schema.org `LocalBusiness` with address, phone, hours, geo, ratings, and social links.

### ISR
Pages revalidate every 15 minutes (900 seconds) matching banner cache TTL.

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
