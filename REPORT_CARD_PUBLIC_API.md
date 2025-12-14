# Public Report Card API Implementation

## Overview
Implementation of the public report card API route for shareable report card links. This allows customers to view their grooming report cards via a unique UUID link without requiring authentication.

## API Endpoint

### GET `/api/report-cards/[uuid]`

Retrieves a public report card by its UUID and tracks view statistics.

#### Parameters
- `uuid` (path parameter): The unique UUID identifier of the report card

#### Response Codes
- `200 OK`: Report card found and returned successfully
- `404 Not Found`: Report card UUID doesn't exist or is still a draft
- `410 Gone`: Report card has expired (past the expires_at timestamp)
- `500 Internal Server Error`: Server error occurred

#### Success Response (200)

```json
{
  "id": "uuid",
  "appointment_date": "2024-12-13T10:00:00Z",
  "pet_name": "Max",
  "service_name": "Premium Grooming",
  "mood": "happy",
  "coat_condition": "excellent",
  "behavior": "great",
  "health_observations": ["ear_infection", "overgrown_nails"],
  "groomer_notes": "Max was such a good boy today! His coat is looking much healthier.",
  "before_photo_url": "https://...",
  "after_photo_url": "https://...",
  "created_at": "2024-12-13T11:00:00Z"
}
```

#### Error Response Examples

**404 Not Found**
```json
{
  "error": "Report card not found"
}
```

**410 Gone**
```json
{
  "error": "Report card has expired",
  "expired_at": "2024-03-15T00:00:00Z"
}
```

## Features

### 1. View Tracking
- Automatically increments `view_count` on each GET request
- Updates `last_viewed_at` timestamp
- Uses Supabase RPC function `increment_report_card_views()`
- Non-blocking (async operation doesn't delay response)

### 2. Expiration Handling
- Checks `expires_at` field
- Returns 410 Gone if current time > expires_at
- Default expiration is 90 days from sent_at (set when sending notification)

### 3. Draft Filtering
- Only returns report cards where `is_draft = false`
- Prevents access to incomplete/unsent report cards

### 4. Privacy & Security
- No authentication required (public shareable link)
- Only returns sanitized public data (no customer email/phone/admin notes)
- UUIDs prevent enumeration attacks
- No caching headers to ensure fresh data

### 5. Joined Data
Efficiently fetches related data in a single query:
- Appointment details (scheduled_at)
- Pet information (name)
- Service information (name)

## Implementation Files

### Created/Modified Files

1. **`src/app/api/report-cards/[uuid]/route.ts`** (NEW)
   - Main API route handler
   - Implements GET endpoint with view tracking
   - Handles expiration logic
   - Returns sanitized PublicReportCard data

2. **`src/types/database.ts`** (MODIFIED)
   - Updated `ReportCard` interface to include Phase 6 enhancement fields:
     - `groomer_id`
     - `view_count`
     - `last_viewed_at`
     - `sent_at`
     - `expires_at`
     - `dont_send`
     - `is_draft`
     - `updated_at`

## Database Support

### Table Structure
The `report_cards` table includes all necessary fields from Phase 6 enhancements:

```sql
ALTER TABLE public.report_cards
  ADD COLUMN groomer_id UUID REFERENCES public.users(id),
  ADD COLUMN view_count INTEGER DEFAULT 0,
  ADD COLUMN last_viewed_at TIMESTAMPTZ,
  ADD COLUMN sent_at TIMESTAMPTZ,
  ADD COLUMN expires_at TIMESTAMPTZ,
  ADD COLUMN dont_send BOOLEAN DEFAULT false,
  ADD COLUMN is_draft BOOLEAN DEFAULT true,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

### Database Functions

**`increment_report_card_views(report_card_uuid UUID)`**
- Increments view_count by 1
- Updates last_viewed_at to NOW()
- Security: SECURITY DEFINER for consistent execution

**`is_report_card_expired(report_card_uuid UUID)`**
- Returns boolean indicating if report card is expired
- Checks expires_at against current timestamp
- Returns false if expires_at is NULL (never expires)

## Usage Example

### Client-Side Fetch

```typescript
async function fetchReportCard(uuid: string) {
  const response = await fetch(`/api/report-cards/${uuid}`);

  if (response.status === 404) {
    console.error('Report card not found');
    return null;
  }

  if (response.status === 410) {
    const data = await response.json();
    console.error('Report card expired at:', data.expired_at);
    return null;
  }

  if (!response.ok) {
    console.error('Failed to fetch report card');
    return null;
  }

  const reportCard: PublicReportCard = await response.json();
  return reportCard;
}
```

### URL Format
```
https://puppyday.com/report-cards/[uuid]
```

The frontend page at `/report-cards/[uuid]` will call this API endpoint to fetch the data.

## Next Steps

1. **Frontend Page Implementation** (Task 0012)
   - Create `/src/app/(public)/report-cards/[uuid]/page.tsx`
   - Display report card with before/after photos
   - Show mood, coat condition, behavior ratings
   - Display health observations and groomer notes
   - Handle loading, error, and expired states

2. **Email Integration** (Phase 8)
   - Send report card notification emails with UUID link
   - Set expires_at to 90 days from sent_at
   - Track when emails are sent (sent_at field)

3. **Admin Features** (Phase 6)
   - Mark report cards as "don't send" (dont_send flag)
   - View analytics (view_count, last_viewed_at)
   - Manually expire or extend expiration dates

## Testing Checklist

- [ ] Verify 200 response with valid UUID
- [ ] Verify 404 response with invalid UUID
- [ ] Verify 404 response for draft report cards
- [ ] Verify 410 response for expired report cards
- [ ] Verify view_count increments on each request
- [ ] Verify last_viewed_at updates on each request
- [ ] Verify no sensitive customer data is returned
- [ ] Verify joined data (pet, service) is properly included
- [ ] Test with missing before_photo_url (nullable field)
- [ ] Test with empty health_observations array

## Security Considerations

1. **No Authentication Required**: Public endpoint by design for shareable links
2. **UUID-based Access**: Prevents enumeration (UUIDs are random, not sequential)
3. **Draft Filtering**: Only published report cards are accessible
4. **Data Sanitization**: No customer PII (email, phone) in response
5. **No Caching**: Fresh data on every request (prevents stale data)
6. **Expiration**: Links automatically expire after 90 days
7. **View Tracking**: Monitor unusual access patterns (many views could indicate link sharing)

## Performance Considerations

1. **Single Query**: All data fetched in one Supabase query with joins
2. **Async View Tracking**: View count increment doesn't block response
3. **No Caching**: Trade-off for data freshness (could add short-lived cache if needed)
4. **Database Indexes**: Indexes on id, is_draft, expires_at for fast lookups

## Related Documentation

- Phase 6 Specification: `docs/specs/phase-6/requirements.md`
- Database Schema: `supabase/migrations/20241213_phase6_report_cards_enhancements.sql`
- Report Card Types: `src/types/report-card.ts`
- Database Types: `src/types/database.ts`
