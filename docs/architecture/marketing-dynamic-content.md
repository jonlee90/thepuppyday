# Marketing Page — Dynamic Content Reference

> Maps every piece of admin-configurable content to its marketing page output.

## Data Flow

```
Admin Settings UI → Supabase (PostgreSQL) → Marketing Page (ISR, 15-min revalidation)
```

- **Server-side fetch**: All queries run in parallel via `Promise.all()` in `src/app/(marketing)/page.tsx`
- **Site content helper**: `getSiteContent()` from `src/lib/site-content.ts` (with hardcoded fallback defaults)
- **Cache**: Next.js ISR with `revalidate = 900` (15 minutes)

---

## 1. Site Content

**Admin UI**: `/admin/settings/site-content`
**Table**: `site_content` — section-based JSON storage (`section` + `content` columns)
**Helper**: `getSiteContent()`, `getHeroContent()`, `getSeoSettings()`, `getBusinessInfo()`

### Hero Section (`section = 'hero'`)

| Field | Type | Used By |
|-------|------|---------|
| `headline` | `string` | `HeroSection` component — main heading |
| `subheadline` | `string` | `HeroSection` — text below heading |
| `background_image_url` | `string \| null` | `HeroSection` — background image |
| `cta_buttons` | `CtaButton[]` | `HeroSection` — action buttons |

**CTA Button shape**: `{ text: string; url: string; style: 'primary' | 'secondary' }`

**Fallback**: "Professional Dog Grooming in La Mirada" headline, standard subheadline

### SEO Settings (`section = 'seo'`)

| Field | Type | Used By |
|-------|------|---------|
| `page_title` | `string` | `<title>` and `metadata.title` |
| `meta_description` | `string` | `metadata.description` |
| `og_title` | `string` | Open Graph title |
| `og_description` | `string` | Open Graph description |
| `og_image_url` | `string \| null` | Open Graph image |

### Business Info (`section = 'business_info'`)

| Field | Type | Used By |
|-------|------|---------|
| `name` | `string` | Footer, JSON-LD structured data |
| `address` | `string` | `ContactSection`, Footer, JSON-LD |
| `city` | `string` | `ContactSection`, Footer, JSON-LD |
| `state` | `string` | `ContactSection`, Footer, JSON-LD |
| `zip` | `string` | `ContactSection`, Footer, JSON-LD |
| `phone` | `string` | `ContactSection` (tel: link), Footer |
| `email` | `string` | `ContactSection` (mailto: link), Footer |
| `social_links.instagram` | `string?` | Footer social icons |
| `social_links.facebook` | `string?` | Footer social icons |
| `social_links.yelp` | `string?` | Footer social icons |
| `social_links.twitter` | `string?` | Footer social icons |

**Fallback**: 14936 Leffingwell Rd, La Mirada, CA 90638 / (657) 252-2903

---

## 2. Promo Banners

**Admin UI**: `/admin/settings/banners`
**Table**: `promo_banners`
**Component**: `PromoBannerCarousel`

| Field | Type | Notes |
|-------|------|-------|
| `image_url` | `string` | Required — banner image |
| `alt_text` | `string \| null` | Accessibility text |
| `click_url` | `string \| null` | Optional link destination |
| `is_active` | `boolean` | Server-side filter: `eq('is_active', true)` |
| `display_order` | `number` | Sort order |
| `start_date` | `string \| null` | ISO date — client-side date-range filter |
| `end_date` | `string \| null` | ISO date — client-side date-range filter |
| `click_count` | `number` | Analytics — tracked via `/api/banners/{id}/click` |
| `impression_count` | `number` | Analytics — tracked via `/api/banners/{id}/impression` |

**Behavior**:
- Single banner → static image
- Multiple banners → auto-rotates every 5 seconds with arrows and dots
- Date filtering happens client-side after fetch (compares `start_date`/`end_date` against today)
- Responsive heights: 200px mobile, 300px tablet, 400px desktop

---

## 3. Services & Add-ons

**Admin UI**: `/admin/settings` (services management)
**Tables**: `services`, `service_prices`, `addons`
**Component**: `ServiceSection` → `ServiceCard`

### Services

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Filtered: only services containing "basic" or "premium" are shown |
| `description` | `string \| null` | Displayed on card |
| `duration_minutes` | `number` | Displayed as duration |
| `image_url` | `string \| null` | Card image |
| `is_active` | `boolean` | Server-side filter |
| `display_order` | `number` | Sort order |

**Query**: `services` joined with `service_prices(*)` — provides size-based pricing.

### Service Prices (nested)

| Field | Type | Notes |
|-------|------|-------|
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | Weight-based size tier |
| `price` | `number` | Price per size |

### Add-ons

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Shown in third "add-ons" card |
| `price` | `number` | Shown alongside name |

**Query**: Only `id, name, price` selected, filtered by `is_active = true`.

**Important**: The service section always shows exactly 3 cards — first "basic" service, first "premium" service (highlighted as featured), and a hardcoded add-ons info card. Service feature icons and descriptions are partially hardcoded in the component.

---

## 4. Gallery Images

**Admin UI**: `/admin/settings` (gallery management)
**Table**: `gallery_images`
**Component**: `GallerySection` → `GalleryGrid`

| Field | Type | Notes |
|-------|------|-------|
| `image_url` | `string` | Required — gallery image |
| `caption` | `string \| null` | Used as alt text |
| `dog_name` | `string \| null` | Shown on hover overlay |
| `breed` | `string \| null` | Shown on hover overlay |
| `tags` | `string[] \| null` | Available for filtering (not currently used in UI) |
| `category` | `string \| null` | Shows "featured" badge if present |
| `is_published` | `boolean` | Server-side filter: `eq('is_published', true)` |
| `display_order` | `number` | Sort order |

**Layout**: 2 cols mobile, 3 cols tablet, 4 cols desktop — square aspect ratio with hover effects and integrated lightbox.

---

## 5. Before/After Pairs

**Admin UI**: `/admin/settings` (before/after management)
**Table**: `before_after_pairs`
**Component**: `BeforeAfterSection` → `BeforeAfterCarousel` → `BeforeAfterSlider`

| Field | Type | Notes |
|-------|------|-------|
| `before_image_url` | `string` | Required — before grooming |
| `after_image_url` | `string` | Required — after grooming |
| `pet_name` | `string \| null` | Displayed with pair |
| `description` | `string \| null` | Displayed with pair |
| `display_order` | `number` | Sort order |

**Behavior**: Carousel with draggable comparison slider (`react-compare-image`), prev/next navigation, pagination dots.

---

## 6. Business Hours

**Admin UI**: `/admin/settings/business-hours`
**Table**: `settings` (key = `'business_hours'`)
**Used by**: `ContactSection`, `Footer`, JSON-LD structured data

**Structure** (stored as JSON in `value` column):
```typescript
{
  monday:    { open: string; close: string; is_open: boolean },
  tuesday:   { open: string; close: string; is_open: boolean },
  wednesday: { open: string; close: string; is_open: boolean },
  thursday:  { open: string; close: string; is_open: boolean },
  friday:    { open: string; close: string; is_open: boolean },
  saturday:  { open: string; close: string; is_open: boolean },
  sunday:    { open: string; close: string; is_open: boolean }
}
```

Hours are summarized via `summarizeBusinessHours()` utility for display (e.g., "Mon-Sat: 9:00 AM - 5:00 PM").

**Fallback**: "Monday - Saturday 9:00 AM - 5:00 PM"

---

## 7. Booking Settings

**Admin UI**: `/admin/settings/booking`
**Effect**: Controls the booking widget availability on the marketing page via `StickyBookingButton` (appears after 600px scroll).

Booking settings (business hours, blocked dates, advance booking windows) affect available time slots when a customer opens the booking modal — the marketing page itself just renders the entry point button.

---

## 8. Content NOT Dynamic (Hardcoded)

| Content | Location | Notes |
|---------|----------|-------|
| **Testimonials** | `testimonials-section.tsx` | 6 hardcoded Yelp reviews with photos, ratings, dates |
| **About section** | `about-section.tsx` + marketing page | Title, description, stats ("500+ Happy Pups", "5.0 Stars", "100% Hypoallergenic"), highlights, salon photo |
| **Address bar** | `announcement-bars.tsx` | "14936 Leffingwell Rd, La Mirada, CA 90638" |
| **Hours bar** | `announcement-bars.tsx` | "Monday - Saturday 9:00AM - 5:00PM" (does NOT use DB hours) |
| **Service feature icons** | `service-card.tsx` | Feature bullets and icons per service type |
| **Navigation links** | `header.tsx` | Services, Gallery, Reviews, About, Contact anchor links |
| **Logo** | `header.tsx`, `footer.tsx` | Static image path |

---

## Dynamic vs Static Summary

| Section | Source | Admin Editable? |
|---------|--------|-----------------|
| Hero (headline, CTA) | `site_content` table | Yes — `/admin/settings/site-content` |
| SEO meta tags | `site_content` table | Yes — `/admin/settings/site-content` |
| Promo banners | `promo_banners` table | Yes — `/admin/settings/banners` |
| Services & prices | `services` + `service_prices` tables | Yes — service management |
| Add-ons | `addons` table | Yes — add-on management |
| Gallery | `gallery_images` table | Yes — gallery management |
| Before/After | `before_after_pairs` table | Yes — before/after management |
| Business hours | `settings` table | Yes — `/admin/settings/business-hours` |
| Contact info | `site_content` table | Yes — `/admin/settings/site-content` |
| Social links | `site_content` table | Yes — `/admin/settings/site-content` |
| Testimonials | Hardcoded | No |
| About section | Hardcoded | No |
| Address/Hours bars | Hardcoded | No |
| Nav links & logo | Hardcoded | No |
| Service feature icons | Hardcoded | No |
| Trust stats | Hardcoded | No |

---

## Key Files

| File | Role |
|------|------|
| `src/app/(marketing)/page.tsx` | Server component — fetches all data, passes to child components |
| `src/lib/site-content.ts` | Helper for `site_content` table with typed fallbacks |
| `src/components/marketing/index.ts` | Barrel export for all marketing components |
| `src/types/database.ts` | Generated Supabase types |
| `src/types/settings.ts` | `HeroContent`, `SeoSettings`, `BusinessInfo` types |
| `src/types/banner.ts` | `BannerStatus`, `BannerWithAnalytics` types |
