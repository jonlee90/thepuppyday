# SEO Audit Checklist

Use this checklist when auditing a page or reviewing SEO implementation. Score each item as Pass, Fail, or N/A.

## Page-Level Audit

### 1. Metadata

| Item | Check | Priority |
|------|-------|----------|
| Title tag | 50-60 chars, keyword near front, brand at end, unique | Critical |
| Meta description | 150-160 chars, keyword + CTA, unique | High |
| Canonical URL | Present, correct, self-referencing | Critical |
| metadataBase | Set in root layout | High |
| Title template | Set in marketing layout (%s pipe Brand) | Medium |

### 2. Open Graph & Social

| Item | Check | Priority |
|------|-------|----------|
| og:title | Present, optimized for social sharing | High |
| og:description | Present, different from meta description | Medium |
| og:image | 1200x630px, high quality, present | High |
| og:url | Matches canonical | Medium |
| og:type | Correct type (website, article, etc.) | Medium |
| twitter:card | summary_large_image | Medium |

### 3. Structured Data

| Item | Check | Priority |
|------|-------|----------|
| JSON-LD present | Appropriate schema type for page | Critical |
| Schema validates | No errors in Google Rich Results Test | Critical |
| LocalBusiness | On all pages (homepage minimum) | Critical |
| AggregateRating | Real data, not fake | High |
| BreadcrumbList | On all pages with hierarchy | High |
| FAQPage | On pages with FAQ content | Medium |

### 4. Content Structure

| Item | Check | Priority |
|------|-------|----------|
| Single H1 | Exactly one, contains primary keyword | Critical |
| Heading hierarchy | No skipped levels (H1, H2, H3...) | High |
| Keyword in first paragraph | Primary keyword within first 100 words | High |
| Internal links | 2-5 contextual links to related pages | High |
| Image alt text | All images have descriptive alt text | High |
| Content length | 300+ words for service pages, 800+ for blog | Medium |

### 5. Technical

| Item | Check | Priority |
|------|-------|----------|
| HTTPS | All resources loaded over HTTPS | Critical |
| Mobile responsive | No horizontal scroll, readable text | Critical |
| Page in sitemap | Included in sitemap.ts output | High |
| Not blocked by robots | Not disallowed in robots.ts | Critical |
| No noindex | Unless intentionally excluded | Critical |
| Clean URL | Lowercase, hyphens, no special chars | Medium |
| 404 handling | Custom 404 page, no broken links | Medium |

### 6. Performance (Core Web Vitals)

| Item | Check | Priority |
|------|-------|----------|
| LCP under 2.5s | Check PageSpeed Insights | Critical |
| INP under 200ms | Check PageSpeed Insights | High |
| CLS under 0.1 | Check PageSpeed Insights | High |
| Hero image priority | `priority` prop on LCP image | High |
| Font optimization | Using next/font | Medium |
| JS bundle size | Under 100KB first-load for marketing | Medium |

### 7. Local SEO (if applicable)

| Item | Check | Priority |
|------|-------|----------|
| LocalBusiness schema | Full address, phone, hours, geo | Critical |
| NAP consistency | Matches GBP exactly | Critical |
| areaServed | Cities listed in schema | High |
| Google Business Profile | Claimed, optimized, active | Critical |
| Review schema | AggregateRating with real data | High |

---

## Site-Wide Audit

### Indexing & Crawling

| Item | Check |
|------|-------|
| sitemap.ts generates valid XML | Check /sitemap.xml output |
| All important pages in sitemap | Services, cities, blog, homepage |
| robots.ts allows crawling of public pages | Check /robots.txt output |
| Admin/auth pages blocked from crawling | /admin/, /login/, /api/ disallowed |
| No orphan pages | Every page linked from at least one other page |
| No redirect chains | Max 1 redirect hop |
| No duplicate content | Canonicals set correctly |

### Cross-Page Checks

| Item | Check |
|------|-------|
| No duplicate titles | Every page has unique title tag |
| No duplicate descriptions | Every page has unique meta description |
| Consistent NAP | Name/address/phone identical everywhere |
| Internal link coverage | All service pages linked from homepage |
| Breadcrumb consistency | Present on all inner pages |

---

## Fix Priorities

When multiple issues are found, fix in this order:

1. **Critical blockers**: noindex on public pages, broken canonicals, missing HTTPS
2. **Structured data errors**: Invalid schema, missing LocalBusiness
3. **Content issues**: Missing H1, duplicate titles, no meta descriptions
4. **Performance**: LCP over 4s, CLS over 0.25
5. **Enhancements**: FAQ schema, review markup, Open Graph images
6. **Minor**: Title length optimization, meta description tweaks

---

## Tools

- **Google Search Console**: Real indexing data, manual actions, Core Web Vitals
- **Google Rich Results Test**: Validate structured data
- **PageSpeed Insights**: Core Web Vitals lab + field data
- **Screaming Frog**: Full site crawl for technical issues (free up to 500 URLs)
- **Ahrefs/Moz**: Backlink analysis, keyword tracking
- **Schema.org Validator**: Validate JSON-LD syntax
