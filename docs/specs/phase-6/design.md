# Phase 6: Admin Panel Advanced Features - Design Document

**Version**: 1.0
**Status**: Draft
**Last Updated**: 2025-12-13
**Author**: Feature Design Architect

---

## Executive Summary

### Overview

Phase 6 introduces advanced administrative features that transform The Puppy Day from a booking platform into a comprehensive customer engagement and retention system. This phase focuses on five core pillars:

1. **Report Card System** - Digital grooming reports with photos, assessments, and integrated review collection
2. **Waitlist Management** - Automated slot-filling with SMS notifications and response handling
3. **Retention Marketing** - Breed-based reminders and custom campaign builder
4. **Analytics Dashboard** - Real-time KPIs, charts, and performance tracking
5. **Notification Center** - Centralized SMS/Email management and tracking

### Business Value

- **Review Generation**: Industry research shows grooming reports increase review submission rates by 40-60%
- **Waitlist Recovery**: Automated waitlist systems recover 20-30% of lost bookings
- **Retention Impact**: Breed-based reminders increase retention by 40%+ (60-70% typical industry retention to 80-90%+)
- **Customer Delight**: Before/after photos and personalized reports create sharable moments
- **Operational Efficiency**: Automated notifications reduce manual follow-up by 75%

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Public report card URLs** | No auth required for sharing on social media, expires after 90 days |
| **UUID-based report IDs** | Security through obscurity, prevents enumeration attacks |
| **Cached analytics** | 15-minute cache refresh for performance, real-time updates optional |
| **Queue-based notifications** | Background job processing for bulk SMS/Email campaigns |
| **Recharts library** | React-native charting library, tree-shakeable, TypeScript support |
| **jsPDF for exports** | Client-side PDF generation, no server processing required |

### Implementation Timeline

- **Week 1**: Report card system (highest value feature)
- **Week 2**: Waitlist management and SMS integration
- **Week 3**: Retention marketing and campaign builder
- **Week 4**: Analytics dashboard and notification center

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Public Pages │  │ Customer     │  │ Admin Panel  │          │
│  │ /report-cards│  │ Portal       │  │ /admin/*     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Routes                                               │  │
│  │  /api/admin/report-cards     /api/admin/waitlist        │  │
│  │  /api/admin/campaigns        /api/admin/analytics       │  │
│  │  /api/admin/notifications    /api/webhooks/sms-reply    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Notification │  │ Report Card  │  │ Analytics    │          │
│  │ Service      │  │ Service      │  │ Service      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Supabase      │  │   External      │  │   Background    │
│   PostgreSQL    │  │   Services      │  │   Jobs          │
│                 │  │                 │  │                 │
│ - report_cards  │  │ - Twilio (SMS)  │  │ - Reminder      │
│ - reviews       │  │ - Resend (Email)│  │   Scheduler     │
│ - waitlist      │  │ - Google (Maps) │  │ - Campaign      │
│ - campaigns     │  │                 │  │   Processor     │
│ - analytics     │  │                 │  │ - Analytics     │
│   cache         │  │                 │  │   Aggregator    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Data Flow Diagrams

#### Report Card Flow

```
Groomer Creates Report Card
         │
         ▼
┌────────────────────────┐
│ Save to report_cards   │
│ Upload photos to       │
│ Supabase Storage       │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Appointment status     │
│ → "completed"          │
└────────────────────────┘
         │
         ▼ (15 min delay, configurable)
┌────────────────────────┐
│ Send SMS + Email       │
│ with report card link  │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Customer views report  │
│ /report-cards/[uuid]   │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Review prompt shows    │
│ 5-star rating          │
└────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
  4-5★      1-3★
    │         │
    ▼         ▼
 Google   Private
 Review   Feedback
```

#### Waitlist Slot-Filling Flow

```
Admin identifies open slot
         │
         ▼
┌────────────────────────┐
│ Query waitlist entries │
│ matching:              │
│ - service_id           │
│ - requested_date ±3    │
│ - status = 'active'    │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Send SMS to top 5      │
│ "Reply YES to book"    │
│ Create slot_offer      │
│ (expires in 2 hours)   │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Wait for SMS reply     │
│ via Twilio webhook     │
└────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
  "YES"     Timeout
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Auto-   │ │ Mark    │
│ book    │ │ expired │
│ with    │ │ Notify  │
│ 10% off │ │ others  │
└─────────┘ └─────────┘
```

#### Retention Reminder Flow

```
Cron job runs daily (9am)
         │
         ▼
┌────────────────────────┐
│ Query pets where:      │
│ - last_appointment +   │
│   breed.frequency =    │
│   today + 7 days       │
│ - no upcoming appt     │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Create campaign_sends  │
│ records with tracking  │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Queue notifications    │
│ SMS + Email            │
│ with booking link      │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Track engagement:      │
│ - Link clicked         │
│ - Booking created      │
│ - Days to conversion   │
└────────────────────────┘
```

### External Service Integration

#### Twilio SMS Integration

**Purpose**: Transactional SMS (waitlist offers, reminders, confirmations)

```typescript
// lib/twilio/client.ts
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  statusCallbackUrl: string; // Webhook for delivery status
}

interface SendSMSParams {
  to: string;
  body: string;
  trackingId?: string; // Links to notification_log.id
}
```

**Webhooks**:
- `/api/webhooks/twilio/status` - Delivery status updates
- `/api/webhooks/twilio/incoming` - Inbound SMS replies (waitlist "YES")

#### Resend Email Integration

**Purpose**: Transactional emails (report cards, reminders, campaigns)

```typescript
// lib/resend/client.ts
interface EmailTemplate {
  reportCard: {
    subject: string;
    previewText: string;
    ctaText: string;
    ctaUrl: string;
  };
  reminder: {
    subject: string;
    petName: string;
    breedMessage: string;
    bookingUrl: string;
  };
  campaign: {
    subject: string;
    content: string;
    unsubscribeUrl: string;
  };
}
```

**Tracking**:
- Open tracking via pixel
- Click tracking via URL rewrites
- Unsubscribe handling

---

## Components and Interfaces

### Report Card System Components

#### 1. Admin: Report Card Form (`/admin/appointments/[id]/report-card`)

**Purpose**: Tablet-optimized form for groomers to create report cards

**Component Hierarchy**:
```
ReportCardForm
├── PhotoUploadSection
│   ├── BeforePhotoUpload (optional)
│   └── AfterPhotoUpload (required)
├── AssessmentSection
│   ├── MoodSelector (happy/nervous/calm/energetic)
│   ├── CoatConditionSelector
│   └── BehaviorSelector
├── HealthObservationsSection
│   └── CheckboxGroup (6 health flags)
├── GroomerNotesSection
│   └── RichTextArea
├── DraftIndicator
└── SubmitActions
    ├── SaveDraftButton
    ├── SubmitButton
    └── DontSendToggle
```

**Key Features**:
- **Auto-save**: Debounced save to `report_cards` table every 5 seconds
- **Offline support**: LocalStorage cache, sync when online
- **Touch targets**: Minimum 44x44px tap areas
- **Photo optimization**: Compress to 1200px max width before upload
- **Validation**: After photo required, at least one assessment field

**State Management**:
```typescript
interface ReportCardFormState {
  appointmentId: string;
  mood: 'happy' | 'nervous' | 'calm' | 'energetic' | null;
  coatCondition: 'excellent' | 'good' | 'matted' | 'needs_attention' | null;
  behavior: 'great' | 'some_difficulty' | 'required_extra_care' | null;
  healthObservations: string[]; // Array of flags
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  groomerNotes: string;
  dontSend: boolean;
  isDraft: boolean;
  lastSaved: Date | null;
  isOffline: boolean;
}
```

**API Route**: `POST /api/admin/report-cards`

#### 2. Public: Report Card Page (`/report-cards/[uuid]`)

**Purpose**: Public, shareable report card view

**Component Hierarchy**:
```
PublicReportCard
├── HeroSection
│   ├── AfterPhotoHero
│   └── PetNameBadge
├── AppointmentSummary
│   ├── ServiceDate
│   └── ServiceType
├── AssessmentGrid
│   ├── MoodCard (with icon)
│   ├── CoatCard (with icon)
│   └── BehaviorCard (with icon)
├── HealthObservationsSection (conditional)
│   └── RecommendationsList
├── GroomerNotesSection (conditional)
├── BeforeAfterComparison (conditional)
│   └── ImageSlider
├── GroomerSignature
├── ShareButtons
│   ├── FacebookShare
│   ├── InstagramShare
│   └── DownloadPDFButton
└── ReviewPrompt (conditional: not yet reviewed)
    ├── StarRatingSelector
    └── SubmitReviewButton
```

**Key Features**:
- **No authentication**: Public URLs with UUID
- **Expiration**: 90 days after creation (configurable in settings)
- **View tracking**: Increment `view_count`, log `viewed_at` timestamp
- **SEO optimized**: Meta tags with pet name, service
- **Mobile-first**: Responsive design, swipeable image comparison

**Data Model**:
```typescript
interface PublicReportCard {
  id: string;
  petName: string;
  serviceName: string;
  serviceDate: string;
  mood: string;
  coatCondition: string;
  behavior: string;
  healthObservations: string[];
  groomerNotes?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl: string;
  groomerName: string;
  viewCount: number;
  hasReview: boolean;
  expiresAt: Date;
}
```

**API Route**: `GET /api/report-cards/[uuid]`

#### 3. Review Integration

**Review Prompt Component**:
```typescript
interface ReviewPromptProps {
  reportCardId: string;
  appointmentId: string;
  customerId: string;
  onSubmit: (rating: number) => void;
}
```

**Review Routing Logic**:
```typescript
async function handleReviewSubmit(rating: number) {
  // Save review to database
  await createReview({
    reportCardId,
    customerId,
    appointmentId,
    rating,
    submittedAt: new Date()
  });

  if (rating >= 4) {
    // High rating: Redirect to Google Business
    window.open(settings.googleBusinessReviewUrl, '_blank');
    showMessage("Thank you! Share your experience on Google!");
  } else {
    // Low rating: Show private feedback form
    showFeedbackForm();
  }
}
```

**Private Feedback Form**:
```
PrivateFeedbackForm
├── FeedbackTextarea
├── ContactPreferenceToggle
└── SubmitButton
```

---

### Waitlist Management Components

#### 1. Waitlist Dashboard (`/admin/waitlist`)

**Component Hierarchy**:
```
WaitlistDashboard
├── WaitlistFilters
│   ├── DateRangeFilter
│   ├── ServiceFilter
│   ├── StatusFilter
│   └── SearchInput
├── WaitlistStats
│   ├── ActiveCount
│   ├── FilledToday
│   └── ResponseRate
├── WaitlistTable
│   ├── WaitlistRow
│   │   ├── CustomerInfo
│   │   ├── PetInfo
│   │   ├── ServiceBadge
│   │   ├── RequestedDate
│   │   ├── TimePreference
│   │   ├── StatusBadge
│   │   └── ActionMenu
│   └── Pagination
└── BulkActionsBar
```

**Filters State**:
```typescript
interface WaitlistFilters {
  dateRange: { start: Date; end: Date } | null;
  serviceIds: string[];
  statuses: ('active' | 'notified' | 'booked' | 'expired' | 'cancelled')[];
  searchQuery: string; // Customer name, pet name, phone
  sortBy: 'requested_date' | 'created_at' | 'priority';
  sortOrder: 'asc' | 'desc';
}
```

**API Route**: `GET /api/admin/waitlist?filters=...`

#### 2. Fill Slot Modal

**Triggered from**: Appointment calendar empty slot click

**Component Hierarchy**:
```
FillSlotModal
├── SlotSummary
│   ├── DateTime
│   └── Service
├── MatchingWaitlistList
│   ├── WaitlistMatchCard
│   │   ├── CustomerDetails
│   │   ├── PetDetails
│   │   ├── RequestedDate (with diff indicator)
│   │   ├── PriorityBadge
│   │   └── NotifyButton
│   └── EmptyState
├── NotificationPreview
│   ├── SMSTemplate
│   └── DiscountInput
└── SendToSelectedButton
```

**Matching Algorithm**:
```typescript
interface SlotMatchCriteria {
  serviceId: string;
  requestedDate: Date;
  slotDate: Date;
  maxDateDiff: number; // ±3 days default
}

async function findMatchingWaitlist(criteria: SlotMatchCriteria) {
  const matches = await supabase
    .from('waitlist')
    .select('*, customer:customer_id(*), pet:pet_id(*)')
    .eq('service_id', criteria.serviceId)
    .eq('status', 'active')
    .gte('requested_date', addDays(criteria.slotDate, -criteria.maxDateDiff))
    .lte('requested_date', addDays(criteria.slotDate, criteria.maxDateDiff))
    .order('created_at', { ascending: true });

  return matches.data || [];
}
```

#### 3. Waitlist Response Handler

**Webhook**: `/api/webhooks/twilio/incoming`

**Flow**:
```typescript
async function handleIncomingSMS(req: Request) {
  const { From, Body, MessageSid } = await req.json();

  // Find active slot offer for this phone number
  const offer = await findActiveSlotOffer(From);

  if (!offer) {
    return new Response('No active offer found');
  }

  if (Body.toLowerCase().trim() === 'yes') {
    // First responder wins
    const booked = await bookSlotFromWaitlist({
      waitlistId: offer.waitlistId,
      slotTime: offer.slotTime,
      discountPercent: offer.discountPercent
    });

    if (booked) {
      // Mark offer as claimed
      await markSlotOfferClaimed(offer.id);

      // Send confirmation
      await sendSMS({
        to: From,
        body: `Booked! You're confirmed for ${formatDate(offer.slotTime)} with 10% off. See you soon!`
      });

      // Notify other waitlist customers
      await notifySlotFilled(offer.id);
    } else {
      await sendSMS({
        to: From,
        body: `Sorry, this slot was just filled. You're still on the waitlist!`
      });
    }
  }

  return new Response('OK');
}
```

---

### Retention Marketing Components

#### 1. Campaign Builder (`/admin/marketing/campaigns`)

**Component Hierarchy**:
```
CampaignBuilder
├── CampaignList
│   ├── ActiveCampaigns
│   ├── ScheduledCampaigns
│   └── DraftCampaigns
└── CreateCampaignModal
    ├── CampaignTypeSelector
    │   ├── OneTimeOption
    │   └── RecurringOption
    ├── SegmentBuilder
    │   ├── LastVisitFilter
    │   ├── ServiceTypeFilter
    │   ├── BreedFilter
    │   └── MembershipFilter
    ├── MessageComposer
    │   ├── TemplateSelector
    │   ├── SMSEditor (160 char limit)
    │   ├── EmailEditor (rich text)
    │   └── VariableInserter ({customer_name}, {pet_name})
    ├── ScheduleSection
    │   ├── SendDatePicker
    │   └── SendTimePicker
    ├── ABTestToggle (optional)
    │   ├── VariantA
    │   └── VariantB
    └── PreviewAndSend
        ├── AudienceSizeEstimate
        ├── CostEstimate (SMS cost)
        └── SendButton
```

**Data Model**:
```typescript
interface Campaign {
  id: string;
  name: string;
  type: 'one_time' | 'recurring';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  segment: SegmentCriteria;
  message: {
    sms: string;
    email: {
      subject: string;
      body: string;
    };
  };
  scheduledFor: Date;
  createdBy: string;
  stats: {
    sent: number;
    delivered: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
}

interface SegmentCriteria {
  lastVisitDaysAgo?: { min: number; max: number };
  serviceIds?: string[];
  breedIds?: string[];
  hasMembership?: boolean;
  loyaltyTier?: 'bronze' | 'silver' | 'gold';
}
```

**API Routes**:
- `POST /api/admin/campaigns` - Create campaign
- `GET /api/admin/campaigns` - List campaigns
- `POST /api/admin/campaigns/[id]/send` - Send now
- `POST /api/admin/campaigns/[id]/pause` - Pause sending

#### 2. Breed-Based Reminder System

**Background Job**: Runs daily at 9:00 AM

**Logic**:
```typescript
async function scheduleBreedReminders() {
  // Find pets due for grooming in 7 days
  const dueForGrooming = await supabase
    .from('appointments')
    .select(`
      id,
      pet:pet_id (
        id,
        name,
        owner:owner_id (
          id,
          first_name,
          phone,
          email
        ),
        breed:breed_id (
          name,
          grooming_frequency_weeks,
          reminder_message
        )
      ),
      scheduled_at
    `)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false });

  const petsNeedingReminder = dueForGrooming
    .filter(apt => {
      const daysSinceLastGrooming = differenceInDays(
        new Date(),
        apt.scheduled_at
      );
      const reminderThreshold = (apt.pet.breed.grooming_frequency_weeks * 7) - 7;

      return daysSinceLastGrooming >= reminderThreshold;
    })
    // Remove pets with upcoming appointments
    .filter(async (apt) => {
      const upcoming = await hasUpcomingAppointment(apt.pet.id);
      return !upcoming;
    });

  // Create campaign sends
  for (const apt of petsNeedingReminder) {
    await createCampaignSend({
      type: 'breed_reminder',
      customerId: apt.pet.owner.id,
      petId: apt.pet.id,
      message: {
        sms: `Hi ${apt.pet.owner.first_name}, ${apt.pet.name} is due for a groom! ${apt.pet.breed.reminder_message} Book now: ${bookingUrl}`,
        email: {
          subject: `Time for ${apt.pet.name}'s grooming!`,
          body: renderEmailTemplate('breed_reminder', apt)
        }
      },
      scheduledFor: new Date(),
      trackingId: generateTrackingId()
    });
  }
}
```

**Tracking Table**:
```sql
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  customer_id UUID REFERENCES users(id),
  pet_id UUID REFERENCES pets(id),
  type TEXT NOT NULL, -- 'campaign', 'breed_reminder', 'winback'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sms_id TEXT, -- Twilio message SID
  email_id TEXT, -- Resend email ID
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ, -- Booking created
  conversion_appointment_id UUID REFERENCES appointments(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Analytics Dashboard Components

#### 1. Analytics Overview (`/admin/analytics`)

**Component Hierarchy**:
```
AnalyticsDashboard
├── DateRangeSelector
│   ├── PresetRanges (Today, Week, Month, Quarter, Year)
│   └── CustomDatePicker
├── ExportMenu
│   ├── ExportCSVButton
│   └── ExportPDFButton
├── KPIGrid
│   ├── KPICard (Total Revenue)
│   ├── KPICard (Total Appointments)
│   ├── KPICard (Avg Booking Value)
│   ├── KPICard (Retention Rate)
│   ├── KPICard (Review Rate)
│   └── KPICard (Waitlist Fill Rate)
├── ChartsSection
│   ├── AppointmentTrendChart (Line)
│   ├── RevenueChart (Bar)
│   ├── ServicePopularityChart (Pie)
│   ├── CustomerTypeChart (Pie)
│   └── OperationalMetricsChart (Multi-line)
└── TablesSection
    ├── ServicePerformanceTable
    ├── GroomerPerformanceTable
    └── TopCustomersTable
```

**KPI Card Component**:
```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  change: number; // Percentage change vs previous period
  changeLabel: string;
  format: 'currency' | 'number' | 'percentage';
  isLoading: boolean;
  onClick?: () => void; // Drill-down
}

function KPICard({ title, value, change, format, onClick }: KPICardProps) {
  const isPositive = change >= 0;
  const formattedValue = formatKPI(value, format);

  return (
    <div className="card bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="card-body">
        <h3 className="text-sm text-gray-600">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          <span className="ml-1">{Math.abs(change)}% vs prev period</span>
        </div>
      </div>
    </div>
  );
}
```

#### 2. Chart Components

**Using Recharts Library**:
```typescript
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AppointmentTrendChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="appointments"
          stroke="#434E54"
          strokeWidth={2}
          dot={{ fill: '#434E54' }}
        />
        <Line
          type="monotone"
          dataKey="previousPeriod"
          stroke="#EAE0D5"
          strokeWidth={1}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TrendData {
  date: string;
  appointments: number;
  previousPeriod: number;
}
```

**Revenue Breakdown Chart**:
```typescript
function RevenueBreakdownChart({ data }: { data: RevenueData[] }) {
  const COLORS = ['#434E54', '#6B7280', '#EAE0D5'];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface RevenueData {
  name: string;
  value: number;
}
```

#### 3. Groomer Performance Dashboard

**Component**:
```
GroomerPerformanceDashboard
├── GroomerSelector (dropdown or tabs)
├── PerformanceKPIs
│   ├── AppointmentsCompleted
│   ├── AverageRating
│   ├── RevenueGenerated
│   └── AddonAttachmentRate
├── PerformanceCharts
│   ├── CompletionTimeChart
│   └── RatingTrendChart
└── ComparisonTable
    └── GroomerComparisonRow
```

**Data Model**:
```typescript
interface GroomerPerformance {
  groomerId: string;
  groomerName: string;
  period: { start: Date; end: Date };
  metrics: {
    appointmentsCompleted: number;
    averageRating: number;
    totalRevenue: number;
    avgAppointmentValue: number;
    addonAttachmentRate: number; // % of appointments with add-ons
    avgCompletionTime: number; // Minutes
    onTimeCompletionRate: number; // % completed within scheduled duration
    customerReturnRate: number; // % of customers who rebook
  };
}
```

**API Route**: `GET /api/admin/analytics/groomers?groomerId=...&dateRange=...`

---

### Notification Center Components

#### Notification History (`/admin/notifications`)

**Component Hierarchy**:
```
NotificationCenter
├── NotificationFilters
│   ├── TypeFilter (SMS, Email, Both)
│   ├── StatusFilter (Sent, Failed, Pending)
│   ├── DateRangeFilter
│   └── CustomerSearch
├── NotificationStats
│   ├── TotalSent
│   ├── DeliveryRate
│   ├── ClickRate
│   └── CostToDate
├── NotificationTable
│   ├── NotificationRow
│   │   ├── TypeIcon
│   │   ├── Recipient
│   │   ├── Subject/Preview
│   │   ├── StatusBadge
│   │   ├── Timestamp
│   │   └── ActionMenu (Resend, View)
│   └── Pagination
└── BulkActions
    └── ResendFailedButton
```

**Notification Detail Modal**:
```
NotificationDetailModal
├── Header (Type, Status, Timestamp)
├── RecipientInfo
├── MessageContent
│   ├── SMSBody
│   └── EmailBody (rendered HTML)
├── DeliveryInfo
│   ├── SentAt
│   ├── DeliveredAt
│   └── ClickedAt
├── ErrorDetails (if failed)
└── Actions
    ├── ResendButton
    └── ViewCustomerButton
```

**Data Query**:
```typescript
async function getNotificationHistory(filters: NotificationFilters) {
  const query = supabase
    .from('notifications_log')
    .select(`
      id,
      type,
      channel,
      recipient,
      subject,
      content,
      status,
      error_message,
      sent_at,
      created_at,
      customer:customer_id (
        first_name,
        last_name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.channels.length > 0) {
    query.in('channel', filters.channels);
  }

  if (filters.statuses.length > 0) {
    query.in('status', filters.statuses);
  }

  if (filters.dateRange) {
    query.gte('created_at', filters.dateRange.start);
    query.lte('created_at', filters.dateRange.end);
  }

  return query;
}
```

---

## Data Models

### New Tables

#### 1. Reviews Table

```sql
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_card_id UUID UNIQUE NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  is_public BOOLEAN DEFAULT false, -- True if 4-5 stars and shared on Google
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_customer ON public.reviews(customer_id);
CREATE INDEX idx_reviews_public ON public.reviews(is_public);
```

**Purpose**: Track customer reviews submitted via report cards

**RLS Policies**:
```sql
-- Customers can view own reviews
DROP POLICY IF EXISTS "Customers can view own reviews" ON public.reviews;
CREATE POLICY "Customers can view own reviews" ON public.reviews
  FOR SELECT
  USING (customer_id = auth.uid());

-- Customers can create reviews
DROP POLICY IF EXISTS "Customers can create reviews" ON public.reviews;
CREATE POLICY "Customers can create reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Admins can view all reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'groomer')
    )
  );
```

#### 2. Marketing Campaigns Table

```sql
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring', 'breed_reminder', 'winback')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  segment_criteria JSONB NOT NULL, -- SegmentCriteria interface
  message JSONB NOT NULL, -- { sms: string, email: { subject, body } }
  scheduled_for TIMESTAMPTZ,
  recurring_config JSONB, -- { frequency: 'daily' | 'weekly' | 'monthly', dayOfWeek, dayOfMonth }
  ab_test_config JSONB, -- { enabled: boolean, variantA, variantB, splitPercent }
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON public.marketing_campaigns(scheduled_for);
```

#### 3. Campaign Sends Table

```sql
CREATE TABLE IF NOT EXISTS public.campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  pet_id UUID REFERENCES public.pets(id),
  type TEXT NOT NULL CHECK (type IN ('campaign', 'breed_reminder', 'winback', 'waitlist_offer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'clicked', 'converted')),
  sms_id TEXT, -- Twilio message SID
  email_id TEXT, -- Resend email ID
  tracking_id TEXT UNIQUE, -- For click tracking
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_appointment_id UUID REFERENCES public.appointments(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_sends_campaign ON public.campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_customer ON public.campaign_sends(customer_id);
CREATE INDEX idx_campaign_sends_status ON public.campaign_sends(status);
CREATE INDEX idx_campaign_sends_tracking ON public.campaign_sends(tracking_id);
```

#### 4. Analytics Cache Table

```sql
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_key TEXT NOT NULL, -- 'kpi_revenue_monthly', 'chart_appointments_daily', etc.
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(metric_key, date_range_start, date_range_end)
);

CREATE INDEX idx_analytics_cache_key ON public.analytics_cache(metric_key);
CREATE INDEX idx_analytics_cache_expires ON public.analytics_cache(expires_at);
```

**Purpose**: Cache expensive analytics queries, refresh every 15 minutes

**Cleanup Job**:
```sql
-- Delete expired cache entries
DELETE FROM public.analytics_cache WHERE expires_at < NOW();
```

#### 5. Waitlist Slot Offers Table

```sql
CREATE TABLE IF NOT EXISTS public.waitlist_slot_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waitlist_ids UUID[] NOT NULL, -- Array of waitlist entries notified
  appointment_slot TIMESTAMPTZ NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id),
  discount_percent INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  claimed_by_waitlist_id UUID REFERENCES public.waitlist(id),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slot_offers_status ON public.waitlist_slot_offers(status);
CREATE INDEX idx_slot_offers_expires ON public.waitlist_slot_offers(expires_at);
```

### Modifications to Existing Tables

#### Report Cards Table Enhancements

```sql
-- Add new fields to existing report_cards table
ALTER TABLE public.report_cards
ADD COLUMN IF NOT EXISTS groomer_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dont_send BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS report_cards_updated_at ON public.report_cards;
CREATE TRIGGER report_cards_updated_at BEFORE UPDATE ON public.report_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### Waitlist Table Enhancements

```sql
-- Add priority and notes to waitlist
ALTER TABLE public.waitlist
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0, -- Higher = more important
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX idx_waitlist_priority ON public.waitlist(priority);
```

#### Notifications Log Enhancements

```sql
-- Add tracking fields
ALTER TABLE public.notifications_log
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.marketing_campaigns(id),
ADD COLUMN IF NOT EXISTS campaign_send_id UUID REFERENCES public.campaign_sends(id),
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cost_cents INTEGER; -- Track SMS/Email costs

CREATE INDEX idx_notifications_campaign ON public.notifications_log(campaign_id);
CREATE INDEX idx_notifications_tracking ON public.notifications_log(tracking_id);
```

---

## API Routes Architecture

### Report Card Routes

#### `POST /api/admin/report-cards`

**Purpose**: Create or update report card

**Request Body**:
```typescript
interface CreateReportCardRequest {
  appointmentId: string;
  mood?: 'happy' | 'nervous' | 'calm' | 'energetic';
  coatCondition?: 'excellent' | 'good' | 'matted' | 'needs_attention';
  behavior?: 'great' | 'some_difficulty' | 'required_extra_care';
  healthObservations?: string[];
  beforePhotoUrl?: string;
  afterPhotoUrl: string; // Required
  groomerNotes?: string;
  dontSend?: boolean;
  isDraft?: boolean;
}
```

**Response**:
```typescript
interface CreateReportCardResponse {
  success: boolean;
  reportCard: {
    id: string;
    appointmentId: string;
    publicUrl: string;
    // ... other fields
  };
}
```

**Logic**:
```typescript
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || !['admin', 'groomer'].includes(session.user.role)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = await req.json();

  // Validate required fields
  if (!data.afterPhotoUrl) {
    return new Response('After photo is required', { status: 400 });
  }

  // Check if report card already exists
  const existing = await supabase
    .from('report_cards')
    .select('id')
    .eq('appointment_id', data.appointmentId)
    .single();

  let reportCard;
  if (existing.data) {
    // Update existing
    reportCard = await supabase
      .from('report_cards')
      .update({
        ...data,
        groomer_id: session.user.id,
        is_draft: data.isDraft || false,
        updated_at: new Date()
      })
      .eq('id', existing.data.id)
      .select()
      .single();
  } else {
    // Create new
    reportCard = await supabase
      .from('report_cards')
      .insert({
        ...data,
        groomer_id: session.user.id,
        is_draft: data.isDraft || true,
        expires_at: addDays(new Date(), 90)
      })
      .select()
      .single();
  }

  // If not draft and not "don't send", schedule notification
  if (!data.isDraft && !data.dontSend) {
    await scheduleReportCardNotification(reportCard.data.id);
  }

  return Response.json({
    success: true,
    reportCard: reportCard.data
  });
}
```

#### `GET /api/report-cards/[uuid]`

**Purpose**: Public report card view

**Response**:
```typescript
interface PublicReportCardResponse {
  success: boolean;
  reportCard: {
    id: string;
    petName: string;
    serviceName: string;
    serviceDate: string;
    mood: string;
    coatCondition: string;
    behavior: string;
    healthObservations: string[];
    groomerNotes?: string;
    beforePhotoUrl?: string;
    afterPhotoUrl: string;
    groomerName: string;
    viewCount: number;
    hasReview: boolean;
    isExpired: boolean;
  };
}
```

**Logic**:
```typescript
export async function GET(req: Request, { params }: { params: { uuid: string } }) {
  const { uuid } = params;

  // Fetch report card with joins
  const { data, error } = await supabase
    .from('report_cards')
    .select(`
      *,
      appointment:appointment_id (
        id,
        scheduled_at,
        service:service_id (name),
        pet:pet_id (name),
        customer:customer_id (first_name, last_name)
      ),
      groomer:groomer_id (first_name, last_name),
      review:reviews (id, rating)
    `)
    .eq('id', uuid)
    .single();

  if (error || !data) {
    return new Response('Report card not found', { status: 404 });
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return new Response('Report card has expired', { status: 410 });
  }

  // Increment view count
  await supabase
    .from('report_cards')
    .update({
      view_count: data.view_count + 1,
      last_viewed_at: new Date()
    })
    .eq('id', uuid);

  return Response.json({
    success: true,
    reportCard: {
      id: data.id,
      petName: data.appointment.pet.name,
      serviceName: data.appointment.service.name,
      serviceDate: data.appointment.scheduled_at,
      mood: data.mood,
      coatCondition: data.coat_condition,
      behavior: data.behavior,
      healthObservations: data.health_observations,
      groomerNotes: data.groomer_notes,
      beforePhotoUrl: data.before_photo_url,
      afterPhotoUrl: data.after_photo_url,
      groomerName: `${data.groomer.first_name} ${data.groomer.last_name}`,
      viewCount: data.view_count + 1,
      hasReview: !!data.review,
      isExpired: false
    }
  });
}
```

#### `POST /api/reviews`

**Purpose**: Submit review from report card

**Request Body**:
```typescript
interface SubmitReviewRequest {
  reportCardId: string;
  rating: number; // 1-5
  feedback?: string;
}
```

**Logic**:
```typescript
export async function POST(req: Request) {
  const data = await req.json();

  // Get report card details
  const reportCard = await supabase
    .from('report_cards')
    .select('appointment_id, appointment:appointment_id(customer_id)')
    .eq('id', data.reportCardId)
    .single();

  // Check for duplicate review
  const existing = await supabase
    .from('reviews')
    .select('id')
    .eq('report_card_id', data.reportCardId)
    .single();

  if (existing.data) {
    return new Response('Review already submitted', { status: 400 });
  }

  // Create review
  const review = await supabase
    .from('reviews')
    .insert({
      report_card_id: data.reportCardId,
      customer_id: reportCard.data.appointment.customer_id,
      appointment_id: reportCard.data.appointment_id,
      rating: data.rating,
      feedback: data.feedback,
      is_public: data.rating >= 4
    })
    .select()
    .single();

  return Response.json({
    success: true,
    review: review.data,
    redirectToGoogle: data.rating >= 4
  });
}
```

### Waitlist Routes

#### `GET /api/admin/waitlist`

**Purpose**: List waitlist entries with filters

**Query Parameters**:
```typescript
interface WaitlistQueryParams {
  serviceId?: string;
  status?: string[];
  dateStart?: string;
  dateEnd?: string;
  search?: string;
  sortBy?: 'requested_date' | 'created_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

#### `POST /api/admin/waitlist/fill-slot`

**Purpose**: Send waitlist notifications for open slot

**Request Body**:
```typescript
interface FillSlotRequest {
  slotTime: string; // ISO timestamp
  serviceId: string;
  waitlistIds: string[]; // Selected waitlist entries to notify
  discountPercent: number;
  responseWindowHours: number;
}
```

**Logic**:
```typescript
export async function POST(req: Request) {
  const data = await req.json();

  // Create slot offer
  const offer = await supabase
    .from('waitlist_slot_offers')
    .insert({
      waitlist_ids: data.waitlistIds,
      appointment_slot: data.slotTime,
      service_id: data.serviceId,
      discount_percent: data.discountPercent,
      expires_at: addHours(new Date(), data.responseWindowHours)
    })
    .select()
    .single();

  // Send SMS to each waitlist customer
  const notifications = data.waitlistIds.map(async (waitlistId) => {
    const waitlist = await getWaitlistEntry(waitlistId);

    return sendSMS({
      to: waitlist.customer.phone,
      body: `Hi ${waitlist.customer.first_name}! A spot opened for ${waitlist.service.name} on ${formatDate(data.slotTime)} at ${formatTime(data.slotTime)}. Reply YES to book with ${data.discountPercent}% off (expires in ${data.responseWindowHours} hours).`,
      trackingId: offer.data.id
    });
  });

  await Promise.all(notifications);

  // Update waitlist status
  await supabase
    .from('waitlist')
    .update({
      status: 'notified',
      notified_at: new Date(),
      offer_expires_at: offer.data.expires_at
    })
    .in('id', data.waitlistIds);

  return Response.json({
    success: true,
    offerId: offer.data.id
  });
}
```

#### `POST /api/webhooks/twilio/incoming`

**Purpose**: Handle inbound SMS replies for waitlist

**Webhook Handler**:
```typescript
export async function POST(req: Request) {
  const formData = await req.formData();
  const from = formData.get('From');
  const body = formData.get('Body')?.toString().toLowerCase().trim();

  // Find active slot offer for this phone number
  const activeOffer = await supabase
    .from('waitlist_slot_offers')
    .select(`
      *,
      waitlist:waitlist_ids (
        id,
        customer:customer_id (phone)
      )
    `)
    .eq('status', 'pending')
    .gt('expires_at', new Date());

  const matchingOffer = activeOffer.data?.find(offer =>
    offer.waitlist.some(w => w.customer.phone === from)
  );

  if (!matchingOffer) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }

  if (body === 'yes') {
    const waitlistEntry = matchingOffer.waitlist.find(w => w.customer.phone === from);

    // Attempt to book (race condition handled)
    const booked = await bookFromWaitlist({
      waitlistId: waitlistEntry.id,
      slotTime: matchingOffer.appointment_slot,
      discountPercent: matchingOffer.discount_percent
    });

    if (booked.success) {
      await supabase
        .from('waitlist_slot_offers')
        .update({
          status: 'claimed',
          claimed_by_waitlist_id: waitlistEntry.id,
          claimed_at: new Date()
        })
        .eq('id', matchingOffer.id);

      await sendSMS({
        to: from,
        body: `Booked! You're confirmed for ${formatDateTime(matchingOffer.appointment_slot)} with ${matchingOffer.discount_percent}% off. Confirmation: ${booked.appointmentId}`
      });

      // Notify other customers slot is filled
      await notifyOthersSlotFilled(matchingOffer.id, waitlistEntry.id);
    } else {
      await sendSMS({
        to: from,
        body: `Sorry, this slot was just filled. You're still on the waitlist!`
      });
    }
  }

  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' }
  });
}
```

### Analytics Routes

#### `GET /api/admin/analytics/kpis`

**Purpose**: Fetch KPI metrics for dashboard

**Query Parameters**:
```typescript
interface KPIQueryParams {
  dateStart: string;
  dateEnd: string;
  compareWithPrevious?: boolean;
}
```

**Response**:
```typescript
interface KPIResponse {
  totalRevenue: {
    current: number;
    previous: number;
    change: number;
  };
  totalAppointments: {
    current: number;
    previous: number;
    change: number;
  };
  avgBookingValue: {
    current: number;
    previous: number;
    change: number;
  };
  retentionRate: {
    current: number;
    previous: number;
    change: number;
  };
  reviewGenerationRate: {
    current: number;
    previous: number;
    change: number;
  };
  waitlistFillRate: {
    current: number;
    previous: number;
    change: number;
  };
}
```

**Logic with Caching**:
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStart = searchParams.get('dateStart');
  const dateEnd = searchParams.get('dateEnd');

  const cacheKey = `kpi_dashboard_${dateStart}_${dateEnd}`;

  // Check cache first
  const cached = await supabase
    .from('analytics_cache')
    .select('data')
    .eq('metric_key', cacheKey)
    .gt('expires_at', new Date())
    .single();

  if (cached.data) {
    return Response.json(cached.data.data);
  }

  // Calculate KPIs
  const kpis = await calculateKPIs(dateStart, dateEnd);

  // Cache for 15 minutes
  await supabase
    .from('analytics_cache')
    .upsert({
      metric_key: cacheKey,
      date_range_start: dateStart,
      date_range_end: dateEnd,
      data: kpis,
      expires_at: addMinutes(new Date(), 15)
    });

  return Response.json(kpis);
}

async function calculateKPIs(dateStart: string, dateEnd: string) {
  // Calculate current period
  const currentAppointments = await supabase
    .from('appointments')
    .select('total_price, status')
    .gte('scheduled_at', dateStart)
    .lte('scheduled_at', dateEnd)
    .eq('status', 'completed');

  const totalRevenue = currentAppointments.data?.reduce(
    (sum, apt) => sum + Number(apt.total_price),
    0
  ) || 0;

  const totalAppointments = currentAppointments.data?.length || 0;
  const avgBookingValue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  // Calculate previous period for comparison
  const daysDiff = differenceInDays(new Date(dateEnd), new Date(dateStart));
  const previousStart = subDays(new Date(dateStart), daysDiff);
  const previousEnd = new Date(dateStart);

  // ... repeat calculations for previous period

  return {
    totalRevenue: {
      current: totalRevenue,
      previous: previousRevenue,
      change: calculatePercentChange(totalRevenue, previousRevenue)
    },
    // ... other KPIs
  };
}
```

#### `GET /api/admin/analytics/charts/appointments-trend`

**Purpose**: Data for appointment trend line chart

**Response**:
```typescript
interface AppointmentTrendData {
  data: Array<{
    date: string;
    appointments: number;
    previousPeriod: number;
  }>;
}
```

#### `GET /api/admin/analytics/groomers`

**Purpose**: Groomer performance metrics

**Response**:
```typescript
interface GroomerPerformanceData {
  groomers: Array<{
    id: string;
    name: string;
    appointmentsCompleted: number;
    averageRating: number;
    totalRevenue: number;
    addonAttachmentRate: number;
  }>;
}
```

### Campaign Routes

#### `POST /api/admin/campaigns`

**Purpose**: Create marketing campaign

**Request Body**:
```typescript
interface CreateCampaignRequest {
  name: string;
  type: 'one_time' | 'recurring';
  segment: SegmentCriteria;
  message: {
    sms: string;
    email: {
      subject: string;
      body: string;
    };
  };
  scheduledFor: string;
  abTestConfig?: ABTestConfig;
}
```

#### `POST /api/admin/campaigns/[id]/send`

**Purpose**: Trigger campaign send

**Logic**:
```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const campaign = await getCampaign(params.id);

  // Get audience based on segment criteria
  const audience = await segmentCustomers(campaign.segment_criteria);

  // Create campaign_sends records
  const sends = audience.map(customer => ({
    campaign_id: campaign.id,
    customer_id: customer.id,
    pet_id: customer.primaryPet?.id,
    type: 'campaign',
    status: 'pending'
  }));

  await supabase.from('campaign_sends').insert(sends);

  // Queue notifications (background job)
  await queueCampaignNotifications(params.id);

  // Update campaign status
  await supabase
    .from('marketing_campaigns')
    .update({ status: 'sending' })
    .eq('id', params.id);

  return Response.json({ success: true });
}
```

---

## State Management

### Report Card Form State

Using local state with auto-save:

```typescript
function useReportCardForm(appointmentId: string) {
  const [state, setState] = useState<ReportCardFormState>({
    appointmentId,
    mood: null,
    coatCondition: null,
    behavior: null,
    healthObservations: [],
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    groomerNotes: '',
    dontSend: false,
    isDraft: true,
    lastSaved: null,
    isOffline: false
  });

  const [isSaving, setIsSaving] = useState(false);

  // Auto-save debounced
  const debouncedSave = useDebouncedCallback(
    async (data: ReportCardFormState) => {
      setIsSaving(true);
      try {
        await saveReportCard(data);
        setState(prev => ({ ...prev, lastSaved: new Date() }));
      } catch (error) {
        // Save to localStorage if offline
        localStorage.setItem(`report-card-draft-${appointmentId}`, JSON.stringify(data));
        setState(prev => ({ ...prev, isOffline: true }));
      } finally {
        setIsSaving(false);
      }
    },
    5000
  );

  // Sync effect
  useEffect(() => {
    debouncedSave(state);
  }, [state]);

  return { state, setState, isSaving };
}
```

### Analytics Dashboard State

Using server state with React Query:

```typescript
function useAnalyticsDashboard(dateRange: DateRange) {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['analytics', 'kpis', dateRange],
    queryFn: () => fetchKPIs(dateRange),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000 // Auto-refresh every 15 min
  });

  const { data: appointmentTrend } = useQuery({
    queryKey: ['analytics', 'appointments-trend', dateRange],
    queryFn: () => fetchAppointmentTrend(dateRange),
    staleTime: 15 * 60 * 1000
  });

  const { data: groomerPerformance } = useQuery({
    queryKey: ['analytics', 'groomers', dateRange],
    queryFn: () => fetchGroomerPerformance(dateRange),
    staleTime: 15 * 60 * 1000
  });

  return {
    kpis,
    appointmentTrend,
    groomerPerformance,
    isLoading: kpisLoading
  };
}
```

---

## Authentication & Security

### Report Card URL Security

**Security Through Obscurity**:
- Use UUID v4 (128-bit random) instead of sequential IDs
- No authentication required for viewing
- Expiration after 90 days
- Rate limiting on report card endpoints

**Rate Limiting**:
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  prefix: 'ratelimit:report-cards'
});

export async function middleware(req: Request) {
  if (req.url.includes('/report-cards/')) {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response('Too many requests', { status: 429 });
    }
  }

  return NextResponse.next();
}
```

### Admin Role Authorization

All admin routes require authentication and role check:

```typescript
// lib/auth/authorization.ts
export async function requireAdmin(req: Request) {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!['admin', 'groomer'].includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return session;
}

// Usage in API route
export async function GET(req: Request) {
  await requireAdmin(req);
  // ... route logic
}
```

### SMS/Email Security

**Twilio Webhook Verification**:
```typescript
import twilio from 'twilio';

export async function POST(req: Request) {
  const signature = req.headers.get('x-twilio-signature');
  const url = req.url;
  const body = await req.text();

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature!,
    url,
    body
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook
}
```

**Unsubscribe Handling**:
```typescript
// Track unsubscribed users
CREATE TABLE IF NOT EXISTS public.marketing_unsubscribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
  reason TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW()
);

// Check before sending
async function canSendMarketing(customerId: string, channel: 'sms' | 'email') {
  const unsubscribed = await supabase
    .from('marketing_unsubscribes')
    .select('id')
    .eq('customer_id', customerId)
    .in('channel', [channel, 'both'])
    .single();

  return !unsubscribed.data;
}
```

---

## Error Handling

### Report Card Submission Errors

```typescript
class ReportCardError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_PHOTO' | 'INVALID_APPOINTMENT' | 'ALREADY_EXISTS' | 'UPLOAD_FAILED'
  ) {
    super(message);
  }
}

async function createReportCard(data: CreateReportCardRequest) {
  try {
    // Validate after photo
    if (!data.afterPhotoUrl) {
      throw new ReportCardError('After photo is required', 'MISSING_PHOTO');
    }

    // Check appointment exists
    const appointment = await getAppointment(data.appointmentId);
    if (!appointment) {
      throw new ReportCardError('Appointment not found', 'INVALID_APPOINTMENT');
    }

    // Check for duplicate
    const existing = await getReportCard(data.appointmentId);
    if (existing) {
      throw new ReportCardError('Report card already exists', 'ALREADY_EXISTS');
    }

    // Save to database
    const reportCard = await supabase.from('report_cards').insert(data);

    return reportCard;
  } catch (error) {
    if (error instanceof ReportCardError) {
      // User-facing error
      toast.error(error.message);
    } else {
      // Unexpected error
      logger.error('Failed to create report card', error);
      toast.error('Something went wrong. Please try again.');
    }
    throw error;
  }
}
```

### SMS/Email Delivery Errors

```typescript
interface NotificationError {
  type: 'TWILIO_ERROR' | 'RESEND_ERROR' | 'INVALID_RECIPIENT';
  message: string;
  originalError: any;
}

async function sendSMSWithRetry(params: SendSMSParams, maxRetries = 3) {
  let lastError: NotificationError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await twilioClient.messages.create({
        to: params.to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: params.body
      });

      // Log success
      await supabase.from('notifications_log').insert({
        type: 'sms',
        channel: 'sms',
        recipient: params.to,
        content: params.body,
        status: 'sent',
        sent_at: new Date(),
        tracking_id: params.trackingId
      });

      return result;
    } catch (error: any) {
      lastError = {
        type: 'TWILIO_ERROR',
        message: error.message,
        originalError: error
      };

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  // Log failure
  await supabase.from('notifications_log').insert({
    type: 'sms',
    channel: 'sms',
    recipient: params.to,
    content: params.body,
    status: 'failed',
    error_message: lastError?.message,
    tracking_id: params.trackingId
  });

  throw lastError;
}
```

### Analytics Query Errors

```typescript
async function fetchKPIsWithFallback(dateRange: DateRange) {
  try {
    // Try to fetch from cache
    const cached = await getCachedAnalytics(dateRange);
    if (cached) return cached;

    // Calculate fresh data
    const kpis = await calculateKPIs(dateRange);

    // Cache result
    await cacheAnalytics(dateRange, kpis);

    return kpis;
  } catch (error) {
    logger.error('Failed to fetch KPIs', error);

    // Return stale cache if available
    const staleCache = await getStaleCache(dateRange);
    if (staleCache) {
      return {
        ...staleCache,
        isStale: true
      };
    }

    // Return empty state
    return getEmptyKPIs();
  }
}
```

---

## Testing Strategy

### Unit Tests

**Report Card Form Validation**:
```typescript
describe('ReportCardForm', () => {
  it('should require after photo', () => {
    const data = {
      appointmentId: '123',
      mood: 'happy',
      // Missing afterPhotoUrl
    };

    expect(() => validateReportCard(data)).toThrow('After photo is required');
  });

  it('should allow optional before photo', () => {
    const data = {
      appointmentId: '123',
      afterPhotoUrl: 'https://example.com/after.jpg',
      // No beforePhotoUrl
    };

    expect(validateReportCard(data)).toBe(true);
  });

  it('should validate health observations array', () => {
    const data = {
      appointmentId: '123',
      afterPhotoUrl: 'https://example.com/after.jpg',
      healthObservations: ['skin_irritation', 'invalid_option']
    };

    expect(() => validateReportCard(data)).toThrow('Invalid health observation');
  });
});
```

**Review Routing Logic**:
```typescript
describe('Review Routing', () => {
  it('should route 4-5 stars to Google', () => {
    const rating = 5;
    const result = getReviewRoute(rating);
    expect(result.destination).toBe('google');
  });

  it('should route 1-3 stars to private feedback', () => {
    const rating = 2;
    const result = getReviewRoute(rating);
    expect(result.destination).toBe('feedback');
  });
});
```

### Integration Tests

**Waitlist Slot Filling**:
```typescript
describe('Waitlist Slot Filling', () => {
  it('should send SMS to matching waitlist customers', async () => {
    const slot = {
      time: '2025-01-15T10:00:00Z',
      serviceId: 'basic-grooming',
      discountPercent: 10
    };

    const waitlistEntries = [
      { id: 'w1', customerId: 'c1', requestedDate: '2025-01-15' },
      { id: 'w2', customerId: 'c2', requestedDate: '2025-01-16' }
    ];

    const result = await fillSlotFromWaitlist(slot, waitlistEntries);

    expect(twilioClient.messages.create).toHaveBeenCalledTimes(2);
    expect(result.notified).toEqual(['w1', 'w2']);
  });

  it('should handle first YES response', async () => {
    const offerId = 'offer-1';
    const waitlistId = 'w1';

    // Simulate SMS reply
    await handleIncomingSMS({
      From: '+15551234567',
      Body: 'YES',
      MessageSid: 'SM123'
    });

    // Check appointment was created
    const appointment = await getAppointmentByWaitlist(waitlistId);
    expect(appointment).toBeDefined();
    expect(appointment.discount_percent).toBe(10);

    // Check offer was claimed
    const offer = await getSlotOffer(offerId);
    expect(offer.status).toBe('claimed');
  });
});
```

**Analytics Caching**:
```typescript
describe('Analytics Caching', () => {
  it('should return cached data if available', async () => {
    const dateRange = { start: '2025-01-01', end: '2025-01-31' };

    // Prime cache
    await cacheAnalytics(dateRange, { totalRevenue: 5000 });

    // Fetch should use cache
    const result = await fetchKPIs(dateRange);
    expect(result.totalRevenue).toBe(5000);

    // Database query should not have been called
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should refresh cache after expiration', async () => {
    const dateRange = { start: '2025-01-01', end: '2025-01-31' };

    // Cache expired data
    await cacheAnalytics(dateRange, { totalRevenue: 5000 }, {
      expiresAt: subMinutes(new Date(), 1) // Expired 1 min ago
    });

    // Fetch should recalculate
    const result = await fetchKPIs(dateRange);

    // Database query should have been called
    expect(supabase.from).toHaveBeenCalled();
  });
});
```

### End-to-End Tests

**Report Card Flow**:
```typescript
describe('Report Card End-to-End', () => {
  it('should complete full report card flow', async () => {
    // 1. Groomer creates report card
    await groomerLogin();
    await navigateTo('/admin/appointments/123');
    await clickButton('Create Report Card');

    await selectOption('mood', 'happy');
    await selectOption('coatCondition', 'excellent');
    await uploadPhoto('after', 'puppy-after.jpg');
    await clickButton('Submit');

    // 2. Customer receives notification
    const sms = await getLastSMS(customerPhone);
    expect(sms.body).toContain('report card');

    // 3. Customer views report card
    const reportCardUrl = extractUrl(sms.body);
    await visit(reportCardUrl);

    expect(page).toHaveText('Happy');
    expect(page).toHaveImage('puppy-after.jpg');

    // 4. Customer submits 5-star review
    await clickStar(5);
    await clickButton('Submit Review');

    // 5. Redirected to Google
    expect(page.url()).toContain('google.com/business/review');
  });
});
```

---

## Performance Optimization

### Image Optimization

**Photo Upload Compression**:
```typescript
async function optimizeAndUploadPhoto(file: File, type: 'before' | 'after'): Promise<string> {
  // Compress image client-side before upload
  const compressedBlob = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    mimeType: 'image/jpeg'
  });

  // Generate unique filename
  const filename = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('report-cards')
    .upload(`photos/${filename}`, compressedBlob, {
      cacheControl: '31536000', // 1 year
      upsert: false
    });

  if (error) throw error;

  // Return public URL
  const { data: publicUrl } = supabase.storage
    .from('report-cards')
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}
```

**Image CDN Caching**:
```typescript
// Supabase Storage automatically provides CDN caching
// Set cache headers for report card images
const imageUrl = supabase.storage
  .from('report-cards')
  .getPublicUrl('photos/after-123.jpg', {
    transform: {
      width: 800,
      height: 800,
      resize: 'contain'
    }
  });
```

### Analytics Query Optimization

**Database Indexes**:
```sql
-- Appointments by date range (for analytics)
CREATE INDEX idx_appointments_completed_date ON public.appointments(scheduled_at)
  WHERE status = 'completed';

-- Revenue aggregation
CREATE INDEX idx_appointments_revenue ON public.appointments(scheduled_at, total_price, status);

-- Groomer performance
CREATE INDEX idx_appointments_groomer_date ON public.appointments(groomer_id, scheduled_at, status);

-- Review metrics
CREATE INDEX idx_reviews_rating_date ON public.reviews(rating, submitted_at);

-- Campaign tracking
CREATE INDEX idx_campaign_sends_converted ON public.campaign_sends(converted_at)
  WHERE converted_at IS NOT NULL;
```

**Query Optimization with Materialized Views** (optional for large datasets):
```sql
-- Materialized view for daily appointment stats (refreshed nightly)
CREATE MATERIALIZED VIEW daily_appointment_stats AS
SELECT
  DATE(scheduled_at) as date,
  COUNT(*) as total_appointments,
  SUM(total_price) as total_revenue,
  AVG(total_price) as avg_booking_value,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancellations,
  COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_shows
FROM public.appointments
GROUP BY DATE(scheduled_at);

CREATE INDEX idx_daily_stats_date ON daily_appointment_stats(date);

-- Refresh nightly via cron job
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_appointment_stats;
```

### Pagination and Lazy Loading

**Waitlist Table Pagination**:
```typescript
interface PaginationParams {
  page: number;
  limit: number;
}

async function getWaitlistPaginated({ page, limit }: PaginationParams) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('waitlist')
    .select('*, customer:customer_id(*), pet:pet_id(*), service:service_id(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}
```

**Chart Data Lazy Loading**:
```typescript
function AnalyticsDashboard() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  return (
    <div>
      <KPIGrid /> {/* Always loaded */}

      <Tabs onChange={setSelectedChart}>
        <Tab value="appointments">
          {selectedChart === 'appointments' && <AppointmentTrendChart />}
        </Tab>
        <Tab value="revenue">
          {selectedChart === 'revenue' && <RevenueChart />}
        </Tab>
        <Tab value="services">
          {selectedChart === 'services' && <ServicePopularityChart />}
        </Tab>
      </Tabs>
    </div>
  );
}
```

---

## Accessibility (WCAG 2.1 AA Compliance)

### Report Card Public Page

**Semantic HTML**:
```tsx
<article aria-labelledby="report-card-title">
  <header>
    <h1 id="report-card-title">
      {petName}'s Grooming Report Card
    </h1>
    <time dateTime={serviceDate}>
      {formatDate(serviceDate)}
    </time>
  </header>

  <section aria-labelledby="assessment-heading">
    <h2 id="assessment-heading">Grooming Assessment</h2>
    <dl>
      <div>
        <dt>Mood</dt>
        <dd>{mood}</dd>
      </div>
      <div>
        <dt>Coat Condition</dt>
        <dd>{coatCondition}</dd>
      </div>
    </dl>
  </section>

  <figure>
    <img
      src={afterPhotoUrl}
      alt={`${petName} after grooming on ${formatDate(serviceDate)}`}
      loading="lazy"
    />
    <figcaption>After grooming</figcaption>
  </figure>
</article>
```

**Keyboard Navigation**:
```typescript
function StarRating({ onRate }: { onRate: (rating: number) => void }) {
  const [focusedStar, setFocusedStar] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setFocusedStar(prev => Math.min(5, prev + 1));
    } else if (e.key === 'ArrowLeft') {
      setFocusedStar(prev => Math.max(1, prev - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      onRate(focusedStar);
    }
  };

  return (
    <div role="radiogroup" aria-label="Rate your experience">
      {[1, 2, 3, 4, 5].map(rating => (
        <button
          key={rating}
          role="radio"
          aria-checked={focusedStar === rating}
          aria-label={`${rating} stars`}
          onClick={() => onRate(rating)}
          onKeyDown={handleKeyDown}
          className="star-button"
        >
          <StarIcon />
        </button>
      ))}
    </div>
  );
}
```

### Admin Dashboard Accessibility

**Screen Reader Announcements**:
```typescript
function KPICard({ title, value, change }: KPICardProps) {
  const changeDirection = change >= 0 ? 'increased' : 'decreased';
  const announcement = `${title}: ${value}, ${changeDirection} by ${Math.abs(change)}% compared to previous period`;

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{announcement}</span>
      <div aria-hidden="true">
        {/* Visual content */}
      </div>
    </div>
  );
}
```

**Focus Management**:
```typescript
function FillSlotModal({ isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Trap focus within modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      {/* Modal content */}
    </div>
  );
}
```

---

## Deployment Considerations

### Environment Variables

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_STATUS_CALLBACK_URL=https://thepuppyday.com/api/webhooks/twilio/status

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=reports@thepuppyday.com
RESEND_FROM_NAME=Puppy Day

# Google Business
GOOGLE_BUSINESS_REVIEW_URL=https://g.page/r/...

# Analytics Cache
ANALYTICS_CACHE_TTL_MINUTES=15

# Report Card Settings
REPORT_CARD_EXPIRY_DAYS=90
REPORT_CARD_AUTO_SEND_DELAY_MINUTES=15

# Waitlist Settings
WAITLIST_RESPONSE_WINDOW_HOURS=2
WAITLIST_DEFAULT_DISCOUNT_PERCENT=10

# Reminder Settings
REMINDER_ADVANCE_DAYS=7
```

### Database Migrations

**Migration 001: Add Phase 6 Tables**:
```sql
-- File: supabase/migrations/20250115000001_phase_6_tables.sql

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  -- ... (see Data Models section)
);

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  -- ... (see Data Models section)
);

-- Campaign sends table
CREATE TABLE IF NOT EXISTS public.campaign_sends (
  -- ... (see Data Models section)
);

-- Analytics cache table
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  -- ... (see Data Models section)
);

-- Waitlist slot offers table
CREATE TABLE IF NOT EXISTS public.waitlist_slot_offers (
  -- ... (see Data Models section)
);

-- Modify existing tables
ALTER TABLE public.report_cards
ADD COLUMN IF NOT EXISTS groomer_id UUID REFERENCES public.users(id),
-- ... (see Data Models section);

-- Add indexes
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
-- ... (see Data Models section)
```

### Background Jobs Setup

**Vercel Cron Jobs** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/send-breed-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/expire-waitlist-offers",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/cleanup-analytics-cache",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-scheduled-campaigns",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Cron Job Implementation**:
```typescript
// app/api/cron/send-breed-reminders/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await scheduleBreedReminders();
    return Response.json({
      success: true,
      reminders_sent: result.count
    });
  } catch (error) {
    logger.error('Breed reminders cron failed', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### Monitoring and Logging

**Error Tracking**:
```typescript
// lib/logger.ts
import * as Sentry from '@sentry/nextjs';

export const logger = {
  error: (message: string, error: any, context?: any) => {
    console.error(message, error);
    Sentry.captureException(error, {
      tags: { feature: 'phase-6' },
      extra: { message, ...context }
    });
  },

  info: (message: string, data?: any) => {
    console.log(message, data);
  }
};
```

**Performance Monitoring**:
```typescript
// Track analytics query performance
export async function fetchKPIs(dateRange: DateRange) {
  const startTime = Date.now();

  try {
    const kpis = await calculateKPIs(dateRange);

    const duration = Date.now() - startTime;
    logger.info('KPI fetch completed', {
      duration,
      dateRange,
      cached: false
    });

    return kpis;
  } catch (error) {
    logger.error('KPI fetch failed', error, { dateRange });
    throw error;
  }
}
```

---

## Migration Path

### Phase 5 Dependencies

Phase 6 assumes Phase 5 (Admin Panel Core) provides:
- `/admin` layout with navigation
- Authentication and role-based access
- Appointment management pages
- Admin settings framework

**Integration Points**:
```
Phase 5                        Phase 6
─────────                      ───────
/admin/appointments      →     + "Create Report Card" button
/admin/appointments/[id] →     + Report card section
/admin/calendar          →     + "Fill from Waitlist" on slots
/admin/settings          →     + Phase 6 settings tabs
```

### Incremental Rollout Strategy

**Week 1: Report Cards (MVP)**
- Enable report card creation (groomer form)
- Public report card pages
- Manual sending (no automation)
- Basic review collection

**Week 2: Automation + Waitlist**
- Auto-send report cards after completion
- Waitlist dashboard
- Manual waitlist booking

**Week 3: SMS Automation**
- Waitlist slot-filling SMS
- Breed-based reminders
- Response handling

**Week 4: Analytics + Polish**
- Analytics dashboard
- Notification center
- Campaign builder
- Performance optimization

---

## Appendix

### Wireframes (Text-Based)

#### Report Card Public Page (Mobile)

```
┌─────────────────────────────┐
│  🐕 Puppy Day               │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   [After Photo Hero]  │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  🐾 Max's Grooming Report   │
│  📅 January 15, 2025        │
│                             │
├─────────────────────────────┤
│  Grooming Assessment        │
├─────────────────────────────┤
│  😊 Mood: Happy             │
│  ✨ Coat: Excellent         │
│  ⭐ Behavior: Great         │
├─────────────────────────────┤
│  Health Observations        │
├─────────────────────────────┤
│  ✅ All clear!              │
│  No health concerns noted   │
├─────────────────────────────┤
│  Groomer's Notes            │
├─────────────────────────────┤
│  "Max was such a good boy!  │
│   His coat is looking much  │
│   healthier after today's   │
│   deep conditioning..."     │
├─────────────────────────────┤
│  Before & After             │
├─────────────────────────────┤
│  ┌──────────┐  ┌──────────┐ │
│  │ Before   │  │ After    │ │
│  │  Photo   │  │  Photo   │ │
│  └──────────┘  └──────────┘ │
├─────────────────────────────┤
│  📝 Groomer: Sarah Johnson  │
│  ✍️ Signature               │
├─────────────────────────────┤
│  Share this report:         │
│  [📱] [✉️] [⬇️ PDF]        │
├─────────────────────────────┤
│  Rate Your Experience       │
│  ⭐⭐⭐⭐⭐               │
│  [Submit Review]            │
└─────────────────────────────┘
```

#### Analytics Dashboard (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│ Analytics Dashboard              [Today ▼] [Export ▼]          │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Revenue  │ │Appts     │ │Avg Value │ │Retention │          │
│  │ $5,240   │ │ 42       │ │ $124.76  │ │ 78%      │          │
│  │ ↑ 12.3%  │ │ ↑ 8.5%   │ │ ↑ 3.2%   │ │ ↑ 5.1%   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────────────────┤
│  Appointment Trends                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    50│                                     ╱╲             │  │
│  │    40│                          ╱╲        ╱  ╲            │  │
│  │    30│            ╱╲           ╱  ╲      ╱    ╲           │  │
│  │    20│     ╱╲    ╱  ╲    ╱╲   ╱    ╲    ╱      ╲          │  │
│  │    10│    ╱  ╲  ╱    ╲  ╱  ╲ ╱      ╲  ╱        ╲         │  │
│  │     0└────────────────────────────────────────────────    │  │
│  │       Mon  Tue  Wed  Thu  Fri  Sat  Sun                  │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────┬──────────────────────────────────┤
│ Revenue by Service          │ Customer Breakdown               │
│ ┌─────────────────────────┐ │ ┌─────────────────────────────┐  │
│ │     Premium 45%         │ │ │   Returning 68%             │  │
│ │       ╱───╲             │ │ │     ╱────╲                  │  │
│ │      │  ●  │            │ │ │    │  ●   │                 │  │
│ │       ╲───╱             │ │ │     ╲────╱                  │  │
│ │     Basic 38%           │ │ │   New 32%                   │  │
│ │     Add-ons 17%         │ │ │                             │  │
│ └─────────────────────────┘ │ └─────────────────────────────┘  │
└─────────────────────────────┴──────────────────────────────────┘
```

### Email Templates

#### Report Card Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pet's Grooming Report Card</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #F8EEE5; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="background-color: #434E54; padding: 20px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0;">🐕 Puppy Day</h1>
      </td>
    </tr>

    <!-- Hero Image -->
    <tr>
      <td style="padding: 0;">
        <img src="{{afterPhotoUrl}}" alt="{{petName}} after grooming" style="width: 100%; height: auto; display: block;">
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: #434E54; margin-top: 0;">{{petName}}'s Grooming Report Card is Ready!</h2>

        <p style="color: #6B7280; line-height: 1.6;">
          Hi {{customerName}},
        </p>

        <p style="color: #6B7280; line-height: 1.6;">
          {{petName}} had a wonderful grooming session today! Click below to see the full report card with before/after photos and our groomer's notes.
        </p>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="background-color: #434E54; border-radius: 8px; text-align: center;">
              <a href="{{reportCardUrl}}" style="display: inline-block; padding: 15px 40px; color: #FFFFFF; text-decoration: none; font-weight: bold;">
                View Report Card
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #6B7280; line-height: 1.6; font-size: 14px;">
          This report card will be available for 90 days. We'd love to hear about your experience!
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8EEE5; padding: 20px; text-align: center;">
        <p style="color: #6B7280; margin: 0; font-size: 14px;">
          Puppy Day<br>
          14936 Leffingwell Rd, La Mirada, CA 90638<br>
          (657) 252-2903
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

#### Breed Reminder Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time for {{petName}}'s Grooming!</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #F8EEE5; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h1 style="color: #434E54; margin-top: 0;">⏰ Grooming Reminder</h1>

        <p style="color: #6B7280; font-size: 18px; line-height: 1.6;">
          Hi {{customerName}},
        </p>

        <p style="color: #434E54; font-size: 20px; font-weight: bold; margin: 30px 0;">
          It's time for {{petName}}'s next grooming!
        </p>

        <p style="color: #6B7280; line-height: 1.6;">
          {{breedMessage}}
        </p>

        <p style="color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
          Last visit: {{lastVisitDate}}<br>
          Recommended: Every {{groomingFrequency}} weeks
        </p>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: #434E54; border-radius: 8px; text-align: center;">
              <a href="{{bookingUrl}}" style="display: inline-block; padding: 15px 40px; color: #FFFFFF; text-decoration: none; font-weight: bold;">
                Book Now
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
          <a href="{{unsubscribeUrl}}" style="color: #6B7280;">Unsubscribe from reminders</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

### SMS Templates

```typescript
const smsTemplates = {
  reportCard: (data: { customerName: string; petName: string; url: string }) =>
    `Hi ${data.customerName}! ${data.petName}'s grooming report card is ready! View it here: ${data.url}`,

  waitlistOffer: (data: { customerName: string; service: string; date: string; time: string; discount: number; hours: number }) =>
    `Hi ${data.customerName}! A spot opened for ${data.service} on ${data.date} at ${data.time}. Reply YES to book with ${data.discount}% off (expires in ${data.hours} hours).`,

  waitlistBooked: (data: { dateTime: string; discount: number; confirmationId: string }) =>
    `Booked! You're confirmed for ${data.dateTime} with ${data.discount}% off. Confirmation: ${data.confirmationId}`,

  waitlistFilled: () =>
    `Sorry, this slot was just filled. You're still on the waitlist!`,

  breedReminder: (data: { customerName: string; petName: string; breedMessage: string; url: string }) =>
    `Hi ${data.customerName}, ${data.petName} is due for a groom! ${data.breedMessage} Book now: ${data.url}`,

  appointmentConfirmation: (data: { customerName: string; petName: string; dateTime: string }) =>
    `Hi ${data.customerName}! ${data.petName}'s appointment is confirmed for ${data.dateTime}. See you soon!`,
};
```

---

## Research Sources

This design document incorporates industry best practices and research from the following sources:

### Grooming Report Cards & Customer Engagement
- [Unleash Customer Happiness with Grooming Reports - MoeGo](https://www.moego.pet/blog/customer-service-and-grooming-reports)
- [Best Practices for Salon Management: A Comprehensive Guide for 2025](https://louisvillebeautyacademy.net/best-practices-for-salon-management-a-comprehensive-guide-for-2025/)
- [4 key salon consumer trends every business owner should know for 2025](https://www.zenoti.com/blogs/4-key-salon-consumer-trends-every-business-owner-should-know-for-2025)

### Waitlist Management & SMS Automation
- [Best Waitlist Software with SMS Messaging 2025 | GetApp](https://www.getapp.com/customer-management-software/waitlist/f/sms-integration/)
- [10+ Best Waitlist App and Software [Updated 2025] | Qminder](https://www.qminder.com/blog/customer-service/best-waitlist-app-software-2024/)
- [Waitlist Software: Fill Last-Minute Cancellations and Gaps](https://squareup.com/au/en/appointments/features/waitlist-software)

### Analytics Dashboard Design
- [Effective Dashboard Design Principles for 2025 | UXPin](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [What is a KPI Dashboard? Complete Guide to Key Performance Indicators Dashboards 2025](https://improvado.io/blog/kpi-dashboard)
- [Julius AI | 26 Business Intelligence Dashboard Design Best Practices 2025](https://julius.ai/articles/business-intelligence-dashboard-design-best-practices)
- [10 Dashboard Design Principles and Best Practices | TechTarget](https://www.techtarget.com/searchbusinessanalytics/tip/Good-dashboard-design-8-tips-and-best-practices-for-BI-teams)

### Customer Retention Marketing
- [Pet Grooming Salon: Customer Retention Rate – BusinessDojo](https://dojobusiness.com/blogs/news/pet-grooming-salon-customer-retention)
- [Top Pet Care Marketing Strategies to Grow in 2025](https://zeely.ai/blog/best-pet-care-marketing-strategies/)
- [Marketing strategies for mobile pet grooming in 2025 - Callin](https://callin.io/marketing-strategies-for-mobile-pet-grooming/)
- [Automation in Retention Marketing: Trends in 2025 - Blog Promodo](https://www.promodo.com/blog/automation-in-retention-marketing-tendencies-that-you-shouldnt-ignore-in-2023)

---

## Summary

This design document provides a comprehensive technical blueprint for Phase 6: Admin Panel Advanced Features. The architecture balances:

- **User Experience**: Tablet-optimized groomer forms, mobile-first public pages, intuitive admin dashboards
- **Performance**: Analytics caching, image optimization, lazy loading, database indexing
- **Scalability**: Queue-based notifications, background jobs, pagination
- **Security**: UUID-based URLs, rate limiting, role-based access, webhook verification
- **Maintainability**: Type-safe APIs, comprehensive error handling, test coverage

The phased implementation approach ensures rapid delivery of high-value features (report cards) while building toward comprehensive retention marketing and analytics capabilities.

**Next Steps**:
1. Review and approve this design document
2. Create implementation task breakdown (tasks.md)
3. Set up external service accounts (Twilio, Resend)
4. Begin Week 1 implementation: Report Card MVP

---

**Document End**
