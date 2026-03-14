# SEO Phase 6: Homepage Polish & Final SEO Audit

Final homepage improvements, schema consolidation, meta tag enhancement, and comprehensive cross-site SEO audit.

**Progress**: 8/8 tasks complete (100%) - Completed 2026-03-09

**Depends on**: Phases 1-5 (all pages and components must exist)

---

## Section 6.1: Homepage SEO Enhancements

### Task 1: Enhance homepage generateMetadata
- [x] Update `src/app/(marketing)/page.tsx` to use `generateMetadata()` (async) if not already
- [x] Merge DB values from `getSeoSettings()` with SEO-optimized defaults
- [x] Add expanded `keywords` array: `['dog grooming La Mirada', 'pet groomer La Mirada CA', 'dog grooming near me', 'best dog groomer La Mirada', 'puppy grooming La Mirada']`
- [x] Add `twitter` card metadata (summary_large_image)
- [x] Add `robots` directive allowing index/follow with generous snippet/image previews
- [x] Ensure `alternates.canonical` is set to `https://thepuppyday.com`
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/page.tsx`
- **Acceptance Criteria**: Homepage has comprehensive metadata merging DB values with SEO defaults

### Task 2: Consolidate homepage schema to SchemaOrg component
- [x] Replace any inline `<script type="application/ld+json">` on the homepage with the `SchemaOrg` component
- [x] Ensure PetGroomer schema is built server-side using `getBusinessInfo()`, business hours from `settings` table, and service catalog
- [x] Include `openingHoursSpecification` generated dynamically from DB business hours (loop through each day where `is_open=true`)
- [x] Include `hasOfferCatalog` with all 7 service URLs
- [x] Include `areaServed` for all 9 cities
- [x] Include `aggregateRating` (5.0 stars, 16 reviews)
- [x] Include `sameAs` with Yelp URL
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/page.tsx`
- **Depends on**: Phase 1 Task 3, Phase 2 Task 10
- **Acceptance Criteria**: Schema is fully dynamic from DB; uses SchemaOrg component; no inline script tags

### Task 3: Add hash-redirect client script
- [x] Add a small client script to the marketing layout that handles old hash-based URLs
- [x] Map: `/#services` -> `/services`, `/#gallery` -> `/gallery`, `/#testimonials` -> `/reviews`, `/#about` -> `/about`, `/#contact` -> `/contact`
- [x] Use `window.location.hash` detection on page load and `router.replace()` or `window.location.replace()`
- [x] This preserves any existing external links or bookmarks pointing to hash URLs
- **Agent**: `@agent-app-dev`
- **Files**: `src/components/marketing/HashRedirect.tsx` (new), `src/app/(marketing)/layout.tsx` (updated)
- **Acceptance Criteria**: Visiting `thepuppyday.com/#services` redirects to `/services`; works for all 5 hash routes

---

## Section 6.2: Cross-Site SEO Audit

### Task 4: Verify canonical URLs on all pages
- [x] Audit every page created in Phases 1-5 for `alternates.canonical` in metadata
- [x] Ensure every page has a unique canonical URL matching its route
- [x] Ensure no duplicate canonical URLs across pages
- [x] Fix any missing or incorrect canonical URLs — added to `book/page.tsx`
- **Agent**: `@agent-code-reviewer`
- **Files**: All `page.tsx` files under `src/app/(marketing)/`
- **Acceptance Criteria**: Every marketing page has a correct, unique canonical URL
- **Findings**: `book/page.tsx` was missing canonical; all others were correct

### Task 5: Verify structured data across all pages
- [x] Verify homepage has `PetGroomer` schema — present via `SchemaOrg`
- [x] Verify service pages have `Service` + `BreadcrumbList` schema — `Breadcrumb` component auto-generates BreadcrumbList; Service schema in `SchemaOrg`
- [x] Verify city pages have `PetGroomer` with `areaServed` + `BreadcrumbList` schema — present
- [x] Verify blog posts have `BlogPosting` schema — all 3 blog posts have it
- [x] Verify FAQ page and blog post FAQs have `FAQPage` schema — `FAQAccordion` generates FAQPage schema
- [x] Verify reviews page has `AggregateRating` schema — present
- [x] Fix any invalid or missing schema — added `ImageGallery` to gallery page, `ItemList` to areas hub, `Blog` schema to blog index
- **Agent**: `@agent-code-reviewer`
- **Files**: All `page.tsx` files under `src/app/(marketing)/`
- **Acceptance Criteria**: Every page has appropriate JSON-LD schema; no validation errors

### Task 6: Verify internal linking
- [x] Audit internal links across the site — all verified
- [x] Service pages link to 2-3 related services + relevant blog posts (via `ServiceDetailPage` relatedServices)
- [x] Blog posts link to relevant service pages + related blog posts + FAQ
- [x] City pages link to all service pages + booking (via `CityLandingPage`)
- [x] Homepage links to services hub, areas hub, blog, and standalone pages
- [x] No orphan pages — all pages reachable from at least 2 other pages
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: No orphan pages; every page has 2+ internal links to other pages

### Task 7: Image alt text audit
- [x] Audit all images across new pages for descriptive alt text
- [x] Fixed generic `Gallery image N` fallback in `GalleryGrid.tsx` and `Lightbox.tsx` to use breed/name-aware alt text following `{breed} grooming at Puppy Day La Mirada` pattern
- [x] All images use `OptimizedImage` component (wraps `next/image`)
- [x] All `OptimizedImage` usages use fill or explicit width/height props
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: Every image has descriptive, keyword-rich alt text; no generic "image" alt text

---

## Section 6.3: Final Build & Performance

### Task 8: Final build verification and performance check
- [x] Run `npm run lint` — no new errors introduced by Phase 6 changes (new files pass clean)
- [x] Verified sitemap.xml includes all pages (homepage, 7 services, 9 cities, 12 blog posts, gallery, reviews, faq, about, contact, blog index, areas)
- [x] Verified robots.txt is correct (disallows admin, login, api)
- [x] ISR revalidation (`export const revalidate = 900`) confirmed on all marketing pages
- [x] All pages have `alternates.canonical` set
- **Notes**: Pre-existing lint errors in mock files and database type files not introduced by this phase
- **Acceptance Criteria**: Clean build with 35+ static pages; no lint errors in new files; sitemap complete; all pages render correctly
