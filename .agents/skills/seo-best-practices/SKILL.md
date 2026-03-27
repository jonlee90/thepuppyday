---
name: seo-best-practices
description: "Latest SEO best practices (2025-2026) for Next.js App Router applications. Covers technical SEO (Core Web Vitals, structured data, meta tags, sitemaps), on-page SEO (heading hierarchy, keyword placement, internal linking, image alt text), and local SEO (LocalBusiness schema, Google Business Profile, NAP consistency, review markup). Use this skill whenever writing or reviewing metadata, JSON-LD structured data, page SEO, generateMetadata functions, sitemap/robots config, Open Graph tags, or any content that affects search rankings. Also use when the user asks about SEO audits, ranking improvements, Core Web Vitals, Google Search Console issues, or local search visibility — even if they don't say 'SEO' explicitly."
---

# SEO Best Practices for Next.js (2025-2026)

This skill provides up-to-date SEO guidance for Next.js App Router applications. It covers auditing existing pages and writing SEO-optimized code from scratch, with emphasis on technical SEO, on-page optimization, and local SEO for service businesses.

## When to Use This Skill

- Writing or reviewing `generateMetadata()` or `metadata` exports
- Creating JSON-LD structured data (`SchemaOrg` component or inline scripts)
- Configuring `sitemap.ts`, `robots.ts`, or canonical URLs
- Optimizing page content for search rankings
- Auditing a page for SEO issues
- Working on Open Graph / Twitter Card meta tags
- Improving Core Web Vitals (LCP, INP, CLS)
- Adding local business schema or review markup
- Creating city/geo landing pages for local SEO

---

## SEO Audit Checklist

When auditing a page, check every item. When writing new pages, ensure all applicable items are implemented.

### Technical SEO

- [ ] **Title tag**: 50-60 characters, primary keyword near front, brand at end
- [ ] **Meta description**: 150-160 characters, includes call-to-action, primary keyword
- [ ] **Canonical URL**: Set for every page, self-referencing for originals
- [ ] **Open Graph**: og:title, og:description, og:image (1200x630px), og:url, og:type
- [ ] **Twitter Card**: twitter:card (summary_large_image), twitter:title, twitter:description
- [ ] **JSON-LD structured data**: Appropriate schema type for the page content
- [ ] **H1 tag**: Exactly one per page, contains primary keyword
- [ ] **Heading hierarchy**: H1 then H2 then H3 (no skipping levels)
- [ ] **Image alt text**: Descriptive, includes keywords naturally (not stuffed)
- [ ] **Image optimization**: next/image with proper width/height/sizes, WebP/AVIF format
- [ ] **Internal links**: Links to related pages, descriptive anchor text (not "click here")
- [ ] **URL structure**: Short, lowercase, hyphens, includes keyword
- [ ] **Mobile-friendly**: Responsive, no horizontal scroll, tap targets at least 48px
- [ ] **Page speed**: LCP under 2.5s, INP under 200ms, CLS under 0.1
- [ ] **HTTPS**: All resources loaded over HTTPS

### Local SEO (for service business pages)

- [ ] **LocalBusiness schema**: Full address, phone, hours, geo coordinates
- [ ] **AggregateRating**: Star rating + review count in schema
- [ ] **NAP consistency**: Name, Address, Phone match everywhere
- [ ] **Service area**: areaServed with cities/regions
- [ ] **OfferCatalog**: Services listed with pricing in schema

---

## Next.js App Router SEO Patterns

### Metadata API

Next.js App Router uses a typed Metadata API. There are two approaches:

**Static metadata** (for pages with known content):
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Name | Brand Name',
  description: '150-160 char description with primary keyword and CTA',
  alternates: {
    canonical: '/services/service-name',
  },
  openGraph: {
    title: 'Service Name | Brand Name',
    description: 'Slightly different OG description optimized for social sharing',
    url: '/services/service-name',
    type: 'website',
    images: [{ url: '/images/og-service.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Service Name | Brand Name',
    description: 'Twitter-optimized description',
  },
};
```

**Dynamic metadata** (for data-driven pages):
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchData(slug);

  return {
    title: data.seoTitle || `${data.name} | Brand`,
    description: data.metaDescription,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: data.ogTitle || data.seoTitle,
      description: data.ogDescription || data.metaDescription,
      images: data.ogImage ? [{ url: data.ogImage }] : [],
    },
  };
}
```

### Layout vs Page Metadata

- **Layout metadata**: Sets defaults and title template (`%s | Brand Name`)
- **Page metadata**: Overrides layout with page-specific values
- Template pattern: `title: { template: '%s | Puppy Day Dog Grooming La Mirada', default: 'Puppy Day - Dog Grooming in La Mirada, CA' }`

### metadataBase

Set once in root layout — all relative URLs in metadata resolve against this:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://yourdomain.com'),
};
```

---

## Structured Data (JSON-LD)

Structured data helps Google understand your content and can trigger rich results (star ratings, FAQs, breadcrumbs, business info in Knowledge Panel).

### Implementation Pattern

Use a reusable component that injects JSON-LD into the page head. The SchemaOrg component accepts a schema object or array and wraps it with @context and @graph. The JSON is serialized with JSON.stringify and rendered in a script tag with type application/ld+json. This is safe because JSON.stringify escapes special characters, but should only be used with trusted application data — never with raw user input.

### Schema Types by Page

For detailed schema templates with all required and recommended properties, read `references/structured-data.md`.

| Page Type | Schema Types |
|-----------|-------------|
| Homepage | LocalBusiness + Organization + WebSite + FAQPage |
| Service page | Service + Offer/AggregateOffer + Provider |
| City/geo page | LocalBusiness (area-specific) + BreadcrumbList |
| Blog post | BlogPosting + Author + Publisher |
| About page | Organization + LocalBusiness |
| Contact page | LocalBusiness + ContactPoint |
| Review page | Review + AggregateRating |

### Key Schema Properties (2025)

Google has expanded which properties trigger rich results. The most impactful:

- **AggregateRating**: `ratingValue`, `reviewCount`, `bestRating` — triggers star snippets in search
- **FAQPage**: `mainEntity` with Question/Answer pairs — triggers expandable FAQ in search
- **LocalBusiness**: `openingHoursSpecification`, `geo`, `areaServed` — triggers Knowledge Panel
- **Service**: `offers` with `price`/`priceCurrency` — triggers pricing in search
- **BreadcrumbList**: `itemListElement` — triggers breadcrumb trail in search results

---

## Core Web Vitals (2025 Thresholds)

Google uses these metrics as ranking signals. All three must be "good" for the page to pass:

| Metric | Good | Needs Improvement | Poor | What It Measures |
|--------|------|-------------------|------|-----------------|
| **LCP** (Largest Contentful Paint) | under 2.5s | 2.5-4.0s | over 4.0s | Loading speed — when main content is visible |
| **INP** (Interaction to Next Paint) | under 200ms | 200-500ms | over 500ms | Responsiveness — delay after user clicks/taps |
| **CLS** (Cumulative Layout Shift) | under 0.1 | 0.1-0.25 | over 0.25 | Visual stability — how much the page shifts |

### Next.js Optimization Patterns

**LCP optimization**:
- Use `next/image` with `priority` prop on above-the-fold hero images
- Preload critical fonts with `next/font`
- Use ISR or SSG (not client-side fetching) for marketing pages
- Avoid layout shifts from late-loading content

**INP optimization**:
- Use `React.memo`, `useMemo`, `useCallback` to prevent unnecessary re-renders
- Defer heavy client-side work with `requestIdleCallback` or `startTransition`
- Use dynamic imports (`next/dynamic`) for below-the-fold interactive components
- Keep event handlers fast — offload heavy work to Web Workers if needed

**CLS optimization**:
- Always set `width` and `height` on images (or use `fill` with a sized container)
- Reserve space for dynamic content (skeleton loaders with fixed dimensions)
- Avoid inserting content above existing content after page load
- Use `font-display: swap` with size-adjust to prevent font-swap layout shifts

---

## On-Page SEO

### Title Tag Formula

```
[Primary Keyword] - [Benefit/Modifier] | [Brand Name]
```

Examples:
- `Dog Grooming in La Mirada - Professional Pet Salon | Puppy Day`
- `Premium Dog Grooming Services - Book Online Today | Puppy Day`

Rules:
- 50-60 characters (Google truncates at around 60)
- Primary keyword as close to the front as possible
- Brand name at the end (separated by | or -)
- Unique for every page — no duplicates across the site

### Meta Description Formula

```
[What you offer] + [Key benefit] + [CTA]. [Differentiator].
```

Example:
- `Professional dog grooming in La Mirada, CA. Expert groomers, gentle handling, and a stress-free experience for your pup. Book online today!`

Rules:
- 150-160 characters
- Include primary keyword naturally
- Include a call-to-action (Book now, Learn more, Get a quote)
- Unique for every page

### Heading Hierarchy

```
H1: Primary page topic (one per page, contains primary keyword)
  H2: Major sections
    H3: Subsections within H2
      H4: Details within H3 (rare, use sparingly)
```

- Never skip levels (no H1 then H3)
- H1 should differ slightly from the title tag (not an exact copy)
- Use keywords in H2s naturally — these are secondary ranking signals

### Internal Linking

- Link from high-authority pages (homepage) to important pages (services)
- Use descriptive anchor text: "our premium grooming services" not "click here"
- Add contextual links within content (not just navigation)
- Ensure every important page is reachable within 3 clicks from the homepage
- Create topic clusters: pillar page (services) then cluster pages (individual services)

### Image SEO

- Alt text: Describe what is in the image, include keyword if natural
- File names: Use descriptive, hyphenated names (not IMG_001.jpg)
- Format: WebP or AVIF (next/image handles this automatically)
- Lazy loading: Default for below-the-fold, `priority` for hero images
- Always provide width and height to prevent CLS

---

## Local SEO

For detailed local SEO implementation patterns, read `references/local-seo.md`.

### Key Principles

1. **NAP consistency**: Business name, address, and phone number must be identical everywhere — schema, footer, contact page, Google Business Profile
2. **LocalBusiness schema**: Include on every page (via layout or per-page), with full address, hours, geo coordinates, and services
3. **City landing pages**: Create dedicated pages for each city you serve — unique content per city, not just city-name swaps
4. **Review signals**: AggregateRating schema + encourage customers to leave Google reviews
5. **Google Business Profile**: Keep hours, services, photos, and posts updated (this is a major local ranking factor that is outside the website)

### City/Geo Page SEO Pattern

Each city page should have:
- Unique title: `Dog Grooming in [City] - Professional Pet Grooming | Brand`
- Unique H1: `Professional Dog Grooming in [City], CA`
- Unique content (at least 300 words) mentioning the city naturally
- LocalBusiness schema with `areaServed` set to that city
- Breadcrumb: Home then Dog Grooming then [City]
- Internal links to service pages and booking

---

## Google Algorithm Context (2025)

### E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

Google evaluates content quality through E-E-A-T. For service businesses:
- **Experience**: Show real work (before/after photos, case studies, reviews)
- **Expertise**: Detailed service descriptions, groomer qualifications
- **Authoritativeness**: Consistent NAP, Google Business Profile, citations
- **Trustworthiness**: HTTPS, reviews, clear contact info, privacy policy

### Helpful Content Update

Google demotes content that exists primarily for search engines rather than users. Ensure:
- Content answers real user questions
- Pages provide value beyond what is in the meta description
- Avoid thin pages (under 300 words with no unique value)
- Do not create pages just to target keywords — each page should serve a distinct user need

### AI Content Guidelines

Google does not penalize AI-generated content per se, but it must meet the same quality standards:
- Add human expertise and real business information
- Include original photos, reviews, and specific details
- Do not mass-generate thin city pages with only the city name changed

---

## Top Ranking Factors (2025)

### What Moves the Needle

1. **Content quality and relevance** — Comprehensive, unique content that matches search intent
2. **Backlinks** — Quality over quantity; local directories, industry sites, press mentions
3. **Technical health** — Fast load times, mobile-friendly, proper indexing, no crawl errors
4. **User experience signals** — Core Web Vitals, low bounce rate, time on site
5. **Google Business Profile** — For local search: reviews, photos, posts, Q&A activity
6. **Structured data** — Enables rich results which increase click-through rate
7. **Brand signals** — Brand searches, direct traffic, social presence

### What No Longer Matters

- Keyword density (write naturally, not for a percentage target)
- Meta keywords tag (Google ignores it completely)
- Exact match domains (no ranking boost)
- Word count as a metric (quality over length)
- Reciprocal link exchanges

---

## Reference Files

- `references/structured-data.md` — Complete JSON-LD templates for every page type (LocalBusiness, Service, BlogPosting, FAQ, Breadcrumb, Review)
- `references/local-seo.md` — Local SEO deep dive: Google Business Profile, citation building, review strategy, city page content templates
- `references/core-web-vitals.md` — Performance optimization patterns specific to Next.js: image loading, font optimization, bundle analysis, ISR strategy
- `references/audit-checklist.md` — Detailed page-by-page audit checklist with scoring rubric and fix priorities
