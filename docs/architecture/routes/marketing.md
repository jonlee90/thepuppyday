# Marketing Site Routes - Architecture Documentation

> **Module**: Public Marketing Site
> **Status**: ✅ Completed (Phase 2)
> **Base Path**: `(marketing)/`
> **Authentication**: Not Required

## Overview

The marketing site is the public-facing portion of The Puppy Day application. It serves as the primary customer acquisition channel with SEO-optimized content, service information, photo galleries, and prominent booking CTAs.

### Key Features

- **Dynamic Content Management**: All content editable via admin panel (site_content table)
- **SEO Optimization**: Server-side rendering with dynamic metadata
- **Responsive Design**: Mobile-first, Clean & Elegant Professional aesthetic
- **Booking Integration**: Embedded booking widget with smooth transitions
- **Performance**: Image optimization, lazy loading, ISR (Incremental Static Regeneration)

---

## Route Structure

```
src/app/(marketing)/
├── layout.tsx                    # Marketing layout with header/footer
├── page.tsx                      # Homepage (/)
└── book/
    ├── page.tsx                  # Booking page (/book)
    └── loading.tsx               # Booking page loading state
```

### Route Group Behavior

The `(marketing)` directory is a **route group** (parentheses notation) that:
- Does NOT create a URL segment (routes are `/`, `/book`, not `/marketing/`)
- Shares common layout (header, footer, announcement bars)
- Groups related public pages together

---

## Routes

### 1. Homepage (`/`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(marketing)\page.tsx`

**Purpose**: Primary landing page for customer acquisition

**Component Composition**:
```tsx
<main>
  <PromoBannerCarousel />        {/* Promotional announcements */}
  <HeroSection />                {/* Above-fold hero with CTA */}
  <ServiceGrid />                {/* Service cards with pricing */}
  <BeforeAfterCarousel />        {/* Before/after comparison sliders */}
  <GalleryGrid />                {/* Photo gallery with lightbox */}
  <AboutSection />               {/* Business information */}
  <ContactSection />             {/* Contact info, hours, map */}
  <EmbeddedBookingWidget />      {/* Embedded booking flow */}
  <GroomingToolDecoration />     {/* Decorative SVG elements */}
</main>
```

**Data Fetching** (Server Component):
```typescript
async function getMarketingData() {
  const supabase = await createServerSupabaseClient();

  const [siteContent, servicesRes, bannersRes, beforeAfterRes, galleryRes, settingsRes] =
    await Promise.all([
      getSiteContent(),                                    // CMS content
      supabase.from('services').select('*').eq('is_active', true),
      supabase.from('promo_banners').select('*').eq('is_active', true),
      supabase.from('before_after_pairs').select('*'),
      supabase.from('gallery_images').select('*').eq('is_published', true),
      supabase.from('settings').select('*').single()
    ]);

  return { siteContent, services, banners, beforeAfterPairs, galleryImages, settings };
}
```

**SEO Metadata** (Dynamic):
```typescript
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteContent();

  return {
    title: seo.page_title,                           // e.g., "Puppy Day | Dog Grooming La Mirada"
    description: seo.meta_description,
    keywords: ['pet grooming', 'dog grooming', 'La Mirada', ...],
    openGraph: {
      title: seo.og_title,
      description: seo.og_description,
      images: [{ url: seo.og_image_url, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', ... },
    robots: { index: true, follow: true },
  };
}
```

**Revalidation Strategy**:
```typescript
export const revalidate = 5; // ISR: Revalidate every 5 seconds
```

**Performance Optimizations**:
- Parallel data fetching with `Promise.all()`
- Server-side rendering (SSR) for SEO
- Incremental Static Regeneration (ISR) for fast page loads
- Image optimization via `next/image`
- Lazy loading for below-fold content

---

### 2. Booking Page (`/book`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(marketing)\book\page.tsx`

**Purpose**: Standalone booking page for direct appointment scheduling

**Component**:
```tsx
<Suspense fallback={<BookingPageSkeleton />}>
  <BookingWizard preSelectedServiceId={serviceId} />
</Suspense>
```

**Query Parameters**:
- `?service=<service_id>` - Pre-selects a service (optional)

**Use Cases**:
1. Direct booking link from marketing materials
2. Service-specific CTAs (e.g., "Book Basic Grooming")
3. Email campaign links

**Loading State**:
```tsx
function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] animate-pulse">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 h-16" />
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 h-20" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="h-96 bg-white rounded-2xl shadow-lg" />
      </div>
    </div>
  );
}
```

**Metadata**:
```typescript
export const metadata = {
  title: 'Book Appointment | Puppy Day',
  description: 'Book your dog grooming appointment at Puppy Day in La Mirada, CA',
};
```

---

## Layout (`layout.tsx`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(marketing)\layout.tsx`

**Purpose**: Shared layout for all marketing pages

**Structure**:
```tsx
<>
  <AnnouncementBars />  {/* Top announcement banners */}
  <Header />            {/* Navigation with logo, links, Book CTA */}
  <main className="min-h-screen">
    {children}          {/* Page content */}
  </main>
  <Footer businessInfo={businessInfo} /> {/* Footer with contact info */}
</>
```

**Data Fetching**:
```typescript
const businessInfo = await getBusinessInfo(); // Fetches from site_content table
```

**Components**:

### AnnouncementBars
- Displays active promotional banners
- Dismissible with localStorage persistence
- Customizable background/text colors
- Optional CTA link

### Header
- Fixed/sticky navigation
- Logo (SVG dog silhouette)
- Navigation links (Home, Services, Gallery, About, Contact)
- "Book Now" CTA button
- Mobile hamburger menu
- Smooth scroll to sections

### Footer
- Business information (address, phone, email)
- Business hours
- Social media links (Instagram, Yelp)
- Legal links (Privacy Policy, Terms of Service)
- Copyright notice

---

## Data Flow

### CMS Content System

**Database Table**: `site_content`

```typescript
interface SiteContent {
  id: string;
  key: string;           // e.g., "hero_title", "about_description"
  value: string;         // Content value
  description: string;   // Admin-facing description
  created_at: string;
  updated_at: string;
}
```

**Helper Function** (`C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\site-content.ts`):

```typescript
export async function getSiteContent() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('site_content').select('*');

  return {
    hero: {
      title: findContent(data, 'hero_title'),
      subtitle: findContent(data, 'hero_subtitle'),
      cta_text: findContent(data, 'hero_cta_text'),
    },
    about: {
      title: findContent(data, 'about_title'),
      description: findContent(data, 'about_description'),
      mission: findContent(data, 'about_mission'),
    },
    seo: {
      page_title: findContent(data, 'seo_page_title'),
      meta_description: findContent(data, 'seo_meta_description'),
      og_title: findContent(data, 'seo_og_title'),
      og_description: findContent(data, 'seo_og_description'),
      og_image_url: findContent(data, 'seo_og_image_url'),
    },
    // ... more sections
  };
}
```

**Admin Editing**:
- Admin panel provides UI for editing site content
- Changes reflect on frontend after 5-second revalidation
- No code deployment required for content updates

---

## Dependencies

### Internal
- `@/components/marketing/*` - Marketing components
- `@/lib/supabase/server` - Server-side Supabase client
- `@/lib/site-content` - CMS content helpers
- `@/types/database` - TypeScript types

### External
- `next` - App Router, metadata, image optimization
- `react` - Component library
- `framer-motion` - Scroll animations

---

## State Management

**No global state required** - Marketing site is primarily static content fetched server-side.

**Local state** (component-level):
- Lightbox open/close (Gallery)
- Mobile menu toggle (Header)
- Carousel active slide (BeforeAfter, PromoBanner)
- Announcement bar dismissal (localStorage)

---

## API Endpoints

Marketing pages consume these public API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/services` | GET | Fetch active services with pricing |
| `/api/availability` | GET | Check appointment availability (booking widget) |

**Note**: All data fetching happens server-side in page components, not via client-side API calls.

---

## Security

**Public Access**: No authentication required

**RLS Policies**:
- `services`: Public read access (active services only)
- `site_content`: Public read access
- `promo_banners`: Public read access (active banners only)
- `gallery_images`: Public read access (published images only)

**Rate Limiting**: Not implemented (static content, low risk)

---

## SEO Strategy

### Server-Side Rendering
All pages use Next.js App Router SSR for optimal SEO:
- HTML rendered on server
- Search engines receive fully-rendered content
- Fast initial page load

### Dynamic Metadata
```typescript
export async function generateMetadata(): Promise<Metadata> {
  // Fetch latest SEO data from database
  const { seo } = await getSiteContent();
  return { title: seo.page_title, ... };
}
```

### Structured Data (Schema.org)
```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Puppy Day",
  "image": seo.og_image_url,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "14936 Leffingwell Rd",
    "addressLocality": "La Mirada",
    "addressRegion": "CA",
    "postalCode": "90638",
    "addressCountry": "US"
  },
  "telephone": "(657) 252-2903",
  "openingHours": "Mo-Sa 09:00-17:00",
};
```

### Image Optimization
```tsx
<Image
  src={imageUrl}
  alt={altText}
  width={1200}
  height={630}
  priority={aboveFold}  // Above-fold images
  loading={belowFold ? 'lazy' : 'eager'}
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### Performance Metrics
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Lighthouse Score**: 95+ (Performance, SEO, Accessibility)

---

## Accessibility

### WCAG AA Compliance

**Color Contrast**:
- Text on background: 4.5:1 minimum ratio
- Primary (#434E54) on cream (#F8EEE5): 7.2:1 ✅

**Keyboard Navigation**:
- All interactive elements focusable
- Visible focus indicators (ring-2 ring-primary)
- Skip to content link

**Screen Reader Support**:
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ARIA labels for icons and image links
- Alt text for all images

**Responsive Design**:
- Mobile-first approach
- Touch targets ≥ 44x44px
- No horizontal scrolling

---

## Performance Optimization

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="Professional dog grooming"
  width={1920}
  height={1080}
  priority  // Above-fold images
/>
```

### Code Splitting
- Automatic route-based code splitting (Next.js)
- Lazy loading for below-fold components
- Dynamic imports for heavy components

### Caching Strategy
```typescript
export const revalidate = 5; // ISR: Revalidate every 5 seconds

// Fetch with caching
const services = await fetch('/api/services', {
  next: { revalidate: 60 } // Cache for 60 seconds
});
```

### Bundle Size
- Tree shaking (unused code removed)
- Minimal dependencies for marketing pages
- Optimized images (WebP format with fallbacks)

---

## Analytics Integration

### Google Analytics (Future Enhancement)
```tsx
// In layout.tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

### Conversion Tracking
- Track "Book Now" CTA clicks
- Monitor form submissions
- Measure booking completion rate

---

## Examples

### Example 1: Adding a New Section to Homepage

```tsx
// 1. Create component
// src/components/marketing/testimonials-section.tsx
export function TestimonialsSection({ testimonials }) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          What Our Customers Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <TestimonialCard key={t.id} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

// 2. Add to page.tsx
import { TestimonialsSection } from '@/components/marketing/testimonials-section';

export default async function HomePage() {
  const { testimonials } = await getMarketingData();

  return (
    <main>
      <HeroSection />
      <ServiceGrid />
      <TestimonialsSection testimonials={testimonials} />  {/* New section */}
      <BeforeAfterCarousel />
      {/* ... */}
    </main>
  );
}

// 3. Update data fetching
async function getMarketingData() {
  const testimonialsRes = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('display_order');

  return { testimonials: testimonialsRes.data, ... };
}
```

### Example 2: Updating CMS Content

```typescript
// Admin panel updates site_content table:
await supabase
  .from('site_content')
  .update({ value: 'New Hero Title!' })
  .eq('key', 'hero_title');

// Frontend automatically reflects change after 5 seconds (ISR revalidation)
```

### Example 3: Pre-Selecting Service in Booking Widget

```tsx
// CTA link on service card
<Link href={`/book?service=${service.id}`}>
  <Button variant="primary">Book This Service</Button>
</Link>

// Booking page receives and uses pre-selected service
export default async function BookPage({ searchParams }) {
  const { service } = await searchParams;
  return <BookingWizard preSelectedServiceId={service} />;
}
```

---

## Testing

### Unit Tests
```typescript
// Test CMS content helper
describe('getSiteContent', () => {
  it('returns structured content from database', async () => {
    const content = await getSiteContent();
    expect(content.hero.title).toBeDefined();
    expect(content.seo.page_title).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// Test homepage data fetching
describe('HomePage', () => {
  it('fetches and displays all marketing data', async () => {
    const data = await getMarketingData();
    expect(data.services.length).toBeGreaterThan(0);
    expect(data.banners).toBeDefined();
  });
});
```

### E2E Tests (Future)
- Test booking flow from homepage CTA
- Verify mobile navigation
- Check image lazy loading

---

## Future Enhancements

1. **Blog System**: Add `/blog` route with SEO-optimized articles
2. **Multi-Language Support**: i18n for Spanish-speaking customers
3. **A/B Testing**: Test different hero messages and CTAs
4. **Customer Reviews**: Display Google/Yelp reviews dynamically
5. **Live Chat**: Integrate customer support chat widget
6. **Video Gallery**: Add before/after transformation videos
7. **Booking Widget Customization**: Allow service-specific custom fields

---

## Related Documentation

- [Booking Flow Architecture](../components/booking-flow.md)
- [Marketing Components](../components/ui-components.md#marketing-components)
- [SEO Strategy](./seo-strategy.md) (Future)
- [CMS Content Management](../services/cms.md) (Future)

---

**Last Updated**: 2025-12-20
**Maintained By**: Development Team
