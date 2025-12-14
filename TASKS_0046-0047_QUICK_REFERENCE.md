# Tasks 0046-0047 Quick Reference

## API Endpoints

### Send Campaign
```
POST /api/admin/campaigns/[id]/send
```
**Request**: No body required
**Response**:
```json
{
  "success": true,
  "sent_count": 150,
  "skipped_count": 5,
  "total_audience": 155,
  "errors": []
}
```

### Get Campaign Analytics
```
GET /api/admin/campaigns/[id]/analytics
```
**Response**:
```json
{
  "performance": {
    "campaign_id": "uuid",
    "sent_count": 150,
    "delivered_count": 145,
    "opened_count": 80,
    "clicked_count": 45,
    "conversion_count": 12,
    "revenue_generated": 1850.00,
    "open_rate": 55.17,
    "click_rate": 31.03,
    "conversion_rate": 8.00,
    "roi": 350.50,
    "avg_revenue_per_send": 12.33
  },
  "ab_test_comparison": {
    "variant_a": { ... },
    "variant_b": { ... }
  },
  "conversions": [ ... ]
}
```

---

## Component Usage

### CampaignPerformance Component
```tsx
import CampaignPerformance from '@/components/admin/marketing/CampaignPerformance';

<CampaignPerformance campaignId="campaign-uuid" />
```

**Features**:
- KPI cards (sent, delivered, clicked, conversions)
- Revenue & performance metrics
- Conversion funnel visualization
- A/B test comparison table
- Conversion details table
- Loading and error states

---

## Library Functions

### campaign-sender.ts

```typescript
import {
  getAudienceFromSegment,
  checkUnsubscribeStatus,
  assignABVariant,
  createCampaignSends,
  sendCampaignNotifications,
} from '@/lib/admin/campaign-sender';

// Get audience matching segment criteria
const audience = await getAudienceFromSegment(supabase, segmentCriteria);

// Check if customer has unsubscribed
const isUnsubscribed = await checkUnsubscribeStatus(supabase, customerId, 'email');

// Assign A/B variant
const variant = assignABVariant(index, 50); // Returns 'A' or 'B'

// Create tracking records
await createCampaignSends(supabase, campaign, audience, true, 50);

// Send notifications
const result = await sendCampaignNotifications(supabase, campaign, audience, true, 50);
```

### campaign-analytics.ts

```typescript
import {
  getCampaignPerformance,
  getABTestComparison,
  getConversionData,
} from '@/lib/admin/campaign-analytics';

// Get overall performance
const performance = await getCampaignPerformance(supabase, campaignId);

// Get A/B test comparison
const abTest = await getABTestComparison(supabase, campaignId);

// Get conversion details
const conversions = await getConversionData(supabase, campaignId);
```

---

## Segment Criteria

### Available Filters

```typescript
interface SegmentCriteria {
  // Appointment filters
  last_visit_days?: number;           // Last visit within X days
  min_visits?: number;                // Minimum completed appointments
  max_visits?: number;                // Maximum completed appointments
  min_appointments?: number;          // Minimum total appointments
  max_appointments?: number;          // Maximum total appointments

  // Membership & loyalty
  has_membership?: boolean;           // Active membership status
  loyalty_eligible?: boolean;         // Eligible for loyalty rewards

  // Pet attributes
  pet_size?: string[];                // ['small', 'medium', 'large', 'xlarge']
  breed_ids?: string[];               // Specific breed UUIDs

  // Service history
  service_ids?: string[];             // Specific service UUIDs

  // Spending
  min_total_spend?: number;           // Minimum lifetime spend

  // Date filters
  not_visited_since?: string;         // Haven't visited since date (YYYY-MM-DD)
  has_upcoming_appointment?: boolean; // Has future bookings

  // Custom
  tags?: string[];                    // Custom tags (future)
}
```

### Example Segment Queries

**Win-back inactive customers**:
```typescript
{
  not_visited_since: '2024-09-01',
  min_visits: 3,
  has_upcoming_appointment: false
}
```

**Premium service customers**:
```typescript
{
  service_ids: ['premium-groom-service-id'],
  min_visits: 1,
  last_visit_days: 90
}
```

**Large dog owners**:
```typescript
{
  pet_size: ['large', 'xlarge'],
  min_appointments: 1
}
```

**High-value customers**:
```typescript
{
  min_total_spend: 500,
  has_membership: true
}
```

---

## Template Variables

Use in campaign message content:

- `{customer_name}` - Full name (First Last)
- `{first_name}` - First name only
- `{last_name}` - Last name only
- `{email}` - Customer email address
- `{booking_link}` - Link to booking page with customer ID

### Example Messages

**SMS**:
```
Hi {first_name}, we miss you! Book your next groom and get 10% off: {booking_link}
```

**Email Subject**:
```
{customer_name}, Special Offer Just for You!
```

**Email Body**:
```html
<p>Hi {first_name},</p>
<p>As a valued customer, we're offering you an exclusive 10% discount on your next grooming appointment.</p>
<p><a href="{booking_link}">Book Now</a></p>
```

---

## Database Schema Quick Reference

### campaign_sends
```sql
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY,
  campaign_id UUID,              -- Link to marketing_campaigns
  customer_id UUID NOT NULL,     -- Link to users
  variant TEXT,                  -- 'A' or 'B' for A/B tests
  sent_at TIMESTAMPTZ,           -- When sent
  delivered_at TIMESTAMPTZ,      -- When delivered (from notifications_log)
  clicked_at TIMESTAMPTZ,        -- When link clicked
  booking_id UUID,               -- Link to appointments (conversion tracking)
  tracking_id UUID,              -- Unique tracking ID
  attempt_count INTEGER,         -- Number of send attempts
  notification_log_id UUID       -- Link to notifications_log
);

-- Indexes
CREATE INDEX idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_customer ON campaign_sends(customer_id);
CREATE INDEX idx_campaign_sends_tracking ON campaign_sends(tracking_id);
```

### notifications_log enhancements
```sql
ALTER TABLE notifications_log
  ADD COLUMN campaign_id UUID,
  ADD COLUMN campaign_send_id UUID,
  ADD COLUMN tracking_id UUID,
  ADD COLUMN clicked_at TIMESTAMPTZ,
  ADD COLUMN delivered_at TIMESTAMPTZ,
  ADD COLUMN cost_cents INTEGER;
```

### marketing_unsubscribes
```sql
CREATE TABLE marketing_unsubscribes (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  email TEXT,
  phone TEXT,
  unsubscribed_from TEXT NOT NULL, -- 'email', 'sms', or 'both'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Performance Metrics Calculation

### Rates
- **Delivery Rate**: `delivered_count / sent_count * 100`
- **Open Rate**: `opened_count / delivered_count * 100`
- **Click Rate (CTR)**: `clicked_count / delivered_count * 100`
- **Conversion Rate**: `conversion_count / sent_count * 100`
- **ROI**: `(revenue - cost) / cost * 100`

### Counts
- **Sent**: Total campaign_sends records
- **Delivered**: campaign_sends with delivered_at OR notifications_log.status = 'delivered'
- **Opened**: campaign_sends with clicked_at (implies opened for email)
- **Clicked**: campaign_sends with clicked_at
- **Conversions**: campaign_sends with booking_id
- **Bounced**: notifications_log.status = 'bounced'
- **Failed**: notifications_log.status = 'failed'

### Revenue
- **Revenue Generated**: SUM of appointments.total_price for conversions
- **Avg Revenue Per Send**: revenue_generated / sent_count

---

## Campaign Status Workflow

```
draft
  ↓ (user clicks "Send Now" or scheduled_at reached)
sending
  ↓ (all notifications sent)
sent
```

**Status Descriptions**:
- `draft` - Not yet sent, editable
- `scheduled` - Queued for future send (not yet implemented)
- `sending` - Currently being sent
- `sent` - Completed sending
- `cancelled` - Cancelled, cannot be sent

---

## UI Navigation

### Campaign List
- Path: `/admin/marketing/campaigns`
- Actions:
  - Create Campaign (button)
  - Send Now (dropdown for draft/scheduled)
  - View Performance (dropdown for sent)
  - Edit, Duplicate, Delete (dropdown)

### Campaign Detail
- Path: `/admin/marketing/campaigns/[id]`
- Shows:
  - Campaign header (name, status, meta)
  - Performance dashboard (if sent)
  - Unavailable message (if not sent)

### Performance Dashboard
- Embedded in campaign detail page
- Components:
  - KPI Cards (4)
  - Revenue & Metrics (3)
  - Conversion Funnel
  - A/B Test Comparison (if enabled)
  - Conversion Table

---

## Common Scenarios

### Scenario 1: Send a one-time campaign
1. Create campaign with segment and message
2. Save as draft
3. Click "Send Now"
4. View performance after sent

### Scenario 2: Test A/B variants
1. Create campaign with A/B test enabled
2. Define variant A and B messages
3. Set 50/50 split
4. Send campaign
5. View A/B comparison to see winner

### Scenario 3: Target specific customer segment
1. Use segment builder to filter customers
2. Preview audience size
3. Send to filtered audience
4. Track conversions from segment

### Scenario 4: Track campaign ROI
1. Send campaign
2. Wait for conversions (bookings)
3. View performance dashboard
4. Check ROI metric

---

## Error Codes

- `400` - Bad request (invalid campaign, no audience, already sent)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not admin)
- `404` - Campaign not found
- `500` - Server error (failed to send, database error)

---

## Logging

Console logs to watch for:

```
[Campaign Send API] Starting send for campaign: Campaign Name
[Campaign Sender] Found X audience members
[Campaign Sender] Created X campaign_send records
[Campaign Sender] Email sent to customer@example.com: email_id
[Campaign Sender] SMS sent to (555) 123-4567: message_sid
[Campaign Sender] Campaign send complete. Sent: X, Skipped: Y, Errors: Z
[Campaign Analytics] Calculating performance for campaign: campaign_id
[Campaign Analytics] Calculated metrics: {...}
```

---

## Next Steps

After Tasks 0046-0047:
- [ ] Implement scheduled campaign sends (cron job)
- [ ] Add recurring campaign support
- [ ] Create campaign templates
- [ ] Build template editor
- [ ] Add CSV export for analytics
- [ ] Implement click tracking (tracking_id redirect)
- [ ] Add email open tracking (tracking pixel)
- [ ] Build campaign duplication
- [ ] Add campaign editing
- [ ] Implement campaign deletion

---

## Support

For issues or questions:
1. Check console logs for errors
2. Verify database migrations applied
3. Check campaign status workflow
4. Review segment criteria
5. Test in mock mode first
6. Check unsubscribe status
