# Structured Data (JSON-LD) Templates

Complete JSON-LD templates for every page type. Copy and adapt these for your pages.

## Table of Contents

1. [LocalBusiness (Homepage)](#localbusiness-homepage)
2. [Organization](#organization)
3. [WebSite with SearchAction](#website-with-searchaction)
4. [FAQPage](#faqpage)
5. [Service with Offers](#service-with-offers)
6. [BlogPosting](#blogposting)
7. [BreadcrumbList](#breadcrumblist)
8. [AggregateRating](#aggregaterating)
9. [Review (Individual)](#review-individual)
10. [Multi-schema @graph Pattern](#multi-schema-graph-pattern)

---

## LocalBusiness (Homepage)

This is the most important schema for local service businesses. It powers the Google Knowledge Panel and local pack results.

```json
{
  "@type": "PetGroomer",
  "name": "Puppy Day",
  "url": "https://thepuppyday.com",
  "telephone": "+1-562-XXX-XXXX",
  "email": "info@thepuppyday.com",
  "image": "https://thepuppyday.com/images/storefront.jpg",
  "logo": "https://thepuppyday.com/images/logo.png",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "La Mirada",
    "addressRegion": "CA",
    "postalCode": "90638",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.9172,
    "longitude": -118.0120
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "areaServed": [
    { "@type": "City", "name": "La Mirada" },
    { "@type": "City", "name": "Whittier" },
    { "@type": "City", "name": "Cerritos" }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Dog Grooming Services",
    "itemListElement": [
      {
        "@type": "OfferCatalog",
        "name": "Basic Grooming",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Basic Bath & Brush",
              "description": "Full bath, blow dry, brush out, nail trim"
            },
            "price": "40.00",
            "priceCurrency": "USD"
          }
        ]
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  "sameAs": [
    "https://www.instagram.com/thepuppyday",
    "https://www.yelp.com/biz/puppy-day-la-mirada",
    "https://www.facebook.com/thepuppyday"
  ]
}
```

**Required properties**: @type, name, address
**Recommended for rich results**: telephone, openingHoursSpecification, geo, aggregateRating, priceRange, image

Use `PetGroomer` as the @type (subtype of LocalBusiness) for better categorization.

---

## Organization

Establishes your brand identity in Google's Knowledge Graph.

```json
{
  "@type": "Organization",
  "name": "Puppy Day",
  "url": "https://thepuppyday.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://thepuppyday.com/images/logo.png",
    "width": 512,
    "height": 512
  },
  "sameAs": [
    "https://www.instagram.com/thepuppyday",
    "https://www.yelp.com/biz/puppy-day-la-mirada",
    "https://www.facebook.com/thepuppyday"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-562-XXX-XXXX",
    "contactType": "customer service",
    "availableLanguage": ["English", "Spanish"]
  }
}
```

---

## WebSite with SearchAction

Enables sitelinks search box in Google results.

```json
{
  "@type": "WebSite",
  "name": "Puppy Day",
  "url": "https://thepuppyday.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://thepuppyday.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Only include SearchAction if your site actually has a search feature.

---

## FAQPage

Triggers expandable FAQ rich results directly in search. High-impact for service businesses.

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does dog grooming cost in La Mirada?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dog grooming at Puppy Day starts at $40 for basic grooming and goes up to $150 for premium packages, depending on your dog's size and coat type."
      }
    },
    {
      "@type": "Question",
      "name": "How often should I get my dog groomed?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most dogs benefit from professional grooming every 4-6 weeks. Breeds with longer coats may need grooming every 3-4 weeks."
      }
    }
  ]
}
```

**Tips**:
- Use real questions customers ask (check Google Search Console queries)
- Answers should be concise but complete (50-200 words)
- 5-8 questions is ideal for the homepage; 3-5 for service pages

---

## Service with Offers

For individual service pages. Triggers pricing info in search results.

```json
{
  "@type": "Service",
  "name": "Premium Dog Grooming",
  "description": "Full grooming experience including bath, haircut, nail trim, ear cleaning, and teeth brushing.",
  "url": "https://thepuppyday.com/services/premium-grooming",
  "provider": {
    "@type": "PetGroomer",
    "name": "Puppy Day",
    "url": "https://thepuppyday.com"
  },
  "areaServed": {
    "@type": "City",
    "name": "La Mirada",
    "containedInPlace": {
      "@type": "State",
      "name": "California"
    }
  },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "70",
    "highPrice": "150",
    "priceCurrency": "USD",
    "offerCount": "4"
  }
}
```

Use `AggregateOffer` when you have size-based pricing tiers. Use a single `Offer` with `price` when there's one fixed price.

---

## BlogPosting

For blog/article pages. Can trigger article rich results.

```json
{
  "@type": "BlogPosting",
  "headline": "How Much Does Dog Grooming Cost in La Mirada?",
  "description": "A complete guide to dog grooming prices in La Mirada, CA.",
  "url": "https://thepuppyday.com/blog/dog-grooming-cost-la-mirada",
  "datePublished": "2025-12-15T08:00:00-08:00",
  "dateModified": "2026-01-10T10:00:00-08:00",
  "author": {
    "@type": "Organization",
    "name": "Puppy Day",
    "url": "https://thepuppyday.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Puppy Day",
    "logo": {
      "@type": "ImageObject",
      "url": "https://thepuppyday.com/images/logo.png"
    }
  },
  "image": "https://thepuppyday.com/images/blog/grooming-cost.jpg",
  "keywords": ["dog grooming cost", "La Mirada", "pet grooming prices"]
}
```

---

## BreadcrumbList

Triggers breadcrumb trail in search results. Important for site hierarchy signals.

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://thepuppyday.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Services",
      "item": "https://thepuppyday.com/services"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Premium Grooming"
    }
  ]
}
```

The last item should NOT have an `item` property (it represents the current page).

---

## AggregateRating

Can be embedded in LocalBusiness or used standalone. Triggers star rating snippets.

```json
{
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "127",
  "bestRating": "5",
  "worstRating": "1"
}
```

Only use real review data. Google penalizes fake or inflated ratings. Pull from your database dynamically.

---

## Review (Individual)

For displaying individual customer reviews with schema markup.

```json
{
  "@type": "Review",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "author": {
    "@type": "Person",
    "name": "Jane D."
  },
  "datePublished": "2026-01-15",
  "reviewBody": "Amazing grooming service! My dog looked and smelled wonderful.",
  "itemReviewed": {
    "@type": "PetGroomer",
    "name": "Puppy Day"
  }
}
```

---

## Multi-schema @graph Pattern

Combine multiple schemas on one page using the @graph array. This is the recommended approach for pages that need several schema types (like the homepage).

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "LocalBusiness", ... },
    { "@type": "Organization", ... },
    { "@type": "WebSite", ... },
    { "@type": "FAQPage", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

The @graph pattern tells Google that all these schemas are related to the same page. This is preferred over multiple separate script tags.

---

## Validation

Always validate structured data after implementation:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Google Search Console**: Check "Enhancements" section for errors after indexing
