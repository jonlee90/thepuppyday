# Puppy Day — Website SEO Implementation Plan for Claude Code Agent

## Project Context

You are implementing a comprehensive local SEO overhaul for **Puppy Day**, a dog grooming business website.

- **Domain:** thepuppyday.com
- **Tech Stack:** Next.js (App Router with Turbopack), Supabase (PostgreSQL) backend
- **Current State:** Single-page app using a `(marketing)` route group with hash-based navigation (`/#services`, `/#gallery`, `/#testimonials`, `/#about`, `/#contact`). Has existing `LocalBusiness` schema on homepage. Has basic meta tags but is missing canonical URLs, sitemap, breadcrumbs, and dedicated pages for services/areas/blog.
- **Database:** Supabase with admin-editable content — see "Dynamic Content Architecture" section below
- **Business Address:** 14936 Leffingwell Rd, La Mirada, CA 90638 *(fallback — actual value from `site_content` table, section `business_info`)*
- **Phone:** (657) 252-2903 *(fallback — actual value from `site_content` table)*
- **Email:** puppyday14936@gmail.com *(fallback — actual value from `site_content` table)*
- **Hours:** Mon–Sat 9:00 AM – 5:00 PM, Closed Sunday *(fallback — actual value from `settings` table, key `business_hours`)*
- **Yelp:** 5.0 stars, 16 reviews

### Dynamic Content Architecture (CRITICAL — Read Before Implementing)

The existing site has a Supabase-backed CMS. Many values that appear static actually come from the database and are admin-editable. **All new pages MUST follow the same patterns** to keep the site consistent:

**Data flow:** `Admin Settings UI → Supabase (PostgreSQL) → Marketing Pages (ISR, 15-min revalidation)`

**Key helpers (in `src/lib/site-content.ts`):**
- `getSiteContent()` — fetches all site content sections
- `getHeroContent()` — hero headline, subheadline, CTA buttons
- `getSeoSettings()` — page title, meta description, OG tags
- `getBusinessInfo()` — name, address, city, state, zip, phone, email, social links

**Dynamic data sources:**

| Data | Supabase Table | Admin Path | Notes |
|------|---------------|------------|-------|
| Services & pricing | `services` + `service_prices` | `/admin/settings` | Prices are per size tier (small/medium/large/xlarge). Join with `service_prices(*)`. Only "basic" and "premium" services currently shown. |
| Add-ons & pricing | `addons` | `/admin/settings` | Filter `is_active = true`. Fields: name, price. |
| SEO meta tags | `site_content` (section: `seo`) | `/admin/settings/site-content` | page_title, meta_description, og_title, og_description, og_image_url |
| Business info | `site_content` (section: `business_info`) | `/admin/settings/site-content` | name, address, city, state, zip, phone, email, social_links |
| Hero section | `site_content` (section: `hero`) | `/admin/settings/site-content` | headline, subheadline, background_image_url, cta_buttons |
| Business hours | `settings` (key: `business_hours`) | `/admin/settings/business-hours` | Per-day open/close/is_open. Summarized via `summarizeBusinessHours()`. |
| Gallery images | `gallery_images` | `/admin/settings` | image_url, caption, dog_name, breed, tags, category. Filter `is_published = true`. |
| Before/After pairs | `before_after_pairs` | `/admin/settings` | before_image_url, after_image_url, pet_name, description |
| Promo banners | `promo_banners` | `/admin/settings/banners` | image_url, alt_text, click_url, date range, analytics |

**Currently hardcoded (NOT in database):**
- Testimonials (6 Yelp reviews in `testimonials-section.tsx`)
- About section text and stats (`about-section.tsx`)
- Address/Hours announcement bars (`announcement-bars.tsx`)
- Service feature icons and descriptions (partially in `service-card.tsx`)
- Navigation links (`header.tsx`)
- Logo (`header.tsx`, `footer.tsx`)

**Data fetching pattern to follow:** All page data is fetched server-side via `Promise.all()` in the page's server component, then passed to client components as props. Use `revalidate = 900` (15 minutes) for ISR caching. See `src/app/(marketing)/page.tsx` for the reference implementation.

**Key types (in `src/types/`):**
- `src/types/settings.ts` — `HeroContent`, `SeoSettings`, `BusinessInfo`
- `src/types/database.ts` — Generated Supabase types
- `src/types/banner.ts` — `BannerStatus`, `BannerWithAnalytics`

## Goal

Transform the single-page site into a multi-page, SEO-optimized Next.js application with 35+ indexable pages targeting 125+ keywords. The site must outrank three local competitors (All About Puppies, Puppy House & Grooming, Groombuggy/Barkbus) — all of which have content-thin, single-page websites with no blogs, no city landing pages, and no FAQ pages.

---

## Phase 1: Site Architecture & Core Pages

### 1.1 — Convert to Multi-Page Architecture

Convert the current single-page hash-navigation app into a proper multi-page Next.js site using the App Router. Keep the homepage design intact but move each section's content into dedicated pages.

**Create this route structure:**

The existing site uses a `(marketing)` route group at `src/app/(marketing)/`. All new public-facing pages should be created inside this route group to inherit its layout. The `admin` and `login` routes exist outside this group.

```
src/app/
├── (marketing)/                       → Existing route group (shared marketing layout)
│   ├── page.tsx                       → Homepage (EXISTING — keep, improve SEO)
│   ├── layout.tsx                     → Marketing layout (EXISTING — update nav/footer)
│   ├── services/
│   │   ├── page.tsx                   → Services overview hub (NEW)
│   │   ├── dog-bath/page.tsx          → (NEW) Fetches from `services` + `service_prices` tables
│   │   ├── dog-haircut/page.tsx
│   │   ├── breed-specific-styling/page.tsx
│   │   ├── nail-trimming/page.tsx
│   │   ├── teeth-brushing/page.tsx
│   │   ├── deshedding/page.tsx
│   │   └── flea-tick-treatment/page.tsx
│   ├── areas/
│   │   ├── page.tsx                   → Service areas hub (NEW)
│   │   ├── la-mirada/page.tsx         → Home city (NEW — targets long-tail queries)
│   │   ├── norwalk/page.tsx
│   │   ├── buena-park/page.tsx
│   │   ├── whittier/page.tsx
│   │   ├── santa-fe-springs/page.tsx
│   │   ├── cerritos/page.tsx
│   │   ├── hacienda-heights/page.tsx
│   │   ├── fullerton/page.tsx
│   │   └── brea/page.tsx
│   ├── blog/
│   │   ├── page.tsx                   → Blog index (NEW)
│   │   ├── dog-grooming-cost-la-mirada/page.tsx
│   │   ├── goldendoodle-grooming-guide/page.tsx
│   │   ├── signs-dog-needs-grooming/page.tsx
│   │   ├── spring-deshedding-guide/page.tsx
│   │   ├── first-puppy-grooming-appointment/page.tsx
│   │   ├── dog-friendly-parks-la-mirada/page.tsx
│   │   ├── french-bulldog-grooming/page.tsx
│   │   ├── hypoallergenic-dog-grooming/page.tsx
│   │   ├── shih-tzu-haircut-styles/page.tsx
│   │   ├── dog-teeth-brushing-grooming/page.tsx
│   │   ├── summer-dog-grooming-guide/page.tsx
│   │   └── poodle-grooming-guide/page.tsx
│   ├── faq/page.tsx                   → FAQ page (NEW)
│   ├── about/page.tsx                 → About / Our Story (NEW — extract from homepage)
│   ├── contact/page.tsx               → Contact / Book Now (NEW — extract from homepage)
│   ├── gallery/page.tsx               → Gallery page (NEW — extract from homepage)
│   └── reviews/page.tsx               → Reviews / Testimonials page (NEW)
├── admin/                             → Admin routes (EXISTING — do not modify)
├── login/                             → Login route (EXISTING — do not modify)
├── sitemap.ts                         → Dynamic XML sitemap (NEW)
└── robots.ts                          → robots.txt (NEW)
```

### 1.2 — Update Navigation

Replace the current hash-link navigation with proper Next.js `<Link>` routes:

```
Main Nav:  Home | Services | Gallery | Reviews | About Us | Contact
Footer:    Services (with sub-links) | Areas We Serve (with city links) | Blog | FAQ
```

Keep the top bar with address and hours. Add breadcrumbs to all interior pages.

---

## Phase 2: Homepage SEO Optimization

### 2.1 — Meta Tags (use Next.js Metadata API)

**IMPORTANT:** The homepage already fetches SEO settings from the `site_content` table (section: `seo`) via `getSeoSettings()`. The current implementation uses these DB values for `<title>` and `<meta description>`. You should **enhance** this existing system rather than replace it.

**For the homepage** — use `generateMetadata()` to merge DB values with SEO-optimized defaults:

```typescript
// src/app/(marketing)/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSeoSettings();
  const businessInfo = await getBusinessInfo();

  return {
    title: seoSettings?.page_title || 'Puppy Day - Dog Grooming in La Mirada, CA | 5-Star Rated',
    description: seoSettings?.meta_description || '5-star rated dog grooming in La Mirada, CA. Gentle one-on-one care with hypoallergenic products. Same-day appointments available!',
    keywords: ['dog grooming La Mirada', 'pet groomer La Mirada CA', 'dog grooming near me', 'best dog groomer La Mirada', 'puppy grooming La Mirada'],
    openGraph: {
      title: seoSettings?.og_title || 'Puppy Day - Professional Dog Grooming in La Mirada, CA',
      description: seoSettings?.og_description || '5-star rated dog grooming with gentle, one-on-one care.',
      url: 'https://thepuppyday.com',
      siteName: businessInfo?.name || 'Puppy Day',
      locale: 'en_US',
      type: 'website',
      ...(seoSettings?.og_image_url && { images: [{ url: seoSettings.og_image_url }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoSettings?.og_title || 'Puppy Day - Dog Grooming in La Mirada, CA',
      description: seoSettings?.og_description || '5-star rated dog grooming with gentle, one-on-one care.',
    },
    alternates: {
      canonical: 'https://thepuppyday.com',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  };
}
```

**For the root layout** — set a title template so all child pages get consistent branding:

```typescript
// src/app/(marketing)/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | Puppy Day Dog Grooming La Mirada',
    default: 'Puppy Day - Dog Grooming in La Mirada, CA',
  },
};
```

**For all new interior pages** — each page should export its own `metadata` or `generateMetadata()`. Static pages (blog, FAQ, about) can use a static `metadata` export. Pages that need DB data (services, gallery) should use `generateMetadata()` with the same Supabase helpers.

### 2.2 — Fix Existing Schema

The current homepage has a `LocalBusiness` schema. Upgrade it to the more specific `PetGroomer` subtype and **make it dynamic** by pulling values from `getBusinessInfo()` and the `settings` table for business hours.

**The schema should be built server-side** in the homepage server component (or a shared `<SchemaOrg>` component) using live DB values, NOT hardcoded strings. Below is the target schema structure — replace hardcoded values with DB lookups where indicated:

```json
{
  "@context": "https://schema.org",
  "@type": "PetGroomer",
  "@id": "https://thepuppyday.com/#business",
  "name": "{{businessInfo.name}}",
  "description": "Professional dog grooming services in {{businessInfo.city}}, {{businessInfo.state}}. 5-star rated, family-run salon offering gentle one-on-one care with hypoallergenic products.",
  "url": "https://thepuppyday.com",
  "telephone": "{{businessInfo.phone}}",
  "email": "{{businessInfo.email}}",
  "image": "https://thepuppyday.com/images/puppy-day-storefront.jpg",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{businessInfo.address}}",
    "addressLocality": "{{businessInfo.city}}",
    "addressRegion": "{{businessInfo.state}}",
    "postalCode": "{{businessInfo.zip}}",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.9172,
    "longitude": -118.0120
  },
  "openingHoursSpecification": "{{GENERATE DYNAMICALLY from settings table business_hours — loop through each day, create an OpeningHoursSpecification entry for each day where is_open=true, using the open/close times from the DB}}",
  "areaServed": [
    { "@type": "City", "name": "La Mirada", "sameAs": "https://en.wikipedia.org/wiki/La_Mirada,_California" },
    { "@type": "City", "name": "Norwalk" },
    { "@type": "City", "name": "Buena Park" },
    { "@type": "City", "name": "Whittier" },
    { "@type": "City", "name": "Santa Fe Springs" },
    { "@type": "City", "name": "Cerritos" },
    { "@type": "City", "name": "Hacienda Heights" },
    { "@type": "City", "name": "Fullerton" },
    { "@type": "City", "name": "Brea" }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Dog Grooming Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dog Bath", "url": "https://thepuppyday.com/services/dog-bath" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dog Haircut", "url": "https://thepuppyday.com/services/dog-haircut" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Breed-Specific Styling", "url": "https://thepuppyday.com/services/breed-specific-styling" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Nail Trimming", "url": "https://thepuppyday.com/services/nail-trimming" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Teeth Brushing", "url": "https://thepuppyday.com/services/teeth-brushing" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Deshedding Treatment", "url": "https://thepuppyday.com/services/deshedding" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Flea & Tick Treatment", "url": "https://thepuppyday.com/services/flea-tick-treatment" } }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "16",
    "bestRating": "5"
  },
  "sameAs": [
    "https://www.yelp.com/biz/puppy-day-la-mirada"
  ]
}
```

---

## Phase 3: Service Pages

### 3.1 — Create 7 Individual Service Pages

Create a reusable service page component/template. Each page should be 500–800 words of unique content.

**Service page template structure:**

```
[Breadcrumb: Home > Services > {Service Name}]

<h1>Professional {Service Name} in La Mirada, CA</h1>

[Hero image — before/after or service photo]

<section: What's Included>
  - Detailed description of what the service entails
  - Who it's ideal for (breed types, coat conditions)
  - How long a typical session takes

<section: Benefits>
  - Hypoallergenic, premium products
  - Warm water baths
  - One-on-one gentle care (no rushing, no cages)
  - Experienced family-run team

<section: Pricing>
  - **DYNAMIC** — fetch from `services` + `service_prices` tables
  - Display size-based pricing tiers (small/medium/large/xlarge) from `service_prices`
  - For add-on services, fetch price from `addons` table
  - Show "Starting from $XX" using the lowest `service_prices.price` for that service
  - Note: "Pricing varies by breed, coat type, and condition"

<section: Before/After Gallery>
  - **DYNAMIC** — fetch from `before_after_pairs` table (filter by relevant service if tags support it, otherwise show general pairs)
  - Fallback: fetch from `gallery_images` table filtered by relevant tags/breed
  - 2–3 images with descriptive alt text

<section: FAQ (2–3 questions specific to this service)>
  - Use <details>/<summary> or accordion pattern
  - Add FAQPage schema for these questions

<section: CTA>
  - "Book Your {Service} Appointment Today"
  - Link to booking/contact page

<section: Related Services>
  - Internal links to 2–3 other service pages
```

**Page-specific details:**

| Page | H1 | Primary Keyword | Pricing Source |
|------|-----|-----------------|---------------|
| `/services/dog-bath/` | Professional Dog Bath in La Mirada, CA | dog bath La Mirada | **DYNAMIC** — `service_prices` for the "basic" service (size tiers) |
| `/services/dog-haircut/` | Expert Dog Haircuts in La Mirada, CA | dog haircut La Mirada | **DYNAMIC** — `service_prices` for the "premium" service (size tiers) |
| `/services/breed-specific-styling/` | Breed-Specific Dog Grooming in La Mirada, CA | breed-specific dog grooming La Mirada | **DYNAMIC** — `service_prices` for premium service + note about breed variation |
| `/services/nail-trimming/` | Dog Nail Trimming in La Mirada, CA | dog nail trimming La Mirada | **DYNAMIC** — `addons` table (nail trimming addon price) |
| `/services/teeth-brushing/` | Dog Teeth Brushing in La Mirada, CA | dog teeth brushing La Mirada | **DYNAMIC** — `addons` table (teeth brushing addon price) |
| `/services/deshedding/` | Professional Deshedding Treatment in La Mirada, CA | deshedding treatment La Mirada | **DYNAMIC** — `addons` table (deshedding addon price) |
| `/services/flea-tick-treatment/` | Flea & Tick Treatment for Dogs in La Mirada, CA | flea and tick treatment dog groomer | **DYNAMIC** — `addons` table (flea & tick addon price) |

**Each service page metadata example:**

```typescript
// app/services/dog-bath/page.tsx
export const metadata: Metadata = {
  title: 'Dog Bath La Mirada, CA - Professional Dog Bathing',
  description: 'Premium dog bath service in La Mirada starting at $40. Warm water, hypoallergenic shampoo, blow dry, ear cleaning & nail trim included. Book same-day!',
  alternates: { canonical: 'https://thepuppyday.com/services/dog-bath' },
};
```

**Each service page needs Service schema (built dynamically):**

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{{service.name from services table}}",
  "description": "{{service.description from services table}}",
  "provider": { "@id": "https://thepuppyday.com/#business" },
  "areaServed": { "@type": "City", "name": "{{businessInfo.city}}" },
  "url": "https://thepuppyday.com/services/dog-bath",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "{{MIN(service_prices.price) for this service}}",
    "highPrice": "{{MAX(service_prices.price) for this service}}",
    "priceCurrency": "USD"
  }
}
```

**Implementation note:** For add-on services (nail trimming, teeth brushing, etc.) that don't have size-based pricing in `service_prices`, use the single price from the `addons` table for both `lowPrice` and `highPrice`.

---

## Phase 4: City Landing Pages (9 Cities Including La Mirada)

### 4.1 — Create City-Specific Landing Pages

Create a reusable city landing page template. Each page should be 400–600 words of **unique content per city** (NOT duplicated with city name swapped).

**Important — La Mirada page:** The `/areas/la-mirada/` page is NOT a duplicate of the homepage. The homepage targets broad brand + service keywords ("Puppy Day dog grooming," "pet groomer near me"). The La Mirada area page targets long-tail discovery queries ("best dog groomer in La Mirada CA," "affordable dog grooming La Mirada 90638," "dog grooming near Imperial Hwy La Mirada"). It also completes the areas hub so visitors see La Mirada listed as your home base alongside the surrounding cities. Use a slightly different H1 than the homepage, e.g., "La Mirada's Top-Rated Dog Grooming Salon — Puppy Day" (vs. the homepage H1 "Professional Dog Grooming in La Mirada"). Include neighborhood-level detail (Leffingwell Rd corridor, near La Mirada Regional Park, etc.) that wouldn't belong on the homepage.

**City page template structure:**

```
[Breadcrumb: Home > Areas We Serve > {City Name}]

<h1>Dog Grooming for {City Name} Residents — Puppy Day, La Mirada</h1>

<section: Introduction>
  - Reference the city by name
  - Mention specific neighborhoods or landmarks in that city
  - State proximity: "Just X minutes from {City} via {specific road}"

<section: Our Services>
  - Brief summary with links to each of the 7 service pages

<section: Why {City} Residents Choose Puppy Day>
  - 5.0 Yelp rating
  - Hypoallergenic products
  - One-on-one gentle care
  - Family-run, personalized experience
  - Same-day appointments

<section: How to Get Here from {City}>
  - Specific driving directions from {City} to 14936 Leffingwell Rd
  - Embedded Google Maps iframe showing the route
  - Estimated drive time

<section: Customer Testimonial>
  - If available, a review from a client in that city
  - Fallback: general testimonial

<section: CTA>
  - "Book Your {City} Pup's Appointment Today"
  - Phone number + booking link
```

**City-specific data to use:**

| City | Distance | Driving Direction | Key Landmarks/Neighborhoods |
|------|----------|-------------------|-----------------------------|
| La Mirada (home city) | 0 min — you're here! | N/A — emphasize "right here in La Mirada" | La Mirada Regional Park, Leffingwell Rd corridor, Biola University, Creek Park, La Mirada Theatre |
| Norwalk | ~5 min | Take Imperial Hwy west or Rosecrans Ave | Norwalk Town Square, Hargitt House, Los Alisos |
| Buena Park | ~8 min | Take Beach Blvd south or Valley View Ave north | Knott's Berry Farm, Entertainment Corridor |
| Whittier | ~10 min | Take Whittier Blvd west or Lambert Rd | Uptown Whittier, Greenleaf Ave, Whittier College |
| Santa Fe Springs | ~7 min | Take Telegraph Rd or Norwalk Blvd north | Heritage Park, Clarke Estate |
| Cerritos | ~8 min | Take South St or Artesia Blvd west | Cerritos Center, Los Cerritos Center mall |
| Hacienda Heights | ~12 min | Take Hacienda Blvd north or Colima Rd | Puente Hills, Hsi Lai Temple |
| Fullerton | ~15 min | Take State College Blvd or Harbor Blvd north | Downtown Fullerton, Cal State Fullerton |
| Brea | ~18 min | Take Imperial Hwy east to State College Blvd | Brea Mall, Downtown Brea, Birch St |

**Each city page metadata:**

```typescript
// app/areas/norwalk/page.tsx
export const metadata: Metadata = {
  title: 'Dog Grooming for Norwalk, CA Residents',
  description: 'Norwalk dog owners: Puppy Day is just 5 minutes away in La Mirada. 5-star rated grooming with hypoallergenic products & one-on-one care. Book today!',
  alternates: { canonical: 'https://thepuppyday.com/areas/norwalk' },
};
```

**Each city page needs LocalBusiness schema with `areaServed`:**

```json
{
  "@context": "https://schema.org",
  "@type": "PetGroomer",
  "name": "Puppy Day - Dog Grooming Near Norwalk",
  "url": "https://thepuppyday.com/areas/norwalk",
  "areaServed": {
    "@type": "City",
    "name": "Norwalk",
    "containedInPlace": { "@type": "State", "name": "California" }
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "14936 Leffingwell Rd",
    "addressLocality": "La Mirada",
    "addressRegion": "CA",
    "postalCode": "90638"
  },
  "telephone": "(657) 252-2903"
}
```

---

## Phase 5: Blog Pages (12 Posts)

### 5.1 — Blog Infrastructure

Create a blog index page at `/blog/` and individual post pages. Use a consistent blog post component/template.

**Blog post template structure:**

```
[Breadcrumb: Home > Blog > {Post Title}]

<article>
  <h1>{SEO-optimized title}</h1>
  <time>{publication date}</time>
  <p class="meta">By Puppy Day Team · X min read</p>

  [Featured image with descriptive alt text]

  {Article body — use proper heading hierarchy: H2 for sections, H3 for subsections}

  <section: FAQ at bottom — 2–3 related questions with FAQPage schema>

  <section: CTA>
    "Ready to book? Schedule your appointment today!"
    [Link to /contact]

  <section: Related Posts>
    Links to 2–3 other blog posts

  <section: Internal Links>
    Links to relevant service pages
</article>
```

### 5.2 — Blog Post Content Specifications

**MONTH 1 POSTS:**

**Post 1: `/blog/dog-grooming-cost-la-mirada/`**
- Title: "How Much Does Dog Grooming Cost in La Mirada, CA? (2026 Price Guide)"
- Target Keywords: dog grooming cost La Mirada, dog grooming prices, how much does dog grooming cost
- Word Count: 1,200–1,500
- Content Brief: Comprehensive pricing guide covering bath vs. full groom vs. breed-specific styling. Include Puppy Day's actual pricing. Compare general market rates. Address factors that affect cost (size, coat type, matting, add-ons). Include FAQ section with pricing questions. Link to all service pages.
- Internal Links: /services/dog-bath/, /services/dog-haircut/, /services/breed-specific-styling/, /faq/

**Post 2: `/blog/goldendoodle-grooming-guide/`**
- Title: "The Complete Goldendoodle Grooming Guide: Styles, Frequency & Tips"
- Target Keywords: goldendoodle grooming, goldendoodle groomer near me, goldendoodle haircut styles
- Word Count: 1,000–1,200
- Content Brief: Cover popular Goldendoodle haircut styles (teddy bear cut, puppy cut, lion cut, summer cut). Discuss grooming frequency (every 6–8 weeks). Home maintenance tips between visits. Why professional grooming matters for doodles. Link to breed-specific styling page.
- Internal Links: /services/breed-specific-styling/, /services/deshedding/, /contact/

**Post 3: `/blog/signs-dog-needs-grooming/`**
- Title: "7 Signs Your Dog Needs Professional Grooming (Don't Wait Too Long)"
- Target Keywords: when to groom dog, dog grooming signs, how often should I groom my dog
- Word Count: 800–1,000
- Content Brief: Cover the 7 signs (matted fur, overgrown nails, bad smell, excessive shedding, dirty ears, stained eyes, coat dullness). For each sign explain why it matters and how professional grooming helps. CTA to book an appointment.
- Internal Links: /services/dog-bath/, /services/nail-trimming/, /services/deshedding/

**Post 4: `/blog/spring-deshedding-guide/`**
- Title: "Spring Deshedding Guide: Beat Shedding Season in Southern California"
- Target Keywords: deshedding treatment, dog shedding help, spring dog grooming
- Word Count: 1,000–1,200
- Content Brief: Explain why dogs shed more in spring. Which breeds shed most. Professional deshedding process. Home grooming tips between visits. Benefits of professional deshedding (reduced allergens, healthier coat). SoCal-specific seasonal tips.
- Internal Links: /services/deshedding/, /services/dog-bath/, /blog/signs-dog-needs-grooming/

**MONTH 2 POSTS:**

**Post 5: `/blog/first-puppy-grooming-appointment/`**
- Title: "First Puppy Grooming Appointment: What to Expect at Puppy Day La Mirada"
- Target Keywords: puppy first grooming appointment, when to start grooming puppy
- Word Count: 1,000–1,200
- Content Brief: When to schedule first grooming (typically 12–16 weeks). How to prepare your puppy. What happens during the visit. Why Puppy Day's gentle one-on-one approach is ideal for first-timers. Tips for a positive experience.
- Internal Links: /services/dog-bath/, /about/, /faq/

**Post 6: `/blog/dog-friendly-parks-la-mirada/`**
- Title: "Best Dog-Friendly Parks & Trails Near La Mirada, CA"
- Target Keywords: dog friendly parks La Mirada, dog parks near La Mirada
- Word Count: 800–1,000
- Content Brief: List top dog parks and trails in and near La Mirada (Creek Park, La Mirada Regional Park, nearby Fullerton/Whittier parks). Include addresses, features, tips. This is "local link bait" — content other local sites may link to.
- Internal Links: /areas/whittier/, /areas/fullerton/, /contact/

**Post 7: `/blog/french-bulldog-grooming/`**
- Title: "French Bulldog Grooming 101: Essential Care Tips for Frenchie Owners"
- Target Keywords: french bulldog grooming, french bulldog grooming near me
- Word Count: 1,000–1,200
- Content Brief: Frenchie-specific grooming needs (skin folds, short coat care, nail sensitivity, ear cleaning). Grooming frequency. Common issues (allergies, skin irritation). Why hypoallergenic products matter for Frenchies.
- Internal Links: /services/dog-bath/, /services/nail-trimming/, /blog/hypoallergenic-dog-grooming/

**Post 8: `/blog/hypoallergenic-dog-grooming/`**
- Title: "Why Hypoallergenic Dog Grooming Products Matter (And What We Use)"
- Target Keywords: hypoallergenic dog grooming, sensitive skin dog shampoo
- Word Count: 1,000–1,200
- Content Brief: Explain what hypoallergenic grooming products are. Common allergens in pet grooming products. Benefits for dogs with sensitive skin. What specific products Puppy Day uses and why. Which breeds benefit most.
- Internal Links: /services/dog-bath/, /about/, /faq/

**MONTH 3 POSTS:**

**Post 9: `/blog/shih-tzu-haircut-styles/`**
- Title: "Shih Tzu Haircut Styles: Top Cuts for Your Shih Tzu in 2026"
- Target Keywords: shih tzu haircut styles, shih tzu grooming
- Word Count: 1,000–1,200
- Content Brief: Popular Shih Tzu styles (puppy cut, teddy bear, top knot, lion cut, practical/short cut). Include descriptions and grooming frequency. Maintenance tips. Why professional grooming is essential for Shih Tzus.
- Internal Links: /services/breed-specific-styling/, /services/dog-haircut/

**Post 10: `/blog/dog-teeth-brushing-grooming/`**
- Title: "Dog Teeth Brushing: Why Professional Dental Grooming Keeps Your Pup Healthy"
- Target Keywords: dog teeth brushing, dog dental grooming
- Word Count: 1,000–1,200
- Content Brief: Importance of dental hygiene for dogs. Signs of dental problems. What professional teeth brushing involves. How often it should be done. Home dental care tips between visits.
- Internal Links: /services/teeth-brushing/, /faq/

**Post 11: `/blog/summer-dog-grooming-guide/`**
- Title: "Summer Dog Grooming Guide: Keeping Your Pup Cool in SoCal Heat"
- Target Keywords: summer dog grooming, summer dog haircut, keep dog cool summer
- Word Count: 1,000–1,200
- Content Brief: Summer grooming tips for Southern California. Should you shave your dog? (No for double-coated breeds.) Summer haircut styles. Hydration and sun protection. Flea and tick prevention in warm months.
- Internal Links: /services/dog-haircut/, /services/flea-tick-treatment/, /services/deshedding/

**Post 12: `/blog/poodle-grooming-guide/`**
- Title: "Poodle Grooming Guide: Standard, Miniature & Toy Poodle Haircuts"
- Target Keywords: poodle grooming, poodle haircut, poodle grooming near me
- Word Count: 1,000–1,200
- Content Brief: Cover all poodle sizes. Popular poodle cuts (puppy clip, continental, English saddle, sporting clip, teddy bear). Grooming frequency (every 4–6 weeks). Home maintenance between appointments.
- Internal Links: /services/breed-specific-styling/, /services/dog-haircut/

---

## Phase 6: FAQ Page

### 6.1 — Dedicated FAQ Page

Create `/faq/` with 15–20 questions. Use an accordion/disclosure pattern. Implement FAQPage schema.

**Questions to include (each with a 2–4 sentence answer):**

1. How much does dog grooming cost in La Mirada? *(target: "dog grooming cost La Mirada")*
2. How often should I get my dog groomed?
3. What's included in a full dog grooming service?
4. Is your grooming salon safe for anxious dogs? *(target: "gentle dog grooming near me")*
5. What hypoallergenic products do you use? *(target: "hypoallergenic dog grooming")*
6. How do I prepare my puppy for their first grooming appointment? *(target: "puppy first grooming")*
7. Do you offer breed-specific grooming styles? *(target: "breed-specific grooming near me")*
8. What's the difference between a bath & brush and a full groom?
9. How long does a typical grooming session take?
10. Do you offer walk-in nail trimming? *(target: "walk-in nail trimming near me")*
11. What breeds do you groom most often?
12. Do you use cage-free grooming?
13. What cities do you serve? *(target: all nearby city keywords)*
14. Do you offer flea and tick treatment? *(target: "flea treatment dog groomer")*
15. Can you groom senior dogs or dogs with special needs?
16. Do you offer same-day appointments?
17. What are your hours and how do I book?
18. Is there parking available at your salon?
19. What makes Puppy Day different from other groomers?
20. Do you groom cats? *(Answer: Currently dogs only.)*

**FAQPage schema for the FAQ page:**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does dog grooming cost in La Mirada?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "At Puppy Day, basic grooming (bath, nail trim, ear cleaning) starts at $40 for small dogs and $85 for extra-large breeds. Full haircuts with breed-specific styling range from $70 to $150 depending on size and coat type."
      }
    }
  ]
}
```

---

## Phase 7: Technical SEO

### 7.1 — XML Sitemap (Dynamic)

Create a dynamic sitemap using Next.js `sitemap.ts`:

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://thepuppyday.com';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/areas`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  const services = ['dog-bath', 'dog-haircut', 'breed-specific-styling', 'nail-trimming', 'teeth-brushing', 'deshedding', 'flea-tick-treatment'];
  const servicePages = services.map(s => ({
    url: `${baseUrl}/services/${s}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const cities = ['la-mirada', 'norwalk', 'buena-park', 'whittier', 'santa-fe-springs', 'cerritos', 'hacienda-heights', 'fullerton', 'brea'];
  const cityPages = cities.map(c => ({
    url: `${baseUrl}/areas/${c}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const blogSlugs = [
    'dog-grooming-cost-la-mirada', 'goldendoodle-grooming-guide', 'signs-dog-needs-grooming',
    'spring-deshedding-guide', 'first-puppy-grooming-appointment', 'dog-friendly-parks-la-mirada',
    'french-bulldog-grooming', 'hypoallergenic-dog-grooming', 'shih-tzu-haircut-styles',
    'dog-teeth-brushing-grooming', 'summer-dog-grooming-guide', 'poodle-grooming-guide'
  ];
  const blogPages = blogSlugs.map(b => ({
    url: `${baseUrl}/blog/${b}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...servicePages, ...cityPages, ...blogPages];
}
```

### 7.2 — Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/login/', '/api/'],
    },
    sitemap: 'https://thepuppyday.com/sitemap.xml',
  };
}
```

### 7.3 — Canonical URLs

Every page must have a canonical URL set via the Next.js Metadata API:

```typescript
alternates: { canonical: 'https://thepuppyday.com/services/dog-bath' }
```

### 7.4 — Breadcrumb Component + Schema

Create a reusable `<Breadcrumb>` component that renders both visible breadcrumbs and `BreadcrumbList` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://thepuppyday.com" },
    { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://thepuppyday.com/services" },
    { "@type": "ListItem", "position": 3, "name": "Dog Bath", "item": "https://thepuppyday.com/services/dog-bath" }
  ]
}
```

### 7.5 — Image Optimization

- Convert all images to WebP format (use Next.js `<Image>` component which does this automatically)
- Add descriptive `alt` text to every image using this pattern: `"{breed/description} {action} at Puppy Day La Mirada"` (e.g., "goldendoodle after haircut at Puppy Day La Mirada")
- Lazy-load all below-fold images (Next.js `<Image>` does this by default)
- Set explicit `width` and `height` on all images to prevent CLS

### 7.6 — Internal Linking Strategy

Every page should link to at least 2–3 other pages:

- **Service pages** → link to related services, relevant blog posts, and booking page
- **Blog posts** → link to relevant service pages, related blog posts, and FAQ
- **City pages** → link to all service pages, booking page, and reviews
- **FAQ page** → link to service pages and blog posts where answers are expanded
- **Homepage** → link to services overview, areas we serve, and recent blog posts

### 7.7 — Performance Targets

- LCP (Largest Contentful Paint): ≤ 2.5 seconds
- INP (Interaction to Next Paint): ≤ 200ms
- CLS (Cumulative Layout Shift): ≤ 0.1
- PageSpeed mobile score: 90+
- Use Next.js built-in optimizations: automatic code splitting, image optimization, font optimization

---

## Phase 8: Shared Components to Build

### 8.1 — Component List

Create these reusable components. **Reuse existing marketing components** where possible (see `src/components/marketing/index.ts` for the barrel export). Only build new components where functionality doesn't already exist.

| Component | Used On | Data Source | Purpose |
|-----------|---------|-------------|---------|
| `Breadcrumb` | All interior pages | Props (static path segments) | Visual breadcrumbs + BreadcrumbList schema |
| `SchemaOrg` | All pages | Props (accepts schema object) | Renders JSON-LD `<script>` tags — **build schema objects server-side using `getBusinessInfo()` and other DB helpers** |
| `ServiceCard` | Services overview, city pages | **DYNAMIC** — `services` + `service_prices` tables | Consistent service card linking to individual service page. **NOTE:** An existing `ServiceCard` exists in `src/components/marketing/` — extend it rather than replacing it |
| `CTABooking` | All pages | **DYNAMIC** — `getBusinessInfo()` for phone | "Book Your Appointment" CTA block — phone from DB, not hardcoded |
| `FAQAccordion` | FAQ page, blog posts, service pages | Props (accepts Q&A array) | Expandable Q&A + FAQPage schema |
| `BlogPostLayout` | All blog posts | Props | Consistent blog post layout with meta, TOC, related posts |
| `CityLandingLayout` | All city pages | **DYNAMIC** — `getBusinessInfo()` for address/phone + props for city-specific content | Consistent city page layout with map embed, directions, CTA |
| `TestimonialCard` | Homepage, city pages, service pages | **HARDCODED** (currently in `testimonials-section.tsx`) | Customer review display — reuse existing component |
| `RelatedPosts` | Blog posts | Props (accepts post slugs/titles) | Grid of 2–3 related blog post cards |
| `GoogleMapEmbed` | City pages, contact page | Props (address or coordinates) | Responsive Google Maps iframe |
| `Footer` | All pages | **DYNAMIC** — `getBusinessInfo()` for contact info, social links | Expanded footer with service links, city links, blog links. **NOTE:** Existing footer already uses dynamic business info — extend it with new link sections |
| `BeforeAfterGallery` | Service pages | **DYNAMIC** — `before_after_pairs` table | Before/after images for service pages. **Reuse existing `BeforeAfterSlider` component** |

### 8.2 — Existing Components to Reuse

Check these existing components before building new ones:

| Existing Component | Location | Can Be Reused For |
|--------------------|----------|-------------------|
| `ServiceCard` | `src/components/marketing/service-card.tsx` | Service overview page, city pages |
| `ServiceSection` | `src/components/marketing/` | Services hub page |
| `GalleryGrid` | `src/components/marketing/` | Gallery page, service pages |
| `BeforeAfterSlider` | `src/components/marketing/` | Service pages, city pages |
| `BeforeAfterCarousel` | `src/components/marketing/` | Service pages |
| `ContactSection` | `src/components/marketing/` | Contact page (extract from homepage) |
| `AboutSection` | `src/components/marketing/about-section.tsx` | About page (extract from homepage) |
| `TestimonialsSection` | `src/components/marketing/testimonials-section.tsx` | Reviews page (extract from homepage) |
| `GallerySection` | `src/components/marketing/` | Gallery page (extract from homepage) |
| `PromoBannerCarousel` | `src/components/marketing/` | Can be shown on service/city pages |
| `StickyBookingButton` | `src/components/marketing/` | Should appear on all new pages too |

---

## Implementation Order (Recommended)

Execute in this sequence to minimize breaking changes:

1. **Understand the existing codebase** — Read `src/app/(marketing)/page.tsx` to understand the data-fetching pattern, `src/lib/site-content.ts` for the DB helpers, and `src/components/marketing/index.ts` for available components
2. **Update the `(marketing)` layout** — Expand nav with proper `<Link>` routes, expand footer with service/area/blog links, add global `PetGroomer` schema using `getBusinessInfo()`
3. **Create reusable NEW components** (Breadcrumb, SchemaOrg, CTABooking, FAQAccordion, GoogleMapEmbed)
4. **Create standalone pages** by extracting existing homepage sections — About, Contact, Gallery, Reviews pages should import and reuse the existing section components, not duplicate code
5. **Create Services hub** + 7 individual service pages — fetch pricing from `services`/`service_prices`/`addons` tables
6. **Create FAQ page** with FAQPage schema
7. **Create Areas hub** + 9 city landing pages (including La Mirada) — use `getBusinessInfo()` for address/phone
8. **Create Blog infrastructure** + blog index page
9. **Create 12 blog post pages** (can be done in batches)
10. **Add sitemap.ts and robots.ts** at `src/app/` level (NOT inside the route group)
11. **Ensure `StickyBookingButton` appears on all new pages** (it currently shows on the homepage after 600px scroll)
12. **Audit all pages** for meta tags, canonical URLs, schema, alt text, internal links
13. **Run Lighthouse/PageSpeed** and fix any performance issues

---

## Important Notes

- **Do NOT delete or break the existing homepage.** Refactor it to work within the new multi-page architecture while keeping the same visual design.
- **Stay inside the `(marketing)` route group.** All new public-facing pages must be created under `src/app/(marketing)/` to inherit the existing marketing layout. The `admin/` and `login/` routes are separate and should NOT be modified.
- **Follow the existing data-fetching pattern.** Use server components with `Promise.all()` for parallel DB queries. Use ISR with `revalidate = 900` (15 minutes). Reference `src/app/(marketing)/page.tsx` as the canonical example.
- **Never hardcode values that exist in the database.** Service names, prices, business info, hours, and gallery images all come from Supabase. Use the existing helpers: `getBusinessInfo()`, `getSeoSettings()`, `getHeroContent()`, and direct Supabase queries for services/gallery/before-after data.
- **Use fallback defaults for all DB values.** The existing `getSiteContent()` helper has hardcoded fallbacks — follow the same pattern for new pages so the site works even if a DB query fails.
- **Reuse existing marketing components** from `src/components/marketing/` rather than building duplicates. Import from the barrel export at `src/components/marketing/index.ts`.
- **Every page needs unique `<title>`, `<meta description>`, `<h1>`, and `canonical` URL.** No duplicates.
- **All schema markup should be JSON-LD** injected via `<script type="application/ld+json">` tags, with values built server-side from DB data.
- **All images must use the Next.js `<Image>` component** for automatic WebP conversion, lazy loading, and responsive sizing.
- **Blog post content should be real, substantive content** — not placeholder text. Write the actual 800–1,500 word articles based on the content briefs above.
- **Every page should have at least one CTA** linking to the booking/contact page. Use the phone number from `getBusinessInfo()`, not a hardcoded string.
- **Ensure `StickyBookingButton` is present on all new pages** — it's tied to the booking system and should appear after 600px scroll on every marketing page.
- **Test all schema with Google's Rich Results Test** (https://search.google.com/test/rich-results) after implementation.