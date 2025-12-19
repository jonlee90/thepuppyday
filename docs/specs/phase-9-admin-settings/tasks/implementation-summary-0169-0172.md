# Implementation Summary: Tasks 0169-0172
## Promotional Banner Management API Routes

**Date:** 2024-12-18
**Status:** ✅ Completed
**Tasks:** 0169, 0170, 0171, 0172

---

## Overview

Implemented comprehensive API routes for promotional banner management in the admin settings panel. The system supports full CRUD operations, banner reordering, image uploads, and automatic status computation based on scheduling dates.

---

## Files Created

### API Routes

1. **`src/app/api/admin/settings/banners/route.ts`** (Task 0169)
   - GET: Fetch all banners with status filtering
   - POST: Create new banner with auto-assigned display_order

2. **`src/app/api/admin/settings/banners/[id]/route.ts`** (Task 0170)
   - GET: Fetch single banner with click analytics
   - PUT: Update banner with partial updates
   - DELETE: Soft-delete (if analytics) or hard-delete

3. **`src/app/api/admin/settings/banners/reorder/route.ts`** (Task 0171)
   - PUT: Reorder banners with atomic transaction-based updates

4. **`src/app/api/admin/settings/banners/upload/route.ts`** (Task 0172)
   - POST: Upload banner image to Supabase Storage

### Type Definitions

5. **`src/types/banner.ts`**
   - Banner types and schemas
   - Status computation logic
   - Validation schemas using Zod

### Tests

6. **`__tests__/api/admin/settings/banners/route.test.ts`**
   - Tests for GET/POST endpoints
   - Status filtering
   - Display order auto-assignment

7. **`__tests__/api/admin/settings/banners/[id]/route.test.ts`**
   - Tests for individual banner operations
   - Analytics calculations
   - Soft/hard delete logic

8. **`__tests__/api/admin/settings/banners/reorder.test.ts`**
   - Reorder validation
   - Duplicate detection
   - Atomic update handling

---

## Key Features Implemented

### 1. Banner Status Computation (Task 0169)

Banners have a computed `status` field based on three properties:

```typescript
export type BannerStatus = 'draft' | 'scheduled' | 'active' | 'expired';

function computeBannerStatus(
  isActive: boolean,
  startDate: string | null,
  endDate: string | null
): BannerStatus {
  // Draft: not active, no dates
  // Scheduled: start_date > now
  // Active: is_active and within dates
  // Expired: end_date < now
}
```

**Status Rules:**
- **Draft:** `is_active=false` and no dates set
- **Scheduled:** `start_date` is in the future
- **Active:** `is_active=true` and within date range (or no dates)
- **Expired:** `end_date` has passed

### 2. Auto-Assigned Display Order (Task 0169)

When creating a new banner, the system automatically assigns the next available `display_order`:

```typescript
// Get max display_order
const { data } = await supabase
  .from('promo_banners')
  .select('display_order')
  .order('display_order', { ascending: false })
  .limit(1)
  .maybeSingle();

const nextDisplayOrder = data ? data.display_order + 1 : 0;
```

### 3. Click Analytics (Task 0170)

Banners track impression and click data with automatic CTR calculation:

```typescript
export function calculateClickThroughRate(
  impressions: number,
  clicks: number
): number {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100; // 2 decimals
}
```

### 4. Smart Delete Logic (Task 0170)

The delete endpoint uses intelligent soft/hard delete logic:

- **Soft-Delete:** If `click_count > 0` OR `impression_count > 0`
  - Sets `is_active = false`
  - Preserves record for analytics reporting

- **Hard-Delete:** If no analytics data exists
  - Permanently removes the record from database

### 5. Atomic Reordering (Task 0171)

Banner reordering supports:
- Duplicate `display_order` validation
- Existence validation for all banner IDs
- Transaction-like updates (all succeed or all fail)
- Audit logging of order changes

### 6. Image Upload (Task 0172)

Banner image upload with validation:

**Validation Rules:**
- File types: JPEG, PNG, WebP, GIF
- Max size: 2MB
- Recommended dimensions: 1200x300px (not enforced)

**Storage:**
- Uploads to Supabase Storage bucket: `banner-images`
- Auto-creates bucket if doesn't exist
- Returns public URL for use in banner

---

## API Endpoints

### GET /api/admin/settings/banners

Fetch all banners with optional status filtering.

**Query Parameters:**
- `status`: `'all' | 'active' | 'scheduled' | 'expired' | 'draft'` (default: `'all'`)

**Response:**
```json
{
  "banners": [
    {
      "id": "uuid",
      "image_url": "https://...",
      "alt_text": "Banner alt text",
      "click_url": "https://...",
      "start_date": "2024-12-20",
      "end_date": "2024-12-31",
      "is_active": true,
      "display_order": 0,
      "click_count": 25,
      "impression_count": 500,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "filter": "active"
}
```

---

### POST /api/admin/settings/banners

Create a new promotional banner.

**Request Body:**
```json
{
  "image_url": "https://storage.example.com/banner.jpg",
  "alt_text": "Summer Sale Banner",
  "click_url": "https://example.com/summer-sale",
  "start_date": "2024-12-20",
  "end_date": "2024-12-31",
  "is_active": true
}
```

**Validation:**
- `image_url`: Valid URL (required)
- `alt_text`: 1-200 characters (required)
- `click_url`: Valid URL or null (optional)
- `start_date`: ISO date format YYYY-MM-DD (optional)
- `end_date`: ISO date format, must be after start_date (optional)
- `is_active`: Boolean (default: false)

**Response (201):**
```json
{
  "banner": {
    "id": "new-uuid",
    "image_url": "https://...",
    "alt_text": "Summer Sale Banner",
    "click_url": "https://...",
    "start_date": "2024-12-20",
    "end_date": "2024-12-31",
    "is_active": true,
    "display_order": 3,
    "click_count": 0,
    "impression_count": 0,
    "status": "scheduled",
    "created_at": "2024-12-18T10:00:00Z",
    "updated_at": "2024-12-18T10:00:00Z"
  },
  "message": "Banner created successfully"
}
```

---

### GET /api/admin/settings/banners/[id]

Fetch a single banner with click analytics.

**Response:**
```json
{
  "banner": {
    "id": "uuid",
    "image_url": "https://...",
    "alt_text": "Banner",
    "click_url": "https://...",
    "start_date": null,
    "end_date": null,
    "is_active": true,
    "display_order": 0,
    "click_count": 25,
    "impression_count": 500,
    "status": "active",
    "click_through_rate": 5.0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /api/admin/settings/banners/[id]

Update a banner with partial updates.

**Request Body (all fields optional):**
```json
{
  "alt_text": "Updated Banner Text",
  "is_active": false,
  "end_date": "2024-12-25"
}
```

**Response:**
```json
{
  "banner": {
    "id": "uuid",
    "image_url": "https://...",
    "alt_text": "Updated Banner Text",
    "click_url": "https://...",
    "start_date": "2024-12-01",
    "end_date": "2024-12-25",
    "is_active": false,
    "display_order": 0,
    "click_count": 25,
    "impression_count": 500,
    "status": "expired",
    "click_through_rate": 5.0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-12-18T10:30:00Z"
  },
  "message": "Banner updated successfully"
}
```

---

### DELETE /api/admin/settings/banners/[id]

Delete a banner (soft or hard delete based on analytics).

**Response:**
```json
{
  "message": "Banner deactivated successfully",
  "deletion_type": "soft",
  "reason": "Banner has analytics data (preserved for reporting)"
}
```

Or for hard-delete:

```json
{
  "message": "Banner deleted successfully",
  "deletion_type": "hard",
  "reason": "No analytics data"
}
```

---

### PUT /api/admin/settings/banners/reorder

Reorder multiple banners atomically.

**Request Body:**
```json
{
  "banners": [
    { "id": "banner-1-uuid", "display_order": 2 },
    { "id": "banner-2-uuid", "display_order": 0 },
    { "id": "banner-3-uuid", "display_order": 1 }
  ]
}
```

**Validation:**
- All banner IDs must exist
- No duplicate `display_order` values
- All updates succeed or none do (atomic)

**Response:**
```json
{
  "message": "Banners reordered successfully",
  "updated_count": 3,
  "banners": [
    { "id": "banner-1-uuid", "display_order": 2 },
    { "id": "banner-2-uuid", "display_order": 0 },
    { "id": "banner-3-uuid", "display_order": 1 }
  ]
}
```

---

### POST /api/admin/settings/banners/upload

Upload a banner image to Supabase Storage.

**Request (multipart/form-data):**
- `file`: Image file (jpeg, png, webp, gif)

**Validation:**
- File type: JPEG, PNG, WebP, GIF
- Max size: 2MB
- Recommended: 1200x300px

**Response:**
```json
{
  "url": "https://supabase-storage.../banner-images/uuid.jpg",
  "width": 1200,
  "height": 300,
  "is_recommended_size": true,
  "recommended_dimensions": {
    "width": 1200,
    "height": 300
  }
}
```

---

## Database Schema

### promo_banners Table

```sql
CREATE TABLE promo_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  click_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_promo_banners_active_dates
ON promo_banners(is_active, start_date, end_date);

CREATE INDEX idx_promo_banners_display_order
ON promo_banners(display_order);
```

---

## Audit Logging

All banner operations are logged to the `settings_audit_log` table:

**Logged Operations:**
- Banner creation (`setting_type: 'banner'`, `setting_key: 'banner.{id}'`)
- Banner updates (`old_value` vs `new_value` comparison)
- Banner deletion (`new_value: null`)
- Display order changes (`setting_key: 'banner.display_order'`)

**Example Audit Entry:**
```json
{
  "admin_id": "admin-uuid",
  "setting_type": "banner",
  "setting_key": "banner.uuid",
  "old_value": {
    "is_active": false,
    "alt_text": "Old Text"
  },
  "new_value": {
    "is_active": true,
    "alt_text": "New Text"
  },
  "created_at": "2024-12-18T10:00:00Z"
}
```

---

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Invalid banner data",
  "details": {
    "image_url": {
      "_errors": ["Invalid URL"]
    },
    "end_date": {
      "_errors": ["Invalid date format"]
    }
  }
}
```

### Not Found Errors (404)

```json
{
  "error": "Banner not found"
}
```

### Server Errors (500)

```json
{
  "error": "Failed to create banner"
}
```

---

## Security

1. **Authentication:** All routes require admin authentication via `requireAdmin()`
2. **Authorization:** Only admin/groomer roles can access these endpoints
3. **Validation:** Comprehensive Zod schema validation on all inputs
4. **URL Validation:** All URLs validated before storage
5. **File Upload:** Type and size validation on image uploads
6. **SQL Injection:** Protected via Supabase parameterized queries
7. **Audit Trail:** All changes logged with admin ID

---

## Testing

### Test Coverage

- ✅ GET endpoint with status filtering
- ✅ POST endpoint with auto-assigned display_order
- ✅ GET single banner with analytics
- ✅ PUT partial updates with validation
- ✅ DELETE soft/hard delete logic
- ✅ Reorder with duplicate detection
- ✅ Reorder with ID validation
- ✅ Reorder atomic updates
- ✅ Error handling for all endpoints
- ✅ Database error scenarios

### Running Tests

```bash
npm run test -- __tests__/api/admin/settings/banners
```

---

## Usage Example

### Creating and Publishing a Banner

```typescript
// 1. Upload image
const formData = new FormData();
formData.append('file', imageFile);

const uploadRes = await fetch('/api/admin/settings/banners/upload', {
  method: 'POST',
  body: formData,
});
const { url } = await uploadRes.json();

// 2. Create banner
const bannerRes = await fetch('/api/admin/settings/banners', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: url,
    alt_text: 'Holiday Sale 2024',
    click_url: 'https://example.com/sale',
    start_date: '2024-12-20',
    end_date: '2024-12-31',
    is_active: true,
  }),
});

const { banner } = await bannerRes.json();
console.log('Banner created with status:', banner.status);
```

### Reordering Banners

```typescript
const banners = [
  { id: 'banner-3', display_order: 0 }, // Move to top
  { id: 'banner-1', display_order: 1 },
  { id: 'banner-2', display_order: 2 }, // Move to bottom
];

await fetch('/api/admin/settings/banners/reorder', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ banners }),
});
```

---

## Next Steps

### Recommended Implementation Order:

1. **Task 0173:** Banner click tracking endpoint (increment click_count)
2. **Task 0174:** Banner impression tracking (increment impression_count)
3. **Task 0175:** Admin UI for banner management
4. **Task 0176:** Public banner display component
5. **Task 0177:** Banner analytics dashboard

---

## Dependencies

- `@supabase/ssr` - Server-side Supabase client
- `zod` - Schema validation
- `sharp` - Image metadata reading
- `next` 14+ - App Router patterns

---

## Notes

- Banner status is computed dynamically, not stored in database
- Display order is 0-indexed
- Soft-deleted banners (is_active=false) are retained for analytics
- Image uploads use service role client to bypass RLS
- All date comparisons use date-only (no time component)

---

**Implementation completed successfully on 2024-12-18**
