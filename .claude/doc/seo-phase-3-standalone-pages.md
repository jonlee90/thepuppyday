# SEO Phase 3: Standalone Pages

Create dedicated About, Contact, Gallery, Reviews, and FAQ pages by extracting and reusing existing homepage section components with proper SEO metadata.

**Progress**: 9/9 tasks complete (100%)

**Depends on**: Phase 1 (Breadcrumb, CTABooking, FAQAccordion, SchemaOrg, GoogleMapEmbed)

---

## Section 3.1: Content Pages (Reuse Existing Components)

### Task 1: Create About page
- [x] Create `src/app/(marketing)/about/page.tsx` as a server component
- [x] Export static `metadata` with title "About Puppy Day - Family-Run Dog Grooming in La Mirada", description, canonical URL `/about`
- [x] Set `export const revalidate = 900`
- [x] Render Breadcrumb (Home > About Us)
- [x] Import and render `AboutSection` from `src/components/marketing/AboutSection.tsx`
- [x] Add CTABooking at bottom
- [x] Add `AboutPage` JSON-LD schema via SchemaOrg with LocalBusiness mainEntity
- **Files**: `src/app/(marketing)/about/page.tsx`

### Task 2: Create Contact page
- [x] Create `src/app/(marketing)/contact/page.tsx` as a server component
- [x] Fetch business info via `getBusinessInfo()` for address, phone, email
- [x] Export static `metadata` with title "Contact Puppy Day - Dog Grooming in La Mirada, CA", description, canonical URL `/contact`
- [x] Set `export const revalidate = 900`
- [x] Render Breadcrumb (Home > Contact)
- [x] Import and render `ContactSection` with dynamic business info and hours
- [x] Add `GoogleMapEmbed` component showing the business address
- [x] Fetch business hours from `settings` table via `Promise.all()`
- [x] Add `ContactPage` JSON-LD schema via SchemaOrg
- **Files**: `src/app/(marketing)/contact/page.tsx`

### Task 3: Create Gallery page
- [x] Create `src/app/(marketing)/gallery/page.tsx` as a server component
- [x] Fetch gallery images from `gallery_images` table (filter `is_published = true`)
- [x] Fetch before/after pairs from `before_after_pairs` table
- [x] Export static `metadata` with title "Dog Grooming Gallery - Before & After Photos", canonical URL `/gallery`
- [x] Set `export const revalidate = 900`
- [x] Render Breadcrumb (Home > Gallery)
- [x] Import and render `GallerySection` and `BeforeAfterSection` from existing marketing components
- [x] Add CTABooking at bottom
- [x] Parallel data fetching with `Promise.all()`
- **Files**: `src/app/(marketing)/gallery/page.tsx`

### Task 4: Create Reviews page
- [x] Create `src/app/(marketing)/reviews/page.tsx` as a server component
- [x] Export static `metadata` with title "Customer Reviews - 5-Star Dog Grooming", description, canonical URL `/reviews`
- [x] Render Breadcrumb (Home > Reviews)
- [x] Import and render `TestimonialsSection` from existing marketing components
- [x] Add a section encouraging reviews with a link to the Yelp page (red CTA button)
- [x] Add CTABooking at bottom
- [x] Add `AggregateRating` JSON-LD schema (5.0 stars, 16 reviews) via SchemaOrg
- **Files**: `src/app/(marketing)/reviews/page.tsx`

---

## Section 3.2: FAQ Page

### Task 5: Create FAQ data file
- [x] Create `src/data/faq.ts` with all 20 FAQ questions and answers from the SEO plan
- [x] Each entry: `{ question: string; answer: string }`
- [x] Answers are 2-4 sentences each, keyword-rich but natural
- [x] Include internal link references in answers (service page URLs)
- [x] Export as `FAQ_ITEMS` array and type `FAQItem`
- **Files**: `src/data/faq.ts`

### Task 6: Create FAQ page
- [x] Create `src/app/(marketing)/faq/page.tsx` as a server component
- [x] Export static `metadata` with title "FAQ - Dog Grooming Questions", description, canonical URL `/faq`, keywords
- [x] Render Breadcrumb (Home > FAQ)
- [x] Render page heading with introductory text via SectionHeader
- [x] Import `FAQ_ITEMS` from `src/data/faq.ts`
- [x] Render `FAQAccordion` component with all 20 items (auto-generates FAQPage schema)
- [x] Add CTABooking at bottom
- [x] Add internal links to all 7 service pages in a styled link block
- **Files**: `src/app/(marketing)/faq/page.tsx`

---

## Section 3.3: Navigation Integration

### Task 7: Add "View All" links to homepage sections
- [x] Added `showViewAll` prop to `GallerySection` — renders "View Full Gallery" link to `/gallery`
- [x] Added "Read All Reviews" internal link to `TestimonialsSection` alongside existing Yelp link
- [x] Added `showViewAll` prop to `AboutSection` — renders "Learn More About Us" link to `/about`
- [x] All links styled consistently: charcoal text, terracotta hover, ArrowRight icon
- [x] Homepage passes `showViewAll` to GallerySection and AboutSection
- **Files**: `src/components/marketing/GallerySection.tsx`, `src/components/marketing/TestimonialsSection.tsx`, `src/components/marketing/AboutSection.tsx`, `src/app/(marketing)/page.tsx`

### Task 8: Ensure StickyBookingButton appears on all new pages
- [x] Verified `StickyBookingButton` is already rendered in `src/app/(marketing)/layout.tsx` (line 50)
- [x] All new pages are inside the `(marketing)` route group and inherit the layout
- [x] No changes needed — button automatically appears on all marketing pages after 600px scroll
- **Files**: No changes needed (already in layout)

---

## Section 3.4: Verification

### Task 9: Phase 3 verification
- [x] `npm run build` — compiled successfully (19.9s). Only pre-existing Playwright type error in e2e/
- [x] Lint passes — only pre-existing `any` casts from Supabase queries and unused `stats` in AboutSection
- [x] All 5 new pages created: `/about`, `/contact`, `/gallery`, `/reviews`, `/faq`
- [x] Each page has: unique title, meta description, canonical URL, breadcrumbs, CTA
- [x] FAQ page renders 20 items in FAQAccordion with auto-generated FAQPage schema
- [x] Gallery page fetches images from database with parallel queries
- [x] Contact page shows GoogleMapEmbed and dynamic business info/hours
- [x] Reviews page has AggregateRating schema and Yelp review CTA
- [x] Homepage "View All" links added to Gallery, Testimonials, and About sections
- [x] StickyBookingButton confirmed in marketing layout (applies to all pages)
