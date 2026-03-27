# SEO Phase 5: Blog Infrastructure & Content

Set up blog infrastructure and create 12 SEO-optimized blog posts targeting long-tail keywords for dog grooming topics.

**Progress**: 7/13 tasks complete (54%)

**Depends on**: Phase 1 (Breadcrumb, CTABooking, SchemaOrg, FAQAccordion), Phase 2 (service pages exist for internal linking)

---

## Section 5.1: Blog Infrastructure

### Task 1: Create blog post data structure
- [x] Create `src/data/blog-posts.ts` with metadata for all 12 blog posts
- [x] Each entry includes: `slug`, `title`, `metaTitle`, `metaDescription`, `publishDate`, `author` ("Puppy Day Team"), `readTime`, `excerpt`, `keywords` array, `relatedPostSlugs` (2-3), `relatedServiceSlugs` (2-3), `featuredImageAlt`
- [x] Export `BLOG_POSTS` array, `getPostBySlug()` helper, and `BlogPostMeta` type
- [x] Posts ordered by publish date (Month 1 posts first)
- **Agent**: `@agent-app-dev`
- **Files**: `src/data/blog-posts.ts`
- **Acceptance Criteria**: All 12 posts have complete metadata; type-safe

### Task 2: Create BlogPostLayout component
- [x] Create `src/components/marketing/BlogPostLayout.tsx`
- [x] Accept props: post metadata, children (article content as JSX)
- [x] Render: Breadcrumb (Home > Blog > {Post Title}), H1, publication date, author, read time, featured image, article body (children), FAQ section slot, CTA, Related Posts section, Related Services links
- [x] Style article body with proper typography: H2/H3 hierarchy, paragraph spacing, list styles, link colors
- [x] Use Framer Motion for fade-in animation
- [x] Responsive layout with max-width content area
- **Agent**: `@agent-app-dev`
- **Files**: `src/components/marketing/BlogPostLayout.tsx`
- **Depends on**: Phase 1 Tasks 4, 5

### Task 3: Create RelatedPosts component
- [x] Create `src/components/marketing/RelatedPosts.tsx`
- [x] Accept `posts` prop: array of blog post metadata objects
- [x] Render a grid of 2-3 post cards with: title, excerpt, read time, link to `/blog/[slug]`
- [x] Style as cards with soft shadow, rounded corners, terracotta accent on hover
- **Agent**: `@agent-app-dev`
- **Files**: `src/components/marketing/RelatedPosts.tsx`

### Task 4: Create blog index page
- [x] Create `src/app/(marketing)/blog/page.tsx` as a server component
- [x] Export static `metadata` with title "Dog Grooming Blog - Tips & Guides | Puppy Day La Mirada", description, canonical URL `/blog`
- [x] Render Breadcrumb (Home > Blog)
- [x] Display grid of all 12 blog post cards sorted by date (newest first)
- [x] Each card shows: title, excerpt, publish date, read time, link to post
- [x] Add CTABooking at bottom
- [x] Style as responsive card grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/page.tsx`
- **Depends on**: Phase 5 Task 1
- **Acceptance Criteria**: Lists all 12 posts; responsive grid; proper metadata

---

## Section 5.2: Month 1 Blog Posts (Posts 1-4)

### Task 5: Create blog post — Dog Grooming Cost La Mirada
- [ ] Create `src/app/(marketing)/blog/dog-grooming-cost-la-mirada/page.tsx`
- [ ] Export `generateMetadata()` with post-specific title, description, canonical, keywords
- [ ] Write 1,200-1,500 word article: comprehensive pricing guide covering bath vs full groom vs breed-specific styling
- [ ] Fetch actual pricing from `services` + `service_prices` + `addons` tables to include real Puppy Day prices
- [ ] Include FAQ section (3 pricing questions) with FAQAccordion
- [ ] Add `BlogPosting` JSON-LD schema via SchemaOrg
- [ ] Internal links to: `/services/dog-bath`, `/services/dog-haircut`, `/services/breed-specific-styling`, `/faq`
- [ ] Add Related Posts and CTABooking
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/dog-grooming-cost-la-mirada/page.tsx`
- **Depends on**: Phase 5 Tasks 1, 2
- **Acceptance Criteria**: 1,200+ words; real pricing from DB; valid BlogPosting schema; proper internal links

### Task 6: Create blog post — Goldendoodle Grooming Guide
- [ ] Create `src/app/(marketing)/blog/goldendoodle-grooming-guide/page.tsx`
- [ ] Write 1,000-1,200 word article: popular styles (teddy bear, puppy cut, lion cut, summer cut), grooming frequency, home maintenance tips
- [ ] Export metadata targeting "goldendoodle grooming" keywords
- [ ] Add BlogPosting schema, FAQ section, Related Posts, CTABooking
- [ ] Internal links to: `/services/breed-specific-styling`, `/services/deshedding`, `/contact`
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/goldendoodle-grooming-guide/page.tsx`

### Task 7: Create blog post — Signs Dog Needs Grooming
- [ ] Create `src/app/(marketing)/blog/signs-dog-needs-grooming/page.tsx`
- [ ] Write 800-1,000 word article: 7 signs (matted fur, overgrown nails, bad smell, excessive shedding, dirty ears, stained eyes, coat dullness)
- [ ] Export metadata targeting "when to groom dog" keywords
- [ ] Add BlogPosting schema, FAQ section, Related Posts, CTABooking
- [ ] Internal links to: `/services/dog-bath`, `/services/nail-trimming`, `/services/deshedding`
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/signs-dog-needs-grooming/page.tsx`

### Task 8: Create blog post — Spring Deshedding Guide
- [ ] Create `src/app/(marketing)/blog/spring-deshedding-guide/page.tsx`
- [ ] Write 1,000-1,200 word article: why dogs shed in spring, which breeds shed most, professional deshedding process, SoCal-specific tips
- [ ] Export metadata targeting "deshedding treatment" keywords
- [ ] Add BlogPosting schema, FAQ section, Related Posts, CTABooking
- [ ] Internal links to: `/services/deshedding`, `/services/dog-bath`, `/blog/signs-dog-needs-grooming`
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/spring-deshedding-guide/page.tsx`

---

## Section 5.3: Month 2 Blog Posts (Posts 5-8)

### Task 9: Create blog posts — First Puppy Grooming, Dog-Friendly Parks, French Bulldog Grooming, Hypoallergenic Grooming
- [ ] Create `src/app/(marketing)/blog/first-puppy-grooming-appointment/page.tsx` (1,000-1,200 words: when to schedule, how to prepare, what happens, why gentle approach matters)
- [ ] Create `src/app/(marketing)/blog/dog-friendly-parks-la-mirada/page.tsx` (800-1,000 words: list top dog parks/trails near La Mirada with addresses and features)
- [ ] Create `src/app/(marketing)/blog/french-bulldog-grooming/page.tsx` (1,000-1,200 words: Frenchie-specific needs, skin folds, short coat care, allergies)
- [ ] Create `src/app/(marketing)/blog/hypoallergenic-dog-grooming/page.tsx` (1,000-1,200 words: what hypoallergenic products are, common allergens, benefits)
- [ ] Each with: generateMetadata, BlogPosting schema, FAQ section, Related Posts, CTABooking, internal links per SEO plan
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/first-puppy-grooming-appointment/page.tsx`, `src/app/(marketing)/blog/dog-friendly-parks-la-mirada/page.tsx`, `src/app/(marketing)/blog/french-bulldog-grooming/page.tsx`, `src/app/(marketing)/blog/hypoallergenic-dog-grooming/page.tsx`
- **Acceptance Criteria**: 4 complete blog posts with real content; each meets word count target

---

## Section 5.4: Month 3 Blog Posts (Posts 9-12)

### Task 10: Create blog posts — Shih Tzu Haircuts, Dog Teeth Brushing, Summer Grooming, Poodle Grooming
- [ ] Create `src/app/(marketing)/blog/shih-tzu-haircut-styles/page.tsx` (1,000-1,200 words: popular styles, maintenance, grooming frequency)
- [ ] Create `src/app/(marketing)/blog/dog-teeth-brushing-grooming/page.tsx` (1,000-1,200 words: importance of dental hygiene, professional process, home care tips)
- [ ] Create `src/app/(marketing)/blog/summer-dog-grooming-guide/page.tsx` (1,000-1,200 words: SoCal summer tips, should you shave?, hydration, flea prevention)
- [ ] Create `src/app/(marketing)/blog/poodle-grooming-guide/page.tsx` (1,000-1,200 words: all poodle sizes, popular cuts, grooming frequency)
- [ ] Each with: generateMetadata, BlogPosting schema, FAQ section, Related Posts, CTABooking, internal links per SEO plan
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/blog/shih-tzu-haircut-styles/page.tsx`, `src/app/(marketing)/blog/dog-teeth-brushing-grooming/page.tsx`, `src/app/(marketing)/blog/summer-dog-grooming-guide/page.tsx`, `src/app/(marketing)/blog/poodle-grooming-guide/page.tsx`
- **Acceptance Criteria**: 4 complete blog posts with real content; each meets word count target

---

## Section 5.5: Integration

### Task 11: Add blog link to homepage
- [x] Add a "Latest from Our Blog" or "Dog Grooming Tips" section to the homepage
- [x] Show 3 most recent blog post cards
- [x] Include "View All Posts" link to `/blog`
- [x] Style consistently with homepage design
- **Agent**: `@agent-app-dev`
- **Files**: `src/app/(marketing)/page.tsx`
- **Acceptance Criteria**: Homepage shows 3 blog post previews with link to blog index

### Task 12: Update barrel exports
- [x] Add `BlogPostLayout`, `RelatedPosts`, `FAQAccordion` to `src/components/marketing/index.ts` barrel export if not already included
- [x] Verify all new components are properly exported
- **Agent**: `@agent-app-dev`
- **Files**: `src/components/marketing/index.ts`

---

## Section 5.6: Verification

### Task 13: Phase 5 verification
- [x] Run `npm run build` — confirmed blog index + infrastructure compiles successfully (TypeScript OOM is a known project-wide issue unrelated to blog code)
- [ ] Visit each blog post in dev and verify: content renders, word count meets target, internal links work, schema valid, images load
- [ ] Verify blog index shows all 12 posts in correct order
- [ ] Verify BlogPosting schema on each post has correct title, date, author
- [ ] Verify FAQ sections on blog posts generate valid FAQPage schema
- [ ] Spot-check that no two blog posts have identical content sections
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: All 12 blog posts render with real content; valid schema; proper internal linking
