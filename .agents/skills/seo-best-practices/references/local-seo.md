# Local SEO Deep Dive

## Google Business Profile (GBP)

Google Business Profile is the single most important local ranking factor. It controls what appears in the local pack (3-pack), Google Maps, and the Knowledge Panel.

### Optimization Checklist

- [ ] Business name matches website exactly (no keyword stuffing)
- [ ] Address is complete and matches website/schema exactly
- [ ] Phone number is local (not toll-free) and matches website
- [ ] Business hours are accurate and updated for holidays
- [ ] Primary category: "Pet Groomer" (most specific available)
- [ ] Secondary categories: "Dog Grooming Service", "Pet Service"
- [ ] Description: 750 characters, keywords in first sentence
- [ ] Photos: 10+ high-quality photos (storefront, interior, staff, pets)
- [ ] Services: All services listed with descriptions and prices
- [ ] Attributes: Relevant attributes checked (wheelchair accessible, etc.)
- [ ] Posts: Weekly Google Posts (offers, updates, events)
- [ ] Q&A: Seed 5-10 common questions and answers
- [ ] Reviews: Actively request reviews, respond to all within 24 hours

### Review Strategy

Reviews are a top-3 local ranking factor:

1. **Ask at the right moment**: After a successful grooming appointment, send an email/SMS with a direct review link
2. **Make it easy**: Use the GBP short URL: `https://g.page/r/YOUR_PLACE_ID/review`
3. **Respond to all reviews**: Thank positive reviewers, address negative ones professionally
4. **Never incentivize reviews**: Google penalizes businesses that offer discounts for reviews
5. **Aim for recency**: A steady stream of recent reviews matters more than total count

### Review Schema on Website

Display reviews on your website with proper schema markup. The AggregateRating should reflect real review data from your database, and individual Review schemas should match actual customer reviews.

---

## NAP Consistency

NAP = Name, Address, Phone. These must be identical everywhere:

- Website header/footer
- Contact page
- JSON-LD schema on every page
- Google Business Profile
- Yelp, Facebook, Instagram business pages
- Local directories (Yellow Pages, BBB, etc.)
- Apple Maps

Even small differences hurt (e.g., "St" vs "Street", "Suite 100" vs "#100"). Pick one format and use it everywhere.

### NAP Format (pick one, use everywhere)

```
Puppy Day
123 Main Street, Suite 100
La Mirada, CA 90638
(562) 555-1234
```

---

## City Landing Pages

City pages target "[service] in [city]" searches, which are high-intent local queries.

### Content Requirements

Each city page needs **unique content** — not just the city name swapped out. Google's Helpful Content Update specifically targets thin, duplicated city pages.

Minimum content per page:
- 400+ words of unique text
- City-specific information (landmarks, neighborhoods, distance from your location)
- Specific services available in that area
- Customer testimonials from that city (if available)
- Driving directions or service area details
- Unique H1, title, and meta description

### City Page Structure Template

```
H1: Professional Dog Grooming in [City], CA
  - Introductory paragraph mentioning the city naturally
  - Why customers from [City] choose Puppy Day
  - Distance/driving time from [City]

H2: Our Dog Grooming Services in [City]
  - Brief service descriptions with links to full service pages
  - Pricing overview

H2: What [City] Pet Owners Say
  - 2-3 reviews from customers in that city
  - Link to all reviews

H2: Serving the [City] Community
  - Local details: nearby landmarks, neighborhoods
  - Service area map or directions
  - Hours of operation

CTA: Book your appointment — serving [City] and surrounding areas
```

### City Page Schema

```json
{
  "@type": "PetGroomer",
  "name": "Puppy Day - Dog Grooming near [City]",
  "url": "https://thepuppyday.com/dog-grooming/[city-slug]",
  "areaServed": {
    "@type": "City",
    "name": "[City]",
    "containedInPlace": {
      "@type": "State",
      "name": "California"
    }
  },
  "address": { ... },
  "geo": { ... }
}
```

---

## Local Citation Building

Citations are mentions of your business (NAP) on other websites. They help Google verify your business exists and is located where you say.

### Priority Citations (set up first)

1. Google Business Profile
2. Yelp
3. Facebook Business Page
4. Apple Maps / Apple Business Connect
5. Bing Places
6. Better Business Bureau (BBB)
7. Yellow Pages / YP.com
8. Nextdoor Business
9. Instagram Business Profile
10. Local Chamber of Commerce

### Industry-Specific Citations

For pet services:
- Rover.com
- BringFido
- DogGrooming.com
- PetGroomer.com
- Local pet directories

### Citation Consistency Audit

Periodically search for your business name and check that NAP is consistent. Tools like Moz Local, BrightLocal, or Whitespark can automate this.

---

## Local Link Building

Local backlinks are more valuable than generic ones for local SEO:

- Sponsor local events (dog shows, pet adoption events, school fundraisers)
- Partner with local veterinarians, pet stores, dog trainers (mutual linking)
- Get listed in local business directories and "best of" lists
- Create content about local topics (e.g., "Best Dog Parks in La Mirada")
- Participate in community events and get mentioned in local news/blogs

---

## Service Area Schema

If you serve multiple cities from one location, use areaServed to declare your service area:

```json
{
  "@type": "PetGroomer",
  "areaServed": [
    { "@type": "City", "name": "La Mirada" },
    { "@type": "City", "name": "Whittier" },
    { "@type": "City", "name": "Cerritos" },
    { "@type": "City", "name": "Norwalk" },
    { "@type": "City", "name": "Buena Park" },
    { "@type": "City", "name": "Santa Fe Springs" }
  ]
}
```

List cities in order of importance/proximity. Include all cities you genuinely serve.

---

## Measuring Local SEO Performance

### Google Search Console

- Check "Search Results" for local queries (city names + services)
- Monitor click-through rate for local keywords
- Check for manual actions or indexing issues

### Google Business Profile Insights

- Track search queries that lead to your GBP
- Monitor photo views, direction requests, phone calls
- Compare month-over-month engagement

### Key Metrics to Track

- GBP impressions and actions (calls, directions, website clicks)
- Local keyword rankings (track top 20 city+service combos)
- Review count and average rating over time
- Website traffic from local organic search
- Phone calls and booking conversions from organic traffic
