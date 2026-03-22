# GEO (Generative Engine Optimization) — Implementation Tasks

> **Feature:** GEO Optimization for Marketing Pages
> **Status:** Draft
> **Created:** 2026-03-21
> **Requirements:** Design document serves as requirements source (`.claude/plans/vectorized-twirling-wand.md` not found)
> **Design:** `docs/specs/geo-optimization/design.md`

---

## Overview

Optimize the Puppy Day marketing site so AI search engines (Google AI Overviews, ChatGPT, Perplexity, Claude) cite and reference the business for dog grooming queries in La Mirada and surrounding areas. All changes are to server-rendered content, structured data (JSON-LD), and crawler configuration. No database schema changes, no admin/customer portal changes.

**Progress**: 0/10 tasks complete (0%)

## Design Verification Notes

The following assumptions from the design document were verified against the current codebase:

| Assumption | Status |
|------------|--------|
| `Breadcrumb.tsx` already has BreadcrumbList JSON-LD | Confirmed -- no work needed |
| `TestimonialsSection.tsx` line 183 uses `<p>` for review text | Confirmed |
| Homepage schema is a single `LocalBusiness` object (not `@graph`) | Confirmed |
| Homepage already fetches reviews but only `rating` field | Confirmed -- needs `feedback, created_at` added |
| City page uses `PetGroomer` type without aggregateRating/offers/hours | Confirmed |
| Service pages lack `dateModified` metadata | Confirmed |
| Blog pages lack `dateModified` in BlogPosting schema and metadata | Confirmed |
| FAQ_ITEMS indices: 0=cost, 1=how often, 2=what's included, 3=anxious, 9=nail trimming, 12=cities | Confirmed |
| `FAQAccordion` has `includeSchema` prop for reuse | Confirmed |

**No issues found.** All design assumptions are accurate.

---

## Phase 1: Robots.txt + Metadata

### Task 0179: Add AI Crawler Allow Rules to robots.txt
- [ ] Modify `src/app/robots.ts` to return an array of rules: keep existing `*` rule, add explicit allow rules for `GPTBot`, `ChatGPT-User`, `Google-Extended`, `PerplexityBot`, `ClaudeBot`, `Amazonbot`, and `anthropic-ai`
- [ ] Each AI crawler rule should allow `/` and disallow `/admin/`, `/login/`, `/api/` (same as wildcard)
- [ ] Verify `npm run build` succeeds and check `/robots.txt` output
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 2 (File Modification Summary), Section 8 (Phase 1)
- **Files**: `src/app/robots.ts`
- **Acceptance Criteria**: `/robots.txt` contains explicit User-agent entries for all 7 AI crawlers with allow/disallow rules
- **Depends On**: None
- **Verification**: Run `npm run build`, then inspect `.next/server/app/robots.txt` or start dev server and fetch `http://localhost:3000/robots.txt`

### Task 0180: Add dateModified Metadata to Service and Blog Pages
- [ ] In `src/app/(marketing)/services/[slug]/page.tsx` `generateMetadata()`, add `other: { 'article:modified_time': '2026-03-21' }` to the returned metadata object
- [ ] In all 3 blog page files (`dog-grooming-cost-la-mirada`, `goldendoodle-grooming-guide`, `signs-dog-needs-grooming`), add `dateModified: '2026-03-21'` to the BlogPosting JSON-LD schema object
- [ ] In all 3 blog page files, add `other: { 'article:modified_time': '2026-03-21' }` to the `generateMetadata()` return
- [ ] Verify build succeeds
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 8 (Phase 1)
- **Files**: `src/app/(marketing)/services/[slug]/page.tsx`, `src/app/(marketing)/blog/dog-grooming-cost-la-mirada/page.tsx`, `src/app/(marketing)/blog/goldendoodle-grooming-guide/page.tsx`, `src/app/(marketing)/blog/signs-dog-needs-grooming/page.tsx`
- **Acceptance Criteria**: Blog page source shows `dateModified` in BlogPosting JSON-LD; service and blog pages have `article:modified_time` meta tag
- **Depends On**: None
- **Verification**: View page source of a blog post, confirm `dateModified` field in JSON-LD script tag

---

## Phase 2: Homepage Schema Enhancement

### Task 0181: Fetch Individual Reviews and Restructure Homepage Schema to @graph
- [ ] In `getMarketingData()` in `src/app/(marketing)/page.tsx`, modify the existing reviews query to also select `feedback, created_at` (change `.select('rating')` to `.select('rating, feedback, created_at')`) and add `.not('feedback', 'is', null).order('created_at', { ascending: false }).limit(5)` for a separate `individualReviews` fetch
- [ ] Keep the existing aggregate reviews query unchanged (it computes `reviewStats`); add a second parallel reviews query for the 5 most recent individual reviews with feedback
- [ ] Return `individualReviews` from `getMarketingData()` alongside existing data
- [ ] Replace the single `<SchemaOrg>` block with a `@graph` array containing: (1) existing LocalBusiness schema (with `@id`), (2) Organization schema, (3) WebSite schema with SearchAction, (4) individual Review items mapped from `individualReviews`
- [ ] Organization schema: `@type: 'Organization'`, `name`, `url`, `logo`, `sameAs` (social links)
- [ ] WebSite schema: `@type: 'WebSite'`, `url: 'https://thepuppyday.com'`, `name: 'Puppy Day'`, `potentialAction` with SearchAction
- [ ] Individual Review items: `@type: 'Review'`, `reviewRating` with `@type: 'Rating'` and `ratingValue`, `reviewBody` from feedback, `datePublished` from created_at, conditionally included only if reviews exist
- [ ] Ensure the existing `aggregateRating`, `openingHoursSpecification`, `hasOfferCatalog`, `areaServed`, `sameAs` fields remain in the LocalBusiness node
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3 (Review Query), Section 4 (Data Models), Section 8 (Phase 2)
- **Files**: `src/app/(marketing)/page.tsx`
- **Acceptance Criteria**: Homepage source contains a JSON-LD `@graph` array with LocalBusiness, Organization, WebSite types, and up to 5 Review items (if reviews exist in DB)
- **Depends On**: None
- **Verification**: Start dev server, view homepage source, search for `"@graph"` in the JSON-LD script tag; validate at Google Rich Results Test

---

## Phase 3: Homepage FAQ Section

### Task 0182: Create HomepageFAQ Component
- [ ] Create `src/components/marketing/HomepageFAQ.tsx` as a server component (no `'use client'`)
- [ ] Accept `items: FAQItem[]` prop (import `FAQItem` from `@/data/faq`)
- [ ] Render a `<section>` with `py-20 md:py-28` padding, containing `SectionHeader` with title "Frequently Asked Questions" and subtitle "Quick answers about grooming at Puppy Day"
- [ ] Render `FAQAccordion` with `items` prop and `includeSchema={false}` (schema handled by parent page's `@graph`)
- [ ] Add a centered "View All FAQs" link below the accordion: `Link` to `/faq` with `text-[#434E54] hover:text-[#C67C4E]` and `ArrowRight` icon, wrapped in `max-w-3xl mx-auto`
- [ ] Export from `src/components/marketing/index.ts`
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3 (HomepageFAQ), Section 6 (UI Specifications)
- **Files**: `src/components/marketing/HomepageFAQ.tsx`, `src/components/marketing/index.ts`
- **Acceptance Criteria**: Component renders 6 FAQ items in an accordion with "View All FAQs" link
- **Depends On**: None
- **Verification**: Import and render the component in isolation or on the homepage to confirm it displays correctly

### Task 0183: Wire HomepageFAQ into Homepage and Add FAQPage to @graph
- [ ] In `src/app/(marketing)/page.tsx`, import `FAQ_ITEMS` from `@/data/faq` and `HomepageFAQ` from `@/components/marketing`
- [ ] Define `HOMEPAGE_FAQ_INDICES = [0, 1, 2, 3, 9, 12]` constant and filter `FAQ_ITEMS` to get the 6 selected items
- [ ] Add `<HomepageFAQ items={homepageFaqs} />` between `<TestimonialsSection />` and `<AboutSection />`
- [ ] Add a `FAQPage` entry to the `@graph` array: `@type: 'FAQPage'`, `mainEntity` array with `@type: 'Question'`, `name`, `acceptedAnswer: { '@type': 'Answer', 'text' }` for each of the 6 FAQ items
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3 (Selected FAQ Items), Section 6 (Placement), Section 8 (Phase 3)
- **Files**: `src/app/(marketing)/page.tsx`
- **Acceptance Criteria**: Homepage shows FAQ section between Testimonials and About; JSON-LD `@graph` includes FAQPage type with 6 questions
- **Depends On**: Task 0181 (for @graph structure), Task 0182 (for HomepageFAQ component)
- **Verification**: Load homepage, scroll to FAQ section, verify accordion works; view source and confirm FAQPage in `@graph`

---

## Phase 4: Citation Content + Semantic HTML

### Task 0184: Add Citation Paragraph to ServiceSection
- [ ] In `src/components/marketing/ServiceSection.tsx`, add a `<p>` element after `<SectionHeader>` and before the service cards grid
- [ ] Text: "Puppy Day offers professional dog grooming in La Mirada, CA with bath and brush services starting at $40 for small dogs (under 18 lbs) and premium grooming packages from $70 to $150. Our size-based pricing covers Small (0-18 lbs), Medium (19-35 lbs), Large (36-65 lbs), and X-Large (66+ lbs) dogs."
- [ ] Styling: `text-center text-[#6B7280] max-w-3xl mx-auto mb-12 leading-relaxed`
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3 (ServiceSection modification), Section 6 (Citation Paragraph)
- **Files**: `src/components/marketing/ServiceSection.tsx`
- **Acceptance Criteria**: Homepage services section shows a pricing summary paragraph before the service cards
- **Depends On**: None
- **Verification**: Load homepage, scroll to Services section, confirm pricing text is visible

### Task 0185: Add E-E-A-T Content to AboutSection and Semantic Blockquote to TestimonialsSection
- [ ] In `src/components/marketing/AboutSection.tsx`, add after the description `<p>` element (line 101): an address line `<p className="text-sm text-[#6B7280] mt-2">Located at 14936 Leffingwell Rd, La Mirada, CA 90638. Open Monday-Saturday, 9 AM - 5 PM.</p>` and a last-updated line `<p className="text-xs text-[#6B7280] mt-4">Last updated <time dateTime="2026-03-21">March 2026</time></p>`
- [ ] In `src/components/marketing/TestimonialsSection.tsx`, change the review text element on line 183 from `<p className="text-[#434E54] text-sm leading-relaxed mt-3 flex-1">` to `<blockquote cite={review.yelpUrl} className="text-[#434E54] text-sm leading-relaxed mt-3 flex-1">` and change the closing `</p>` (after the "Read more" button) to `</blockquote>`
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3 (AboutSection, TestimonialsSection modifications), Section 6 (Semantic Markup)
- **Files**: `src/components/marketing/AboutSection.tsx`, `src/components/marketing/TestimonialsSection.tsx`
- **Acceptance Criteria**: About section shows address and "Last updated" with `<time>` element; testimonials use `<blockquote>` elements (verify in DevTools)
- **Depends On**: None
- **Verification**: Inspect elements in browser DevTools to confirm `<blockquote cite="...">` and `<time dateTime="...">` tags

---

## Phase 5: City Page Schema Enhancement

### Task 0186: Upgrade City Page Schema with AggregateRating, Offers, and OpeningHours
- [ ] In `src/app/(marketing)/dog-grooming/[city]/page.tsx`, add parallel queries for review stats and business hours alongside the existing services query: `(supabase as any).from('reviews').select('rating').eq('is_public', true).not('rating', 'is', null)` and `(supabase as any).from('settings').select('value').eq('key', 'business_hours').single()`
- [ ] Change schema `@type` from `'PetGroomer'` to `'LocalBusiness'` with `additionalType: 'https://schema.org/PetGroomer'`
- [ ] Add `aggregateRating` to schema (conditional on reviews existing): `@type: 'AggregateRating'`, `ratingValue` (average), `reviewCount`, `bestRating: '5'`, `worstRating: '1'`
- [ ] Add `hasOfferCatalog` with services mapped to `Offer` items
- [ ] Add `openingHoursSpecification` from business hours settings (same pattern as homepage)
- [ ] Add `geo` coordinates: latitude `33.9172`, longitude `-118.0120`
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 4 (City Page Data Additions), Section 8 (Phase 5)
- **Files**: `src/app/(marketing)/dog-grooming/[city]/page.tsx`
- **Acceptance Criteria**: City page JSON-LD contains LocalBusiness with aggregateRating, hasOfferCatalog, openingHoursSpecification, and geo coordinates
- **Depends On**: None
- **Verification**: Load `/dog-grooming/norwalk`, view page source, validate JSON-LD at Google Rich Results Test

---

## Phase 6: Testing + Manual Verification

### Task 0187: Build Verification and Manual Testing Checklist
- [ ] Run `npm run build` and confirm it completes without errors
- [ ] View homepage source -- verify `@graph` JSON-LD array with LocalBusiness, Organization, WebSite, FAQPage types
- [ ] View homepage source -- verify individual Review schema items (if reviews exist in DB)
- [ ] Confirm homepage FAQ section renders with 6 questions, accordion is functional
- [ ] Confirm "View All FAQs" link navigates to `/faq`
- [ ] Confirm ServiceSection shows pricing paragraph
- [ ] Confirm AboutSection shows address and "Last updated" with `<time>` element
- [ ] Confirm TestimonialsSection uses `<blockquote>` elements (DevTools inspect)
- [ ] Fetch `/robots.txt` and verify GPTBot, PerplexityBot, ClaudeBot, ChatGPT-User, Google-Extended entries
- [ ] Load `/dog-grooming/norwalk` and verify JSON-LD includes aggregateRating and openingHoursSpecification
- [ ] Load a blog post and verify `dateModified` in BlogPosting JSON-LD
- [ ] Validate homepage and a city page at https://search.google.com/test/rich-results
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 9 (Testing Strategy)
- **Files**: N/A (verification only)
- **Acceptance Criteria**: All checklist items pass; build succeeds; JSON-LD validates without errors
- **Depends On**: Tasks 0179-0186
- **Verification**: All items above checked off

---

## Phase 7: Code Review

### Task 0188: Run Code Review on All GEO Changes
- [ ] Run `@agent-code-reviewer` on all new/modified files: `src/app/robots.ts`, `src/app/(marketing)/page.tsx`, `src/components/marketing/HomepageFAQ.tsx`, `src/components/marketing/ServiceSection.tsx`, `src/components/marketing/AboutSection.tsx`, `src/components/marketing/TestimonialsSection.tsx`, `src/app/(marketing)/dog-grooming/[city]/page.tsx`, `src/app/(marketing)/services/[slug]/page.tsx`, all 3 blog page files, `src/components/marketing/index.ts`
- [ ] Verify design system compliance (colors, spacing, typography)
- [ ] Verify no hardcoded business info that should come from DB (except in citation paragraph which is intentionally static)
- [ ] Verify JSON-LD schema validity and completeness
- [ ] Verify toast notifications not needed (no DB mutations in this feature)
- **Agent**: `@agent-code-reviewer`
- **Design Ref**: All sections
- **Files**: All files modified in Tasks 0179-0186
- **Acceptance Criteria**: No critical issues found; all patterns compliant
- **Depends On**: All prior tasks
- **Verification**: Code review report shows no critical findings
