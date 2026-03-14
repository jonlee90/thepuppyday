# SEO Phase 2: Service Pages

Create the services overview hub and 7 individual service detail pages with dynamic pricing from Supabase, structured data, and SEO-optimized content.

**Progress**: 12/12 tasks complete (100%)

**Depends on**: Phase 1 (SchemaOrg, Breadcrumb, CTABooking, FAQAccordion, services data mapping)

---

## Section 2.1: Services Hub Page

### Task 1: Create services overview page
- [x] Create `src/app/(marketing)/services/page.tsx` as a server component
- [x] Fetch services and pricing from `services` + `service_prices` tables via `Promise.all()`
- [x] Export `generateMetadata()` with title "Dog Grooming Services in La Mirada, CA", description, canonical URL, and keywords
- [x] Set `export const revalidate = 900` for ISR
- [x] Render Breadcrumb (Home > Services)
- [x] Display grid of service cards linking to individual `/services/[slug]` pages
- [x] Each card shows: service name, brief description, "Starting from $XX" (lowest price from `service_prices`)
- [x] Include CTABooking at bottom
- [x] Add `ItemList` JSON-LD schema listing all services via SchemaOrg
- **Files**: `src/app/(marketing)/services/page.tsx`

---

## Section 2.2: Service Detail Page Template

### Task 2: Create service detail page data fetching utility
- [x] Create `src/lib/services/getServicePageData.ts`
- [x] Function accepts a service slug, returns: service record, service prices (size tiers), relevant addons, before/after pairs, and business info
- [x] Use `Promise.all()` for parallel Supabase queries
- [x] Handle add-on services (nail trimming, teeth brushing, deshedding, flea & tick) that pull pricing from `addons` table instead of `service_prices`
- [x] Include proper error handling and fallback defaults
- **Files**: `src/lib/services/getServicePageData.ts`

### Task 3: Create service detail page content data
- [x] Create `src/data/service-content.ts` with static content for each of the 7 services
- [x] Each service entry includes: `whatsIncluded` (3-5 bullet points), `benefits` (4-5 points), `idealFor` text, `sessionDuration` text, `faqItems` (2-3 Q&A pairs specific to the service), `relatedServiceSlugs` (2-3 related services)
- [x] Content is SEO-rich with 500-800 words per service; no placeholder text
- **Files**: `src/data/service-content.ts`

### Task 4: Create ServiceDetailPage component
- [x] Create `src/components/marketing/ServiceDetailPage.tsx`
- [x] Accept props: service data, prices, addons, before/after pairs, content, business info
- [x] Render sections: H1, What's Included, Benefits, Pricing table (size tiers or single addon price), Before/After gallery (reuse `BeforeAfterSlider`), FAQ (use `FAQAccordion`), CTA, Related Services
- [x] Pricing section: main services show size-based table; add-on services show single price
- [x] Styled per design system with Framer Motion animations
- **Files**: `src/components/marketing/ServiceDetailPage.tsx`

### Task 5: Create dynamic service route with generateStaticParams
- [x] Create `src/app/(marketing)/services/[slug]/page.tsx`
- [x] Export `generateStaticParams()` returning all 7 service slugs from `SERVICE_SLUGS`
- [x] Export `generateMetadata()` with service-specific title, description, canonical URL, and keywords
- [x] Set `export const revalidate = 900`
- [x] Fetch service data using `getServicePageData(slug)`
- [x] Render `ServiceDetailPage` component with fetched data
- [x] `Service` JSON-LD schema with dynamic `AggregateOffer` (lowPrice/highPrice from DB)
- [x] `BreadcrumbList` schema via Breadcrumb component (Home > Services > {Service Name})
- [x] Handle 404 with `notFound()` for invalid slugs
- **Files**: `src/app/(marketing)/services/[slug]/page.tsx`

---

## Section 2.3: Individual Service Content

### Task 6: Dog Bath service page content
- [x] Content covers: warm water bath, hypoallergenic shampoo, blow dry, ear cleaning, nail trim
- [x] FAQ: "How often should I bathe my dog?", "What shampoo do you use?", "My dog is anxious about baths"
- **Files**: `src/data/service-content.ts`

### Task 7: Dog Haircut service page content
- [x] Content covers: breed-appropriate cuts, coat assessment, styling consultation
- [x] FAQ: "How often does my dog need a haircut?", "Can you do specific breed cuts?", "What happens if my dog has mats?"
- **Files**: `src/data/service-content.ts`

### Task 8: Breed-Specific Styling service page content
- [x] Content covers: breed standards, popular styles (teddy bear, puppy cut, lion cut), consultation
- [x] Mentions breeds: Goldendoodles, Poodles, Shih Tzus, Bichons, Schnauzers, Cocker Spaniels
- [x] FAQ: "Which breeds need specialized styling?", "How do I choose a style?", "Teddy bear vs puppy cut?"
- **Files**: `src/data/service-content.ts`

### Task 9: Add-on services content (nail trimming, teeth brushing, deshedding, flea & tick)
- [x] All 4 add-on services have complete What's Included, Benefits, and 2-3 FAQ items each
- [x] Each notes availability as standalone or add-on to bath/haircut services
- **Files**: `src/data/service-content.ts`

---

## Section 2.4: Integration & Polish

### Task 10: Update homepage PetGroomer schema
- [x] Upgraded `LocalBusiness` to `PetGroomer` subtype on homepage
- [x] Replaced inline JSON-LD with `SchemaOrg` component
- [x] Added `hasOfferCatalog` with links to all 7 service pages
- [x] Updated `aggregateRating` (5.0 stars, 16 reviews)
- [x] Added `areaServed` for all 9 cities
- **Files**: `src/app/(marketing)/page.tsx`

### Task 11: Add "View All Services" link to homepage
- [x] Added "View All Services" link with arrow icon to `ServiceSection`
- [x] Links to `/services`
- [x] Styled consistently with charcoal text, terracotta hover
- **Files**: `src/components/marketing/ServiceSection.tsx`

---

## Section 2.5: Verification

### Task 12: Phase 2 verification
- [x] `npm run build` — compiled successfully (21.3s). Only pre-existing Playwright type error in e2e/
- [x] Lint passes — only pre-existing `any` casts from Supabase queries
- [x] All new components import correctly, added to barrel export
- [x] Service hub + 7 detail pages generate with dynamic pricing, breadcrumbs, schema
- [x] No hardcoded prices or phone numbers — all from DB/config
