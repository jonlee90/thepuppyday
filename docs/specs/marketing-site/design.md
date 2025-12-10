# Marketing Site Design

## Overview

The marketing site is a single-page application (SPA) that serves as the public homepage for The Puppy Day. It uses Next.js 16 App Router with server-side rendering (SSR) for optimal SEO, while incorporating client-side interactivity for animations and dynamic features.

## Architecture

### Page Structure

```
src/app/
├── page.tsx                    # Marketing homepage (public route)
├── layout.tsx                  # Root layout (already exists)
└── (marketing)/               # Marketing route group
    ├── layout.tsx             # Marketing-specific layout with header/footer
    └── page.tsx               # Marketing page content
```

### Component Hierarchy

```
MarketingLayout
├── Header (sticky)
│   ├── Logo
│   ├── Navigation (desktop)
│   ├── MobileMenu (mobile hamburger)
│   └── CTAButton (Book Now)
│
└── Main Content
    ├── HeroSection
    │   ├── HeroImage
    │   ├── Headline + Tagline
    │   └── PrimaryCTA
    │
    ├── PromoBanner (conditional)
    │   └── BannerCarousel (if multiple)
    │
    ├── ServicesSection
    │   ├── SectionHeader
    │   └── ServiceGrid
    │       └── ServiceCard[]
    │           ├── ServiceIcon
    │           ├── ServiceDetails
    │           └── PriceDisplay
    │
    ├── AboutSection
    │   ├── AboutContent
    │   ├── KeyDifferentiators
    │   └── LocationInfo
    │
    ├── GallerySection
    │   ├── BeforeAfterComparison
    │   │   ├── ComparisonSlider[]
    │   │   │   ├── BeforeImage
    │   │   │   ├── AfterImage
    │   │   │   └── SliderHandle
    │   │   └── CarouselControls
    │   │
    │   └── GalleryGrid
    │       ├── GalleryImage[]
    │       └── Lightbox (modal)
    │
    ├── ContactSection
    │   ├── ContactInfo
    │   │   ├── PhoneNumber (tel: link)
    │   │   ├── EmailAddress (mailto: link)
    │   │   └── Address (maps link)
    │   ├── BusinessHours
    │   │   └── OpenStatus (real-time)
    │   └── MapEmbed (optional)
    │
    ├── FinalCTASection
    │   ├── CTAHeadline
    │   └── BookingButton
    │
    └── Footer
        ├── QuickLinks
        ├── SocialMedia
        └── Copyright
```

## Data Models

### Gallery Image

```typescript
interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  category?: 'before_after' | 'regular' | 'featured';
  display_order: number;
  created_at: string;
}
```

### Before/After Pair

```typescript
interface BeforeAfterPair {
  id: string;
  before_image_url: string;
  after_image_url: string;
  pet_name?: string;
  description?: string;
  display_order: number;
  created_at: string;
}
```

### Promotional Banner

```typescript
interface PromoBanner {
  id: string;
  title: string;
  description: string;
  cta_text?: string;
  cta_url?: string;
  background_color?: string;
  text_color?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  display_order: number;
}
```

### Site Content (CMS-like)

```typescript
interface SiteContent {
  id: string;
  key: string; // e.g., 'hero_headline', 'about_text'
  content: string | object;
  updated_at: string;
}

// Specific content keys:
// - hero_headline: string
// - hero_tagline: string
// - hero_image_url: string
// - about_title: string
// - about_description: string
// - about_differentiators: string[]
```

### Business Hours (from existing settings table)

```typescript
interface BusinessHours {
  monday: { open: string; close: string; is_open: boolean };
  tuesday: { open: string; close: string; is_open: boolean };
  wednesday: { open: string; close: string; is_open: boolean };
  thursday: { open: string; close: string; is_open: boolean };
  friday: { open: string; close: string; is_open: boolean };
  saturday: { open: string; close: string; is_open: boolean };
  sunday: { open: string; close: string; is_open: boolean };
}
```

## Database Schema Extensions

### Add Before/After Pairs Table

```sql
CREATE TABLE before_after_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  pet_name TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_before_after_display_order ON before_after_pairs(display_order);
```

### Extend Gallery Images Table

The existing `gallery_images` table needs a category field:

```sql
ALTER TABLE gallery_images
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'regular'
CHECK (category IN ('before_after', 'regular', 'featured'));

CREATE INDEX idx_gallery_category ON gallery_images(category);
```

## API Endpoints / Data Fetching

### Server Components (RSC) - Direct DB Queries

```typescript
// src/app/(marketing)/page.tsx
async function getMarketingData() {
  const supabase = createClient();

  const [services, galleryImages, beforeAfterPairs, promoBanners, siteContent, settings] =
    await Promise.all([
      supabase.from('services').select('*').eq('is_active', true).order('display_order'),
      supabase.from('gallery_images').select('*').order('display_order').limit(12),
      supabase.from('before_after_pairs').select('*').order('display_order').limit(5),
      supabase.from('promo_banners').select('*').eq('is_active', true).order('display_order'),
      supabase.from('site_content').select('*'),
      supabase.from('settings').select('*').single(),
    ]);

  return {
    services: services.data || [],
    galleryImages: galleryImages.data || [],
    beforeAfterPairs: beforeAfterPairs.data || [],
    promoBanners: promoBanners.data || [],
    siteContent: siteContent.data || [],
    businessHours: settings.data?.business_hours || {},
  };
}
```

## Component Specifications

### 1. Header Component

**File:** `src/components/marketing/header.tsx`

```typescript
'use client';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Features:
  // - Sticky positioning
  // - Transparent initially, solid background on scroll
  // - Desktop: horizontal nav links
  // - Mobile: hamburger menu (slide-in drawer)
  // - Logo links to homepage
  // - CTA button always visible
}
```

### 2. Hero Section

**File:** `src/components/marketing/hero-section.tsx`

```typescript
'use client';

interface HeroSectionProps {
  headline: string;
  tagline: string;
  imageUrl: string;
}

export function HeroSection({ headline, tagline, imageUrl }: HeroSectionProps) {
  // Features:
  // - Full viewport height (min-h-screen)
  // - Background image with overlay
  // - Animated entrance (fade + slide up)
  // - Responsive typography
  // - Primary CTA button
}
```

### 3. Before/After Comparison Slider

**File:** `src/components/marketing/before-after-slider.tsx`

```typescript
'use client';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  altText?: string;
}

export function BeforeAfterSlider({ beforeImage, afterImage, altText }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Features:
  // - Two overlapping images
  // - Clip-path on after image based on slider position
  // - Draggable handle (mouse + touch events)
  // - Position state: 0-100 (percentage)
  // - Visual handle indicator

  const handleMouseMove = (e: MouseEvent) => {
    // Calculate percentage based on mouse X position
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Calculate percentage based on touch X position
  };
}
```

**Implementation approach:**
```tsx
<div ref={containerRef} className="relative w-full h-96 overflow-hidden">
  {/* Before Image (full width) */}
  <Image src={beforeImage} alt={altText} fill className="object-cover" />

  {/* After Image (clipped based on slider position) */}
  <div
    className="absolute inset-0"
    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
  >
    <Image src={afterImage} alt={altText} fill className="object-cover" />
  </div>

  {/* Slider Handle */}
  <div
    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
    style={{ left: `${sliderPosition}%` }}
    onMouseDown={handleDragStart}
  >
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
      {/* Arrow icons */}
    </div>
  </div>
</div>
```

### 4. Service Card

**File:** `src/components/marketing/service-card.tsx`

```typescript
interface ServiceCardProps {
  service: Service;
  onLearnMore?: () => void;
}

export function ServiceCard({ service, onLearnMore }: ServiceCardProps) {
  // Features:
  // - Icon/image
  // - Service name and description
  // - Price display (with size range if applicable)
  // - Hover animation
  // - Optional expand/modal for full details
}
```

### 5. Gallery Grid with Lightbox

**File:** `src/components/marketing/gallery-grid.tsx`

```typescript
'use client';

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Features:
  // - Responsive grid (CSS Grid)
  // - Image optimization (Next.js Image)
  // - Click to open lightbox
  // - Lightbox: full-screen modal with prev/next navigation
  // - Keyboard navigation (arrow keys, escape)
}
```

### 6. Business Hours Display

**File:** `src/components/marketing/business-hours.tsx`

```typescript
'use client';

interface BusinessHoursProps {
  hours: BusinessHours;
}

export function BusinessHours({ hours }: BusinessHoursProps) {
  const [currentStatus, setCurrentStatus] = useState<'open' | 'closed'>('closed');
  const [nextOpenTime, setNextOpenTime] = useState<string>('');

  useEffect(() => {
    // Calculate if currently open based on current time
    // Determine next opening time if closed
  }, [hours]);

  // Features:
  // - List of hours for each day
  // - Highlight current day
  // - Real-time "Open Now" / "Closed" status
  // - "Opens at X" if currently closed
}
```

### 7. Promo Banner Carousel

**File:** `src/components/marketing/promo-banner.tsx`

```typescript
'use client';

interface PromoBannerProps {
  banners: PromoBanner[];
}

export function PromoBanner({ banners }: PromoBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissed status
    const isDismissed = localStorage.getItem('promo_banner_dismissed');
    if (isDismissed) setDismissed(true);

    // Auto-rotate banners if multiple exist
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const handleDismiss = () => {
    localStorage.setItem('promo_banner_dismissed', 'true');
    setDismissed(true);
  };
}
```

## Styling & Design System

### Color Palette

Using DaisyUI theme variables with custom overrides:

```css
/* Primary brand colors */
--color-primary: #FF6B9D;      /* Playful pink */
--color-secondary: #4ECDC4;    /* Calming teal */
--color-accent: #FFE66D;       /* Cheerful yellow */

/* Semantic colors */
--color-success: #95E1D3;
--color-warning: #FFD93D;
--color-error: #F38181;

/* Neutrals */
--color-base-100: #FFFFFF;
--color-base-200: #F8F9FA;
--color-base-300: #E9ECEF;
```

### Typography

```css
/* Headings */
--font-heading: 'Geist Sans', system-ui, sans-serif;
--font-body: 'Geist Sans', system-ui, sans-serif;

h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; }
h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 600; }
h3 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 600; }
```

### Spacing System

Following Tailwind's spacing scale (4px base unit):
- Section padding: `py-16 md:py-24` (64px - 96px)
- Container max-width: `max-w-7xl`
- Grid gaps: `gap-6 md:gap-8`

### Animation Guidelines

Using Framer Motion for:
- Scroll-triggered animations (fade-in, slide-up)
- Hero entrance animation
- Service card hover effects
- Gallery image hover zoom
- CTA button interactions

```typescript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};
```

## SEO Implementation

### Meta Tags

```typescript
// src/app/(marketing)/page.tsx
export const metadata: Metadata = {
  title: 'The Puppy Day - Professional Dog Grooming in La Mirada, CA',
  description: 'Professional pet grooming services in La Mirada, CA. Book your appointment online for a gentle, stress-free grooming experience.',
  keywords: ['dog grooming', 'pet grooming', 'La Mirada', 'California', 'pet salon', 'dog spa'],
  openGraph: {
    title: 'The Puppy Day - Professional Dog Grooming',
    description: 'Professional pet grooming services in La Mirada, CA',
    images: ['/images/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Puppy Day - Professional Dog Grooming',
    description: 'Professional pet grooming services in La Mirada, CA',
    images: ['/images/og-image.jpg'],
  },
};
```

### Structured Data (JSON-LD)

```typescript
// src/components/marketing/structured-data.tsx
export function StructuredData({ settings }: { settings: any }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://thepuppyday.com',
    name: 'The Puppy Day',
    description: 'Professional dog grooming services in La Mirada, CA',
    url: 'https://thepuppyday.com',
    telephone: settings.phone,
    email: settings.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address_line1,
      addressLocality: 'La Mirada',
      addressRegion: 'CA',
      postalCode: settings.zip_code,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: settings.latitude,
      longitude: settings.longitude,
    },
    openingHoursSpecification: [
      // Map business hours to OpeningHoursSpecification format
    ],
    priceRange: '$$',
    image: '/images/logo.png',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

## Performance Optimizations

### Image Optimization

- Use Next.js `<Image>` component with:
  - `priority` for hero image
  - `loading="lazy"` for gallery images
  - `placeholder="blur"` with blurDataURL
  - Responsive `sizes` prop

### Code Splitting

- Marketing components loaded on-demand
- Lightbox component lazy-loaded
- Banner carousel lazy-loaded if not visible

### Font Loading

```typescript
// app/layout.tsx
import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});
```

## Responsive Breakpoints

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### Mobile-First Approach

- Default styles for mobile (< 768px)
- Use `md:` prefix for tablet and up
- Use `lg:` prefix for desktop and up

## Accessibility

### ARIA Labels

- Navigation landmarks (`<nav>`, `<main>`, `<footer>`)
- Button labels for icon-only buttons
- Alt text for all images
- Focus management for modals

### Keyboard Navigation

- Tab order follows visual order
- Escape key closes modals/lightbox
- Arrow keys navigate carousel
- Enter/Space activate buttons

### Color Contrast

- Minimum 4.5:1 ratio for normal text
- Minimum 3:1 ratio for large text
- Focus indicators visible on all interactive elements

## File Structure

```
src/
├── app/
│   └── (marketing)/
│       ├── layout.tsx
│       └── page.tsx
├── components/
│   └── marketing/
│       ├── header.tsx
│       ├── footer.tsx
│       ├── hero-section.tsx
│       ├── service-card.tsx
│       ├── service-grid.tsx
│       ├── before-after-slider.tsx
│       ├── before-after-carousel.tsx
│       ├── gallery-grid.tsx
│       ├── lightbox.tsx
│       ├── business-hours.tsx
│       ├── contact-section.tsx
│       ├── promo-banner.tsx
│       ├── cta-section.tsx
│       └── structured-data.tsx
└── lib/
    └── utils/
        ├── business-hours.ts
        └── image-optimization.ts
```

## Mock Data Updates

Add seed data for marketing content:

```typescript
// src/mocks/supabase/seed.ts

export const seedBeforeAfterPairs: BeforeAfterPair[] = [
  {
    id: 'ba1',
    before_image_url: '/images/before-after/fluffy-before.jpg',
    after_image_url: '/images/before-after/fluffy-after.jpg',
    pet_name: 'Fluffy',
    description: 'Full grooming transformation',
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  // ... more pairs
];

export const seedSiteContent: SiteContent[] = [
  {
    id: 'sc1',
    key: 'hero_headline',
    content: 'Your Pet Deserves the Best',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sc2',
    key: 'hero_tagline',
    content: 'Professional grooming with a gentle touch in La Mirada, CA',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sc3',
    key: 'about_description',
    content: 'At The Puppy Day, we provide stress-free grooming experiences...',
    updated_at: new Date().toISOString(),
  },
];
```

## Testing Strategy

### Unit Tests

- Business hours calculation logic
- Image slider position calculations
- Banner rotation logic

### Integration Tests

- Service card rendering with different price structures
- Gallery lightbox navigation
- Mobile menu interactions

### E2E Tests (Playwright)

- Complete user journey: visit homepage → view services → click CTA
- Gallery interaction flow
- Mobile responsiveness tests

## Migration Path

1. Create new database tables (`before_after_pairs`)
2. Update existing tables (`gallery_images` add category)
3. Seed initial marketing content
4. Build components in isolation (Storybook recommended)
5. Integrate into marketing page
6. Performance audit with Lighthouse
7. SEO validation with Google Search Console
