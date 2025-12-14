# Phase 6 Type Definitions Summary

## Overview
This document summarizes the TypeScript type definitions created for Phase 6 features of The Puppy Day application.

## Files Created

### 1. src/types/report-card.ts
Report card types for groomer assessments and before/after photos.

**Key Types:**
- `HealthObservation` - Union type for health issues
- `ReportCardFormState` - Form handling interface
- `UpdateReportCardInput` - Update operation input
- `PublicReportCard` - Customer-facing report card (excludes admin notes)
- `ReportCardWithDetails` - Full report card with appointment/customer details

**Re-exported from database.ts:**
- `ReportCardMood`: 'happy' | 'nervous' | 'calm' | 'energetic'
- `CoatCondition`: 'excellent' | 'good' | 'matted' | 'needs_attention'
- `BehaviorRating`: 'great' | 'some_difficulty' | 'required_extra_care'
- `ReportCard` - Base report card entity
- `CreateReportCardInput` - Creation input

**Usage Example:**
```typescript
import { ReportCardFormState, HealthObservation } from '@/types/report-card';

const formState: ReportCardFormState = {
  appointment_id: '123',
  mood: 'happy',
  coat_condition: 'excellent',
  behavior: 'great',
  health_observations: ['dental_issues'],
  groomer_notes: 'Great session!',
  before_photo_url: '/uploads/before.jpg',
  after_photo_url: '/uploads/after.jpg',
};
```

---

### 2. src/types/review.ts
Customer review and feedback routing types.

**Key Types:**
- `ReviewRating`: 1 | 2 | 3 | 4 | 5
- `ReviewDestination`: 'google' | 'private'
- `Review` - Review entity with routing info
- `CreateReviewInput` - Input for creating reviews
- `UpdateReviewInput` - Admin response input
- `ReviewWithReportCard` - Review with full context
- `ReviewStats` - Analytics for reviews
- `ReviewSubmissionResponse` - Response with routing

**Usage Example:**
```typescript
import { CreateReviewInput, ReviewDestination } from '@/types/review';

// 5-star review → Google
const review: CreateReviewInput = {
  report_card_id: 'rc-123',
  user_id: 'user-456',
  appointment_id: 'apt-789',
  rating: 5,
  feedback: 'Excellent service!',
};
```

---

### 3. src/types/marketing.ts
Marketing campaign and customer segmentation types.

**Key Types:**
- `CampaignType`: 'one_time' | 'recurring'
- `CampaignStatus`: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
- `CampaignChannel`: 'email' | 'sms' | 'both'
- `SegmentCriteria` - JSONB structure for customer filtering
- `MessageContent` - Email/SMS template content
- `ABTestConfig` - A/B testing configuration
- `MarketingCampaign` - Campaign entity
- `CampaignSend` - Individual send tracking
- `MarketingUnsubscribe` - Unsubscribe records
- `CreateCampaignInput` - Campaign creation
- `CampaignPerformanceMetrics` - Analytics metrics
- `SegmentPreview` - Preview matching customers
- `CampaignTemplate` - Reusable templates

**Usage Example:**
```typescript
import { CreateCampaignInput, SegmentCriteria } from '@/types/marketing';

const campaign: CreateCampaignInput = {
  name: 'Re-engagement Campaign',
  type: 'one_time',
  channel: 'email',
  segment_criteria: {
    not_visited_since: '2024-01-01',
    min_visits: 3,
  },
  message_content: {
    email_subject: 'We miss you!',
    email_body: 'Come back for a special offer...',
  },
};
```

---

### 4. src/types/analytics.ts
Business analytics and reporting types.

**Key Types:**
- `MetricKey` - Cache key string type
- `DateRange` - Date range interface
- `DateRangePreset` - Predefined ranges
- `AnalyticsCache` - Cached metrics entity
- `TrendDirection`: 'up' | 'down' | 'flat'
- `AnalyticsKPI` - Dashboard KPI cards
- `ChartDataPoint` - Time-series data
- `RevenueBreakdown` - Revenue by category
- `CustomerMetrics` - Acquisition/retention metrics
- `OperationalMetrics` - Efficiency metrics
- `ServiceMetrics` - Service performance
- `SizeDistribution` - Pet size distribution
- `TopPerformer` - Top services/addons
- `DashboardAnalytics` - Complete dashboard data
- `CustomerAnalytics` - Individual customer analytics
- `ReportRequest` - Report generation input
- `GeneratedReport` - Report metadata
- `AnalyticsFilters` - Query filters
- `ComparisonPeriod` - Trend comparison
- `RevenueForecast` - Revenue projections

**Usage Example:**
```typescript
import { DashboardAnalytics, AnalyticsKPI } from '@/types/analytics';

const kpi: AnalyticsKPI = {
  label: 'Total Revenue',
  value: '$12,450',
  change_percent: 15.3,
  trend: 'up',
  format: 'currency',
  comparison_period: 'vs last month',
};
```

---

### 5. src/types/waitlist.ts
Enhanced waitlist management with automated slot offering.

**Key Types:**
- `WaitlistSlotOfferStatus`: 'pending' | 'accepted' | 'expired' | 'cancelled'
- `WaitlistPriority`: 'low' | 'normal' | 'high' | 'urgent'
- `WaitlistSlotOffer` - Slot offer entity
- `EnhancedWaitlistEntry` - Enhanced waitlist with priority
- `WaitlistMatch` - Matching algorithm result
- `FillSlotRequest` - Request to fill cancelled slot
- `SlotFillResult` - Result of fill operation
- `CreateWaitlistEntryInput` - Create waitlist entry
- `UpdateWaitlistEntryInput` - Update waitlist entry
- `WaitlistAnalytics` - Waitlist metrics
- `WaitlistEntryWithDetails` - Full waitlist details
- `WaitlistNotificationConfig` - Notification settings

**Re-exported from database.ts:**
- `WaitlistStatus`: 'active' | 'notified' | 'booked' | 'expired' | 'cancelled'
- `TimePreference`: 'morning' | 'afternoon' | 'any'

**Usage Example:**
```typescript
import { WaitlistMatch, FillSlotRequest } from '@/types/waitlist';

const fillRequest: FillSlotRequest = {
  cancelled_appointment_id: 'apt-123',
  slot_start: '2024-12-14T10:00:00Z',
  slot_end: '2024-12-14T11:00:00Z',
  service_id: 'svc-456',
  auto_notify: true,
};
```

---

## Type Organization

### Inheritance Pattern
All entity types extend `BaseEntity`:
```typescript
interface BaseEntity {
  id: string;
  created_at: string;
}
```

### Input/Output Pattern
Following the established pattern:
- `Create{Entity}Input` - Creation operations
- `Update{Entity}Input` - Update operations (optional fields)
- `{Entity}WithDetails` - Entity with joined data
- `{Entity}Analytics` - Analytics/metrics for entity

### Re-export Strategy
Types shared with database.ts are:
1. Imported with alias for internal use
2. Re-exported to avoid duplication
3. Used with alias in interface definitions

Example:
```typescript
// Import with alias for internal use
import type {
  ReportCardMood as ReportCardMoodType,
} from './database';

// Re-export for external consumers
export type { ReportCardMood } from './database';

// Use alias internally
interface MyType {
  mood: ReportCardMoodType;
}
```

---

## Import Path

All types are exported from the central index:
```typescript
import {
  ReportCardFormState,
  ReviewRating,
  MarketingCampaign,
  DashboardAnalytics,
  WaitlistMatch,
} from '@/types';
```

---

## Type Safety Features

1. **Strict Union Types** - No string literals, only defined unions
2. **Comprehensive JSDoc** - All complex types documented
3. **Nullable Fields** - Explicit `| null` for optional database fields
4. **JSONB Typing** - Structured interfaces for JSONB columns
5. **Join Relationships** - Optional joined data clearly marked

---

## Next Steps

These types are ready for use in:
1. Database query builders
2. API route handlers
3. Form validation schemas (Zod)
4. React components and hooks
5. Admin panel interfaces

---

## Related Files

- `src/types/database.ts` - Core database entities
- `src/types/api.ts` - API request/response wrappers
- `src/types/index.ts` - Central export point
