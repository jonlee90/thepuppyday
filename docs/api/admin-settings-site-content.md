# Site Content API Documentation

## Overview

The Site Content API provides endpoints for managing the marketing site's hero section, SEO settings, and business information. All endpoints require admin authentication.

**Base Path**: `/api/admin/settings/site-content`

## Authentication

All endpoints require authentication with `admin` or `groomer` role. Uses `requireAdmin()` middleware.

## Endpoints

### GET `/api/admin/settings/site-content`

Fetch all site content sections (hero, seo, business_info) with their last updated timestamps.

#### Request

```http
GET /api/admin/settings/site-content
Authorization: Bearer <session-token>
```

#### Response

**Success (200)**

```json
{
  "hero": {
    "content": {
      "headline": "Welcome to Puppy Day",
      "subheadline": "Professional grooming for your furry friends",
      "background_image_url": "https://example.com/hero.jpg",
      "cta_buttons": [
        {
          "text": "Book Now",
          "url": "/booking",
          "style": "primary"
        },
        {
          "text": "Our Services",
          "url": "/services",
          "style": "secondary"
        }
      ]
    },
    "last_updated": "2024-01-15T10:00:00Z"
  },
  "seo": {
    "content": {
      "page_title": "Puppy Day - Professional Dog Grooming in La Mirada",
      "meta_description": "Professional dog grooming services in La Mirada, CA. Book your appointment today!",
      "og_title": "Puppy Day - Dog Grooming",
      "og_description": "Professional dog grooming in La Mirada",
      "og_image_url": "https://example.com/og-image.jpg"
    },
    "last_updated": "2024-01-15T11:00:00Z"
  },
  "business_info": {
    "content": {
      "name": "Puppy Day",
      "address": "14936 Leffingwell Rd",
      "city": "La Mirada",
      "state": "CA",
      "zip": "90638",
      "phone": "(657) 252-2903",
      "email": "puppyday14936@gmail.com",
      "social_links": {
        "instagram": "https://instagram.com/puppyday_lm",
        "facebook": "https://facebook.com/puppyday",
        "yelp": "https://yelp.com/biz/puppy-day"
      }
    },
    "last_updated": "2024-01-15T12:00:00Z"
  }
}
```

**Notes:**
- If a section hasn't been configured yet, `content` will be `null` and `last_updated` will be `null`
- All three sections are always returned, even if empty

**Error (500)**

```json
{
  "error": "Failed to fetch site content"
}
```

---

### PUT `/api/admin/settings/site-content`

Update a specific site content section. Creates new record if section doesn't exist, updates existing record otherwise.

#### Request

```http
PUT /api/admin/settings/site-content
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "section": "hero",
  "data": {
    "headline": "Updated Headline",
    "subheadline": "Updated Subheadline",
    "background_image_url": "https://example.com/new-hero.jpg",
    "cta_buttons": [
      {
        "text": "Book Now",
        "url": "/booking",
        "style": "primary"
      }
    ]
  }
}
```

#### Parameters

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `section` | string | Yes | Section to update: `hero`, `seo`, or `business_info` |
| `data` | object | Yes | Section-specific content data (validated by Zod schemas) |

#### Section-Specific Data Schemas

**Hero Section (`section: "hero"`)**

```typescript
{
  headline: string;              // 1-100 characters
  subheadline: string;           // 1-200 characters
  background_image_url: string | null;  // Valid URL or null
  cta_buttons: Array<{
    text: string;                // 1-50 characters
    url: string;                 // 1-200 characters
    style: 'primary' | 'secondary';
  }>;                            // Max 3 buttons
}
```

**SEO Section (`section: "seo"`)**

```typescript
{
  page_title: string;            // 1-60 characters
  meta_description: string;      // 1-160 characters
  og_title: string;              // 1-60 characters
  og_description: string;        // 1-160 characters
  og_image_url: string | null;   // Valid URL or null
}
```

**Business Info Section (`section: "business_info"`)**

```typescript
{
  name: string;                  // 1-100 characters
  address: string;               // 1-200 characters
  city: string;                  // 1-100 characters
  state: string;                 // 2 characters (state code)
  zip: string;                   // Format: 12345 or 12345-6789
  phone: string;                 // Format: (123) 456-7890
  email: string;                 // Valid email address
  social_links: {
    instagram?: string;          // Valid URL (optional)
    facebook?: string;           // Valid URL (optional)
    yelp?: string;               // Valid URL (optional)
    twitter?: string;            // Valid URL (optional)
  };
}
```

#### Response

**Success (200)**

```json
{
  "section": "hero",
  "content": {
    "headline": "Updated Headline",
    "subheadline": "Updated Subheadline",
    "background_image_url": "https://example.com/new-hero.jpg",
    "cta_buttons": [
      {
        "text": "Book Now",
        "url": "/booking",
        "style": "primary"
      }
    ]
  },
  "updated_at": "2024-01-15T15:00:00Z"
}
```

**Validation Error (400)**

```json
{
  "error": "Invalid hero content data",
  "details": {
    "headline": {
      "_errors": ["String must contain at least 1 character(s)"]
    }
  }
}
```

**Invalid Section (400)**

```json
{
  "error": "Invalid section. Must be one of: hero, seo, business_info"
}
```

**Server Error (500)**

```json
{
  "error": "Failed to update site content"
}
```

## Database Schema

**Table**: `site_content`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `section` | text | Section identifier (hero, seo, business_info) |
| `content` | jsonb | Section-specific content data |
| `updated_at` | timestamptz | Last update timestamp |

**Constraints:**
- `section` must be unique
- `content` is validated before storage using Zod schemas

## Usage Examples

### Fetch All Site Content

```typescript
const response = await fetch('/api/admin/settings/site-content', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data.hero.content.headline);
```

### Update Hero Section

```typescript
const heroData = {
  section: 'hero',
  data: {
    headline: 'Welcome to Puppy Day',
    subheadline: 'Professional grooming for your furry friends',
    background_image_url: 'https://example.com/hero.jpg',
    cta_buttons: [
      { text: 'Book Now', url: '/booking', style: 'primary' },
      { text: 'Our Services', url: '/services', style: 'secondary' },
    ],
  },
};

const response = await fetch('/api/admin/settings/site-content', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(heroData),
});

const result = await response.json();
console.log('Updated at:', result.updated_at);
```

### Update SEO Settings

```typescript
const seoData = {
  section: 'seo',
  data: {
    page_title: 'Puppy Day - Professional Dog Grooming',
    meta_description: 'Best dog grooming in La Mirada, CA',
    og_title: 'Puppy Day',
    og_description: 'Professional dog grooming services',
    og_image_url: 'https://example.com/og.jpg',
  },
};

const response = await fetch('/api/admin/settings/site-content', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(seoData),
});
```

### Update Business Information

```typescript
const businessData = {
  section: 'business_info',
  data: {
    name: 'Puppy Day',
    address: '14936 Leffingwell Rd',
    city: 'La Mirada',
    state: 'CA',
    zip: '90638',
    phone: '(657) 252-2903',
    email: 'puppyday14936@gmail.com',
    social_links: {
      instagram: 'https://instagram.com/puppyday_lm',
      yelp: 'https://yelp.com/biz/puppy-day',
    },
  },
};

const response = await fetch('/api/admin/settings/site-content', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(businessData),
});
```

## Error Handling

The API uses consistent error handling:

1. **Authentication Errors**: Handled by `requireAdmin()` middleware
2. **Validation Errors**: Return 400 with detailed Zod error messages
3. **Database Errors**: Return 500 with generic error message
4. **All errors include**: `{ error: string }` in response body

## Security Considerations

1. **Authentication**: All endpoints require admin/groomer role
2. **Validation**: All input validated using Zod schemas before database operations
3. **Sanitization**: URLs validated for proper format
4. **Character Limits**: Enforced on all text fields to prevent abuse
5. **No SQL Injection**: Uses Supabase parameterized queries

## Related Documentation

- [Settings Types](/src/types/settings.ts) - TypeScript type definitions
- [Admin Auth](/src/lib/admin/auth.ts) - Authentication utilities
- [Supabase Server Client](/src/lib/supabase/server.ts) - Database client
