# SEO Phase 4: City Landing Pages

Create the service areas hub and 9 city-specific landing pages targeting local SEO keywords for La Mirada and surrounding cities.

**Progress**: 8/8 tasks complete (100%)

**Depends on**: Phase 1 (cities data, Breadcrumb, CTABooking, SchemaOrg, GoogleMapEmbed), Phase 2 (service pages exist for internal linking)

---

## Section 4.1: City Page Infrastructure

### Task 1: Create city landing page content data
- [x] Create `src/data/city-content.ts` with unique content for each of the 9 cities
- [x] Each city entry includes: `introText` (2-3 paragraphs referencing the city by name, specific neighborhoods, and landmarks), `whyChooseUs` (5 bullet points), `drivingDirections` (specific route from that city to 14936 Leffingwell Rd), `estimatedDriveTime`, `testimonial` (city-specific if available, fallback to general), `nearbyAttractions` (2-3 local references)
- [x] La Mirada entry should emphasize "home base" — Leffingwell Rd corridor, La Mirada Regional Park, Biola University proximity
- [x] Content must be genuinely unique per city, NOT template text with city name swapped
- [x] 400-600 words of content per city
- **Agent**: `@agent-app-dev`
- **Files**: `src/data/city-content.ts`
- **Acceptance Criteria**: Unique, substantive content for all 9 cities; no duplicated paragraphs between cities

### Task 2: Create CityLandingPage component
- [x] Create `src/components/marketing/CityLandingPage.tsx`
- [x] Accept props: city config (from `cities.ts`), city content (from `city-content.ts`), services list, business info
- [x] Render sections: Breadcrumb (Home > Areas We Serve > {City}), H1, Introduction, Our Services (brief summary with links to all 7 service pages), Why Residents Choose Us, How to Get Here (driving directions + GoogleMapEmbed), Customer Testimonial, CTABooking
- [x] Use Framer Motion for section fade-in animations
- [x] Style per design system; use `OptimizedImage` for any images
- [x] Responsive layout (mobile-first)
- **Agent**: `@agent-app-dev`
- **Files**: `src/components/marketing/CityLandingPage.tsx`
- **Depends on**: Phase 1 Tasks 4, 5, 7; Phase 4 Task 1

---

## Section 4.2: Areas Hub Page

### Task 3: Create areas overview (service areas hub) page
- [x] Create `src/app/(marketing)/areas/page.tsx` as a server component
- [x] Fetch business info via `getBusinessInfo()`
- [x] Export `generateMetadata()` with title "Areas We Serve - Dog Grooming Near You | Puppy Day La Mirada", canonical URL `/areas`
- [x] Set `export const revalidate = 900`
- [x] Render Breadcrumb (Home > Areas We Serve)
- [x] Display a grid of city cards, each linking to `/areas/[city-slug]`
- [x] Each card shows: city name, distance from salon, brief tagline
- [x] Highlight La Mirada as "Our Home" with a visual distinction
- [x] Add CTABooking at bottom
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/areas/page.tsx`
- **Depends on**: Phase 1 Task 2
- **Acceptance Criteria**: Lists all 9 cities; La Mirada highlighted; proper metadata; map visible

---

## Section 4.3: Individual City Pages

### Task 4: Create city detail route pages
- [x] Create `src/app/(marketing)/areas/[city]/page.tsx`
- [x] Export `generateStaticParams()` returning all 9 city slugs from `CITY_SLUGS`
- [x] Export `generateMetadata()` using city-specific title, description, and canonical URL from `cities.ts` data
- [x] Set `export const revalidate = 900`
- [x] Fetch services list and business info via `Promise.all()`
- [x] Import city content from `city-content.ts` and city config from `cities.ts`
- [x] Render `CityLandingPage` component
- [x] Add `PetGroomer` JSON-LD schema with `areaServed` set to the specific city (include `containedInPlace: California`)
- [x] Add `BreadcrumbList` schema
- [x] Handle 404 with `notFound()` for invalid city slugs
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/areas/[city]/page.tsx`
- **Depends on**: Phase 4 Tasks 1, 2, 3
- **Acceptance Criteria**: All 9 city pages generate statically; unique content per city; valid schema; 404 for invalid slugs

### Task 5: Write La Mirada city page content
- [x] Ensure La Mirada content in `city-content.ts` is distinct from homepage
- [x] Target long-tail queries: "best dog groomer in La Mirada CA", "affordable dog grooming La Mirada 90638", "dog grooming near Imperial Hwy La Mirada"
- [x] Include neighborhood-level detail: Leffingwell Rd corridor, near La Mirada Regional Park, Biola University, Creek Park, La Mirada Theatre
- [x] Use different H1 than homepage (e.g., "La Mirada's Top-Rated Dog Grooming Salon")
- **Agent**: `@agent-app-dev`
- **Files**: `src/data/city-content.ts`
- **Acceptance Criteria**: La Mirada content is distinct from homepage; targets different keywords

### Task 6: Write content for surrounding 8 cities
- [x] Verify/finalize unique content for: Norwalk, Buena Park, Whittier, Santa Fe Springs, Cerritos, Hacienda Heights, Fullerton, Brea
- [x] Each city references specific landmarks and neighborhoods from the SEO plan
- [x] Each includes specific driving directions and estimated drive time
- [x] No two city pages share identical paragraph text
- **Agent**: `@agent-app-dev`
- **Files**: `src/data/city-content.ts`
- **Acceptance Criteria**: All 8 surrounding cities have unique, substantive content

---

## Section 4.4: Integration

### Task 7: Add "Areas We Serve" link to homepage
- [x] Add a section or link on the homepage pointing to `/areas`
- [x] Could be added near the contact section or as a new brief section
- [x] Style consistently with homepage design
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/page.tsx` or relevant component
- **Acceptance Criteria**: Homepage links to areas hub page

---

## Section 4.5: Verification

### Task 8: Phase 4 verification
- [x] Run `npm run build` — compiled successfully. All 9 city pages + hub generated statically.
- [x] Visit each city page in dev and verify: unique content renders, map embed works, driving directions present, services linked, CTA has dynamic phone number
- [x] Verify La Mirada page has different content than homepage
- [x] Verify each city page has valid `PetGroomer` JSON-LD with correct `areaServed`
- [x] Verify areas hub lists all 9 cities with correct links
- [x] Check internal links from city pages to service pages work
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: All 9 city pages + hub render correctly; unique content per city; valid schema; no broken links
