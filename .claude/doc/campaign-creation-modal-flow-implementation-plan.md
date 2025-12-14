# Implementation Plan: Campaign Creation Modal Flow (Tasks 0041-0045)

**Date:** 2025-12-13
**Phase:** Phase 6 - Admin Panel Advanced Features
**Tasks:** 0041-0045 (Campaign Builder Multi-Step Modal)

## Overview

This implementation plan covers the complete multi-step campaign creation modal flow for The Puppy Day marketing campaigns. The modal includes type selection, audience segmentation, message composition, scheduling/A/B testing, and template presets.

## Context

- **Task 0040 (CampaignBuilder page):** ✅ Already complete at `src/app/admin/marketing/campaigns/page.tsx`
- **Existing API:** Campaign creation endpoint exists at `src/app/api/admin/campaigns/route.ts`
- **Types:** Complete marketing types exist at `src/types/marketing.ts`
- **Design System:** DaisyUI 5.5.8 with Clean & Elegant Professional theme
- **Primary Color:** Charcoal (#434E54)
- **Background:** Warm cream (#F8EEE5)

---

## Task 0041: CreateCampaignModal with Type Selection

### Files to Create

#### 1. `src/components/admin/marketing/CreateCampaignModal.tsx`

**Purpose:** Main modal wrapper component that manages the multi-step wizard flow.

**Key Features:**
- Multi-step wizard with progress indicator
- State management for entire campaign creation flow
- Step navigation (Next, Previous, Cancel)
- Form validation before step progression
- Integration with CampaignList for modal open/close
- Submit campaign on final step

**Component Structure:**
```typescript
interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh campaign list
}

interface CampaignFormData {
  // Step 1: Type Selection
  name: string;
  type: CampaignType; // 'one_time' | 'recurring'

  // Step 2: Segmentation
  segment_criteria: SegmentCriteria;

  // Step 3: Message Composition
  channel: CampaignChannel; // 'email' | 'sms' | 'both'
  message_content: MessageContent;

  // Step 4: Scheduling
  scheduled_at?: string;
  recurring_config?: RecurringConfig;
  ab_test_config?: ABTestConfig;
}
```

**State Management:**
- Use `useState` for current step (1-4)
- Use `useState` for form data
- Use custom hook `useCreateCampaign` for API submission
- Template selection is optional "Step 0" that pre-fills form data

**DaisyUI Components:**
- Modal: `<dialog>` with `modal modal-open` classes
- Progress: Custom stepper UI with `steps` component
- Buttons: `btn btn-primary`, `btn btn-ghost`
- Form: Standard DaisyUI form controls

**Validation:**
- Step 1: Name required, type required
- Step 2: At least one segment filter required
- Step 3: Message content required based on channel
- Step 4: Valid date/time if scheduled

**Modal Layout:**
```
┌─────────────────────────────────────────────┐
│ Create Campaign               [Progress]  X │
├─────────────────────────────────────────────┤
│                                             │
│          [Step Component Content]           │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  [Cancel]                  [Previous] [Next]│
└─────────────────────────────────────────────┘
```

**Important Notes:**
- Modal width: `max-w-4xl` for comfortable form layout
- Use DaisyUI `modal-backdrop` for overlay
- Prevent closing modal if form has unsaved changes (confirmation dialog)
- Close modal on successful submission with success toast

---

#### 2. `src/components/admin/marketing/CampaignTypeSelector.tsx`

**Purpose:** Step 1 component for selecting campaign type and entering name.

**Key Features:**
- Campaign name input (required)
- Campaign type selection: One-time vs Recurring
- Visual cards for type selection
- Description of each type
- Large touch-friendly selection cards

**DaisyUI Components:**
- Input: `input input-bordered w-full`
- Cards: `card bg-white shadow-md hover:shadow-lg cursor-pointer`
- Radio: Hidden radio inputs with card-based UI
- Badge: `badge badge-primary` for selected state

**Type Selection Cards:**

**One-Time Campaign:**
- Icon: Calendar or Send icon
- Title: "One-Time Campaign"
- Description: "Send a single message to your target audience at a specific time or immediately"
- Use cases: Seasonal promotions, special events, announcements

**Recurring Campaign:**
- Icon: Repeat or Clock icon
- Title: "Recurring Campaign"
- Description: "Automatically send messages on a regular schedule (daily, weekly, monthly)"
- Use cases: Weekly reminders, monthly newsletters, breed-based grooming reminders

**Layout:**
```tsx
<div className="space-y-6">
  <div className="form-control">
    <label className="label">
      <span className="label-text font-semibold">Campaign Name</span>
    </label>
    <input
      type="text"
      className="input input-bordered w-full"
      placeholder="e.g., Summer Grooming Promotion"
      maxLength={100}
      required
    />
  </div>

  <div>
    <label className="label">
      <span className="label-text font-semibold">Campaign Type</span>
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* One-Time Card */}
      {/* Recurring Card */}
    </div>
  </div>
</div>
```

**Validation:**
- Name: Required, 1-100 characters
- Type: Required (one must be selected)

---

## Task 0042: SegmentBuilder for Audience Targeting

### Files to Create

#### 3. `src/components/admin/marketing/SegmentBuilder.tsx`

**Purpose:** Step 2 component for building customer segments with real-time audience preview.

**Key Features:**
- Multiple filter controls for customer segmentation
- Real-time audience size preview
- List of first 5 matching customers
- Loading state during preview fetch
- Clear/reset filters button

**State Management:**
- Local state for segment criteria
- Debounced API call for audience preview (500ms)
- Loading state for preview

**DaisyUI Components:**
- Card: `card bg-base-200` for filter container
- Card: `card bg-white` for audience preview
- Badge: `badge badge-info` for count
- Loading: `loading loading-spinner loading-sm`

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Build Your Audience                         │
├─────────────────────────────────────────────┤
│  [Filter Controls - SegmentFilters]         │
│                                             │
├─────────────────────────────────────────────┤
│ Audience Preview                 [250 🎯]   │
│  ┌─────────────────────────────┐           │
│  │ • John Doe                  │           │
│  │ • Jane Smith                │           │
│  │ • Bob Johnson               │           │
│  │ • ...                       │           │
│  └─────────────────────────────┘           │
└─────────────────────────────────────────────┘
```

---

#### 4. `src/components/admin/marketing/SegmentFilters.tsx`

**Purpose:** Filter controls for customer segmentation.

**Filter Options (from SegmentCriteria):**

1. **Last Visit** (`last_visit_days`)
   - Input type: Number input
   - Label: "Last visited within (days)"
   - Placeholder: "e.g., 30, 60, 90"
   - Description: "Customers who visited within the last X days"

2. **Service Type** (`service_ids`)
   - Input type: Multi-select dropdown
   - Label: "Service History"
   - Options: Fetch from services table
   - Description: "Customers who have received specific services"

3. **Pet Breed** (`breed_ids`)
   - Input type: Multi-select dropdown
   - Label: "Pet Breed"
   - Options: Fetch from breeds table
   - Description: "Customers with specific pet breeds"

4. **Membership Status** (`has_membership`)
   - Input type: Radio group
   - Options: All / Members Only / Non-Members Only
   - Label: "Membership Status"

5. **Min Visits Count** (`min_visits`)
   - Input type: Number input
   - Label: "Minimum visits"
   - Placeholder: "e.g., 1, 3, 5"
   - Description: "Customers with at least X visits"

6. **Min Total Spend** (`min_total_spend`)
   - Input type: Number input (currency)
   - Label: "Minimum total spend ($)"
   - Placeholder: "e.g., 100, 500"
   - Description: "Customers who spent at least $X"

7. **Has Upcoming Appointment** (`has_upcoming_appointment`)
   - Input type: Radio group
   - Options: All / With Upcoming / Without Upcoming
   - Label: "Upcoming Appointments"

**DaisyUI Components:**
- Input: `input input-bordered input-sm`
- Select: `select select-bordered select-sm`
- Radio: `radio radio-sm`
- Label: `label label-text text-sm`

**Layout:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Filter inputs arranged in 2-column grid */}
</div>
```

**Important:**
- All filters are optional (empty criteria = all customers)
- Filters use AND logic (all conditions must be true)
- Clear button resets all filters to empty state

---

#### 5. `src/app/api/admin/campaigns/segment-preview/route.ts`

**Purpose:** API endpoint to preview audience size based on segment criteria.

**Endpoint:** `POST /api/admin/campaigns/segment-preview`

**Request Body:**
```typescript
{
  segment_criteria: SegmentCriteria
}
```

**Response:**
```typescript
{
  total_customers: number;
  preview: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    last_visit: string | null;
    total_visits: number;
  }>;
}
```

**Query Logic:**

```sql
SELECT
  u.id,
  u.first_name || ' ' || u.last_name as name,
  u.email,
  u.phone,
  MAX(a.scheduled_at) as last_visit,
  COUNT(a.id) as total_visits
FROM users u
LEFT JOIN appointments a ON a.customer_id = u.id AND a.status = 'completed'
LEFT JOIN pets p ON p.user_id = u.id
LEFT JOIN customer_memberships cm ON cm.customer_id = u.id AND cm.status = 'active'
WHERE u.role = 'customer'
  -- Apply segment criteria filters:
  -- AND (last_visit_days filter)
  -- AND (service_ids filter with JOIN)
  -- AND (breed_ids filter with JOIN on pets)
  -- AND (has_membership filter)
  -- AND (min_visits filter)
  -- AND (min_total_spend filter from payments)
  -- AND (has_upcoming_appointment filter)
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
ORDER BY last_visit DESC NULLS LAST
LIMIT 5 -- For preview
```

**Important:**
- Use Supabase query builder for production
- Use mock store for development (`NEXT_PUBLIC_USE_MOCKS=true`)
- Handle complex filters with proper JOINs
- Count total before applying LIMIT
- Return empty array if no matches

**Mock Implementation:**
- Filter mock users array based on criteria
- Simulate appointments and visits data from mock store
- Return total count and first 5 matches

---

## Task 0043: MessageComposer for SMS/Email

### Files to Create

#### 6. `src/components/admin/marketing/MessageComposer.tsx`

**Purpose:** Step 3 component for composing campaign messages with channel selection.

**Key Features:**
- Channel selection: Email, SMS, or Both
- Conditional rendering of SMS/Email editors
- Variable insertion buttons
- Live preview panel
- Character count for SMS (160 limit warning)

**State Management:**
- Channel selection state
- Message content state (sms_body, email_subject, email_body)
- Preview mode toggle

**DaisyUI Components:**
- Tabs: `tabs tabs-boxed` for channel selection
- Card: `card bg-base-200` for editor container
- Badge: `badge badge-warning` for character count warning

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Compose Your Message                        │
├─────────────────────────────────────────────┤
│ Channel: [Email] [SMS] [Both] ←tabs        │
│                                             │
│ ┌─────────────────┐ ┌──────────────────┐  │
│ │ Editor          │ │ Preview          │  │
│ │                 │ │                  │  │
│ │ [SMS/Email]     │ │ [Sample data]    │  │
│ │                 │ │                  │  │
│ │                 │ │                  │  │
│ └─────────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────┘
```

**Channel Options:**
- Email Only: Show EmailEditor
- SMS Only: Show SMSEditor
- Both: Show EmailEditor + SMSEditor (stacked)

---

#### 7. `src/components/admin/marketing/SMSEditor.tsx`

**Purpose:** SMS-specific message editor with character limit.

**Key Features:**
- Textarea for SMS body
- Character counter (160 limit for single SMS, 306 for concatenated)
- Variable insertion buttons above textarea
- Warning badge if over 160 characters
- Preview with variable substitution

**DaisyUI Components:**
- Textarea: `textarea textarea-bordered w-full`
- Badge: `badge badge-info` (under 160) or `badge badge-warning` (over 160)
- Button: `btn btn-sm btn-ghost` for variable insertion

**Layout:**
```tsx
<div className="space-y-3">
  <div className="flex justify-between items-center">
    <label className="label-text font-semibold">SMS Message</label>
    <span className={`badge ${charCount > 160 ? 'badge-warning' : 'badge-info'}`}>
      {charCount} / 160 characters
    </span>
  </div>

  <VariableInserter onInsert={handleVariableInsert} />

  <textarea
    className="textarea textarea-bordered w-full h-32"
    placeholder="Hi {customer_name}, ..."
    value={smsBody}
    onChange={handleChange}
    maxLength={306}
  />

  {charCount > 160 && (
    <div className="alert alert-warning">
      <span>Message exceeds 160 characters and will be sent as {Math.ceil(charCount / 153)} SMS messages.</span>
    </div>
  )}
</div>
```

**SMS Best Practices Message:**
- Show tip: "Keep messages under 160 characters for single SMS delivery"
- Show tip: "Include unsubscribe option: Reply STOP to opt out"

---

#### 8. `src/components/admin/marketing/EmailEditor.tsx`

**Purpose:** Email-specific message editor with subject and body.

**Key Features:**
- Subject line input
- Body textarea (plain text for now, rich text in future)
- Variable insertion buttons
- Preview with HTML rendering (basic formatting)

**DaisyUI Components:**
- Input: `input input-bordered w-full`
- Textarea: `textarea textarea-bordered w-full`
- Badge: `badge badge-info` for character count

**Layout:**
```tsx
<div className="space-y-4">
  <div className="form-control">
    <label className="label">
      <span className="label-text font-semibold">Subject Line</span>
      <span className="label-text-alt">{subjectLength} / 78 characters</span>
    </label>
    <input
      type="text"
      className="input input-bordered w-full"
      placeholder="Your grooming appointment is coming up!"
      value={emailSubject}
      onChange={handleSubjectChange}
      maxLength={78}
    />
  </div>

  <div className="form-control">
    <label className="label">
      <span className="label-text font-semibold">Email Body</span>
    </label>
    <VariableInserter onInsert={handleVariableInsert} />
    <textarea
      className="textarea textarea-bordered w-full h-48"
      placeholder="Hi {customer_name},&#10;&#10;We hope this message finds you and {pet_name} well!..."
      value={emailBody}
      onChange={handleBodyChange}
    />
  </div>

  <div className="text-sm text-gray-600">
    <p>💡 Tip: Keep subject lines under 50 characters for better mobile display.</p>
  </div>
</div>
```

**Email Best Practices:**
- Subject line: Keep under 50 chars for mobile
- Body: Include clear CTA (call-to-action)
- Include business name and contact info in footer
- Include unsubscribe link (auto-added by system)

---

#### 9. `src/components/admin/marketing/VariableInserter.tsx`

**Purpose:** Button group for inserting message variables.

**Available Variables:**
- `{customer_name}` - Customer's full name
- `{first_name}` - Customer's first name
- `{pet_name}` - Primary pet's name (or first pet)
- `{booking_link}` - Link to booking page with tracking
- `{business_name}` - "The Puppy Day"
- `{business_phone}` - (657) 252-2903

**DaisyUI Components:**
- Button: `btn btn-outline btn-sm gap-1`
- Tooltip: `tooltip` directive

**Layout:**
```tsx
<div className="flex flex-wrap gap-2 mb-3">
  <span className="label-text text-sm">Insert Variable:</span>
  <button
    className="btn btn-outline btn-xs"
    onClick={() => onInsert('{customer_name}')}
  >
    {'{customer_name}'}
  </button>
  <button
    className="btn btn-outline btn-xs"
    onClick={() => onInsert('{pet_name}')}
  >
    {'{pet_name}'}
  </button>
  <button
    className="btn btn-outline btn-xs"
    onClick={() => onInsert('{booking_link}')}
  >
    {'{booking_link}'}
  </button>
</div>
```

**Functionality:**
- `onInsert(variable: string)` callback inserts variable at cursor position
- Use textarea ref to insert at cursor position (not just append)

**Preview Substitution:**
Sample data for preview:
```typescript
const sampleData = {
  customer_name: "Sarah Johnson",
  first_name: "Sarah",
  pet_name: "Max",
  booking_link: "https://thepuppyday.com/booking?ref=campaign",
  business_name: "The Puppy Day",
  business_phone: "(657) 252-2903"
};
```

---

## Task 0044: Scheduling and A/B Test Options

### Files to Create

#### 10. `src/components/admin/marketing/ScheduleSection.tsx`

**Purpose:** Step 4 component for scheduling campaigns and configuring A/B tests.

**Key Features:**
- Send timing: Send Now vs Schedule Later
- Date/time picker for scheduled sends
- Recurring configuration (if campaign type is recurring)
- A/B test toggle and configuration
- Review summary before submission

**DaisyUI Components:**
- Radio: `radio` for Send Now/Schedule
- Input: `input input-bordered` type="datetime-local"
- Card: `card bg-base-200` for A/B test config
- Toggle: `toggle toggle-primary`

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Schedule & Options                          │
├─────────────────────────────────────────────┤
│ Send Timing:                                │
│  ( ) Send Now                               │
│  (•) Schedule for Later                     │
│      [Date/Time Picker]                     │
│                                             │
│ [If recurring type]:                        │
│  Frequency: [Daily ▼] [Weekly] [Monthly]   │
│                                             │
│ ─────────────────────────────────────────   │
│                                             │
│ A/B Testing: [Toggle OFF]                  │
│                                             │
│ [If A/B enabled - ABTestToggle component]  │
└─────────────────────────────────────────────┘
```

**Send Timing Options:**

**Send Now:**
- Campaign status will be set to 'scheduled'
- Will be sent immediately when modal submits
- scheduled_at set to current timestamp

**Schedule Later:**
- Date/time picker (datetime-local input)
- Validate date is in the future
- Campaign status will be 'scheduled'
- Cron job will pick up and send at scheduled time

**Recurring Config (if type='recurring'):**
```typescript
interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  time: string; // HH:MM format
}
```

**DaisyUI Components:**
- Select: `select select-bordered` for frequency
- Input: `input input-bordered input-sm` for day/time

---

#### 11. `src/components/admin/marketing/ABTestToggle.tsx`

**Purpose:** A/B test configuration component with variant editors.

**Key Features:**
- Toggle to enable/disable A/B testing
- Duplicate message composers for Variant A and Variant B
- Split percentage slider (default 50/50)
- Visual comparison of both variants
- Preview both variants side-by-side

**DaisyUI Components:**
- Toggle: `toggle toggle-primary`
- Range: `range range-primary` for split percentage
- Card: `card bg-white` for each variant
- Badge: `badge badge-info` for variant labels

**Layout When Enabled:**
```
┌─────────────────────────────────────────────┐
│ A/B Test Configuration                      │
├─────────────────────────────────────────────┤
│ Split Traffic:                              │
│  Variant A [====●====] Variant B            │
│     50%       50%                           │
│                                             │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ Variant A        │ │ Variant B        │ │
│ │ [Message fields] │ │ [Message fields] │ │
│ │                  │ │                  │ │
│ └──────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────┘
```

**A/B Test Data Structure:**
```typescript
interface ABTestConfig {
  enabled: boolean;
  variant_a: MessageContent;
  variant_b: MessageContent;
  split_percentage: number; // 0-100 for Variant A
}
```

**Split Percentage:**
- Range slider: 0-100 (represents % for Variant A)
- Variant B gets remaining percentage (100 - split_percentage)
- Default: 50/50
- Show visual labels: "50% - 50%"

**Variant Editors:**
- Each variant has its own MessageContent fields
- Copy from main message as starting point
- Independent editing
- Preview both side-by-side

**A/B Test Notes:**
- Explain that traffic will be randomly split
- Winner determined by click-through rate and conversion
- Results available in campaign performance analytics

---

## Task 0045: Campaign Template Presets

### Files to Create

#### 12. `src/components/admin/marketing/TemplateSelector.tsx`

**Purpose:** Optional "Step 0" template selection screen before type selection.

**Key Features:**
- Grid of pre-made campaign templates
- "Start from Scratch" option
- Template preview cards with icon, name, description
- Selecting template pre-fills form with segment criteria and message content
- Skip this step with "Start from Scratch"

**DaisyUI Components:**
- Card: `card bg-white shadow-md hover:shadow-lg cursor-pointer`
- Badge: `badge badge-primary` for template tags
- Button: `btn btn-ghost` for "Start from Scratch"

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Choose a Template (Optional)                │
├─────────────────────────────────────────────┤
│ Get started faster with a pre-made template │
│                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Welcome  │ │ Win-back │ │ Birthday │    │
│ │ New      │ │ Inactive │ │          │    │
│ └──────────┘ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐                 │
│ │ Seasonal │ │ Renewal  │                 │
│ │ Promo    │ │ Reminder │                 │
│ └──────────┘ └──────────┘                 │
│                                             │
│         [Start from Scratch →]              │
└─────────────────────────────────────────────┘
```

---

#### 13. `src/lib/admin/campaign-templates.ts`

**Purpose:** Define campaign template presets with pre-filled content.

**Template Structure:**
```typescript
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  tags: string[];
  type: CampaignType;
  channel: CampaignChannel;
  segment_criteria: SegmentCriteria;
  message_content: MessageContent;
}
```

**Pre-Made Templates:**

### Template 1: Welcome New Customers
```typescript
{
  id: 'welcome-new-customers',
  name: 'Welcome New Customers',
  description: 'Greet customers who just had their first visit',
  icon: 'UserPlus',
  tags: ['welcome', 'onboarding'],
  type: 'one_time',
  channel: 'both',
  segment_criteria: {
    min_visits: 1,
    max_visits: 1,
    last_visit_days: 7
  },
  message_content: {
    sms_body: 'Hi {first_name}! Thank you for choosing The Puppy Day for {pet_name}\'s grooming. We hope you loved the experience! Book again: {booking_link}',
    email_subject: 'Welcome to The Puppy Day Family! 🐾',
    email_body: 'Hi {customer_name},\n\nThank you for trusting us with {pet_name}\'s grooming! We hope they\'re looking and feeling their best.\n\nAs a thank you, enjoy 10% off your next visit when you book within the next 30 days.\n\nBook now: {booking_link}\n\nWarm regards,\nThe Puppy Day Team'
  }
}
```

### Template 2: Win-Back Inactive Customers
```typescript
{
  id: 'win-back-inactive',
  name: 'Win-Back Inactive (60+ Days)',
  description: 'Re-engage customers who haven\'t visited recently',
  icon: 'Heart',
  tags: ['retention', 'win-back'],
  type: 'one_time',
  channel: 'both',
  segment_criteria: {
    last_visit_days: 60,
    min_visits: 1,
    has_upcoming_appointment: false
  },
  message_content: {
    sms_body: 'We miss {pet_name}! It\'s been a while since your last grooming. Book now and get 15% off: {booking_link}',
    email_subject: 'We Miss {pet_name}! Come Back for 15% Off',
    email_body: 'Hi {customer_name},\n\nIt\'s been over 60 days since we last saw {pet_name}, and we miss them!\n\nWe\'d love to welcome you back. Book your next grooming appointment and enjoy 15% off.\n\nBook now: {booking_link}\n\nWe look forward to seeing {pet_name} soon!\n\nThe Puppy Day Team'
  }
}
```

### Template 3: Birthday/Anniversary
```typescript
{
  id: 'birthday-celebration',
  name: 'Birthday/Anniversary Celebration',
  description: 'Celebrate customer or pet milestones',
  icon: 'PartyPopper',
  tags: ['celebration', 'loyalty'],
  type: 'recurring',
  channel: 'both',
  segment_criteria: {
    min_visits: 2
  },
  message_content: {
    sms_body: '🎉 Happy Birthday {pet_name}! Celebrate with a free birthday bandana on your next visit. Book now: {booking_link}',
    email_subject: '🎂 Happy Birthday {pet_name}!',
    email_body: 'Hi {customer_name},\n\nIt\'s {pet_name}\'s special day! 🎉\n\nCelebrate with us and receive a FREE birthday bandana and photo session at your next grooming appointment.\n\nBook now: {booking_link}\n\nWishing {pet_name} the best birthday ever!\n\nThe Puppy Day Team'
  }
}
```

### Template 4: Seasonal Promotions
```typescript
{
  id: 'seasonal-promotion',
  name: 'Seasonal Promotions',
  description: 'Holiday or seasonal special offers',
  icon: 'Sparkles',
  tags: ['promotion', 'seasonal'],
  type: 'one_time',
  channel: 'both',
  segment_criteria: {
    min_visits: 1
  },
  message_content: {
    sms_body: '🌸 Spring into savings! Get 20% off premium grooming this month. Book now: {booking_link}',
    email_subject: '🌸 Spring Grooming Special - 20% Off Premium Services',
    email_body: 'Hi {customer_name},\n\nSpring is here, and {pet_name} deserves to look their best!\n\nThis month only, enjoy 20% off all premium grooming services. Perfect for shedding season!\n\nBook now: {booking_link}\n\nOffer valid through [end date].\n\nThe Puppy Day Team'
  }
}
```

### Template 5: Membership Renewal Reminder
```typescript
{
  id: 'membership-renewal',
  name: 'Membership Renewal Reminder',
  description: 'Remind members to renew before expiration',
  icon: 'CreditCard',
  tags: ['membership', 'reminder'],
  type: 'recurring',
  channel: 'both',
  segment_criteria: {
    has_membership: true
  },
  message_content: {
    sms_body: 'Hi {first_name}, your Puppy Day membership renews soon! Don\'t lose your benefits. Renew now: {booking_link}',
    email_subject: 'Your Membership Renews Soon - Keep Your Benefits!',
    email_body: 'Hi {customer_name},\n\nYour Puppy Day membership is up for renewal soon.\n\nDon\'t lose access to exclusive perks:\n• Priority booking\n• 10% off all services\n• Free add-ons\n\nRenew your membership today: {booking_link}\n\nThank you for being a valued member!\n\nThe Puppy Day Team'
  }
}
```

**Export:**
```typescript
export const campaignTemplates: CampaignTemplate[] = [
  welcomeNewCustomers,
  winBackInactive,
  birthdayCelebration,
  seasonalPromotion,
  membershipRenewal
];
```

---

## Integration with Existing Code

### Update `src/components/admin/marketing/CampaignList.tsx`

**Change Required:**
Replace the `handleCreateCampaign` function:

```typescript
// BEFORE:
const handleCreateCampaign = () => {
  toast.info('Create Campaign', {
    description: 'Campaign creation form will be implemented in a future task.',
  });
};

// AFTER:
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

const handleCreateCampaign = () => {
  setIsCreateModalOpen(true);
};

const handleCreateSuccess = () => {
  setIsCreateModalOpen(false);
  fetchCampaigns(); // Refresh list
  toast.success('Campaign created successfully!');
};

// Add to JSX:
<CreateCampaignModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSuccess={handleCreateSuccess}
/>
```

---

## Custom Hook: useCreateCampaign

### File: `src/hooks/admin/use-create-campaign.ts`

**Purpose:** Custom hook to manage campaign creation API call and validation.

```typescript
import { useState } from 'react';
import type { CreateCampaignInput, MarketingCampaign } from '@/types/marketing';

export function useCreateCampaign() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = async (
    input: CreateCampaignInput
  ): Promise<MarketingCampaign | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const campaign: MarketingCampaign = await response.json();
      return campaign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCampaign,
    isLoading,
    error,
  };
}
```

**Usage in CreateCampaignModal:**
```typescript
const { createCampaign, isLoading, error } = useCreateCampaign();

const handleSubmit = async () => {
  const campaign = await createCampaign(formData);
  if (campaign) {
    onSuccess();
  } else {
    toast.error('Failed to create campaign', {
      description: error || 'Please try again'
    });
  }
};
```

---

## Validation Logic

### File: `src/lib/admin/campaign-validation.ts`

**Purpose:** Centralized validation functions for campaign creation.

```typescript
import type { CampaignFormData } from '@/components/admin/marketing/CreateCampaignModal';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate Step 1: Type Selection
 */
export function validateStep1(data: Partial<CampaignFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Campaign name is required' });
  }

  if (data.name && data.name.length > 100) {
    errors.push({ field: 'name', message: 'Campaign name must be 100 characters or less' });
  }

  if (!data.type) {
    errors.push({ field: 'type', message: 'Campaign type is required' });
  }

  return errors;
}

/**
 * Validate Step 2: Segmentation
 */
export function validateStep2(data: Partial<CampaignFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.segment_criteria) {
    errors.push({ field: 'segment_criteria', message: 'Segment criteria is required' });
    return errors;
  }

  // Check if at least one filter is set
  const hasFilters = Object.values(data.segment_criteria).some(
    (value) => value !== undefined && value !== null
  );

  if (!hasFilters) {
    errors.push({
      field: 'segment_criteria',
      message: 'At least one segment filter must be selected'
    });
  }

  return errors;
}

/**
 * Validate Step 3: Message Composition
 */
export function validateStep3(data: Partial<CampaignFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.channel) {
    errors.push({ field: 'channel', message: 'Communication channel is required' });
    return errors;
  }

  if (!data.message_content) {
    errors.push({ field: 'message_content', message: 'Message content is required' });
    return errors;
  }

  const { channel, message_content } = data;

  // Validate SMS content
  if (channel === 'sms' || channel === 'both') {
    if (!message_content.sms_body || message_content.sms_body.trim().length === 0) {
      errors.push({ field: 'sms_body', message: 'SMS message is required' });
    }

    if (message_content.sms_body && message_content.sms_body.length > 306) {
      errors.push({ field: 'sms_body', message: 'SMS message is too long (max 306 characters)' });
    }
  }

  // Validate Email content
  if (channel === 'email' || channel === 'both') {
    if (!message_content.email_subject || message_content.email_subject.trim().length === 0) {
      errors.push({ field: 'email_subject', message: 'Email subject is required' });
    }

    if (!message_content.email_body || message_content.email_body.trim().length === 0) {
      errors.push({ field: 'email_body', message: 'Email body is required' });
    }

    if (message_content.email_subject && message_content.email_subject.length > 78) {
      errors.push({
        field: 'email_subject',
        message: 'Email subject is too long (max 78 characters)'
      });
    }
  }

  return errors;
}

/**
 * Validate Step 4: Scheduling
 */
export function validateStep4(data: Partial<CampaignFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // If scheduled_at is provided, validate it's in the future
  if (data.scheduled_at) {
    const scheduledDate = new Date(data.scheduled_at);
    const now = new Date();

    if (scheduledDate <= now) {
      errors.push({
        field: 'scheduled_at',
        message: 'Scheduled date must be in the future'
      });
    }
  }

  // Validate A/B test config if enabled
  if (data.ab_test_config?.enabled) {
    const { variant_a, variant_b, split_percentage } = data.ab_test_config;

    if (!variant_a || !variant_b) {
      errors.push({
        field: 'ab_test_config',
        message: 'Both variants are required for A/B testing'
      });
    }

    if (split_percentage < 0 || split_percentage > 100) {
      errors.push({
        field: 'split_percentage',
        message: 'Split percentage must be between 0 and 100'
      });
    }
  }

  return errors;
}

/**
 * Validate entire campaign before submission
 */
export function validateCampaign(data: CampaignFormData): ValidationError[] {
  return [
    ...validateStep1(data),
    ...validateStep2(data),
    ...validateStep3(data),
    ...validateStep4(data),
  ];
}
```

---

## Component Hierarchy

```
CreateCampaignModal (Main wrapper)
├── TemplateSelector (Optional Step 0)
│   └── Template cards
│
├── Step 1: CampaignTypeSelector
│   ├── Name input
│   └── Type selection cards
│
├── Step 2: SegmentBuilder
│   ├── SegmentFilters
│   │   ├── Last visit input
│   │   ├── Service multi-select
│   │   ├── Breed multi-select
│   │   ├── Membership radio
│   │   ├── Min visits input
│   │   ├── Min spend input
│   │   └── Upcoming appointment radio
│   └── Audience preview card
│
├── Step 3: MessageComposer
│   ├── Channel tabs
│   ├── SMSEditor (conditional)
│   │   ├── VariableInserter
│   │   └── SMS textarea
│   ├── EmailEditor (conditional)
│   │   ├── VariableInserter
│   │   ├── Subject input
│   │   └── Body textarea
│   └── Preview panel
│
└── Step 4: ScheduleSection
    ├── Send timing radio
    ├── Date/time picker
    ├── Recurring config (if recurring)
    └── ABTestToggle
        ├── Split slider
        ├── Variant A editor
        └── Variant B editor
```

---

## State Flow

### Initial State (Empty Form)
```typescript
const initialFormData: CampaignFormData = {
  name: '',
  type: 'one_time',
  segment_criteria: {},
  channel: 'both',
  message_content: {
    sms_body: '',
    email_subject: '',
    email_body: ''
  },
  scheduled_at: undefined,
  ab_test_config: {
    enabled: false,
    variant_a: { sms_body: '', email_subject: '', email_body: '' },
    variant_b: { sms_body: '', email_subject: '', email_body: '' },
    split_percentage: 50
  }
};
```

### Template Selection Updates State
When user selects a template, merge template data into form:
```typescript
const handleTemplateSelect = (template: CampaignTemplate) => {
  setFormData({
    ...formData,
    name: template.name,
    type: template.type,
    channel: template.channel,
    segment_criteria: template.segment_criteria,
    message_content: template.message_content
  });
  setCurrentStep(1); // Skip to step 1
};
```

### Step Navigation
```typescript
const handleNext = () => {
  // Validate current step
  const errors = validateCurrentStep();
  if (errors.length > 0) {
    showValidationErrors(errors);
    return;
  }

  // Move to next step
  setCurrentStep(currentStep + 1);
};

const handlePrevious = () => {
  setCurrentStep(currentStep - 1);
};
```

### Final Submission
```typescript
const handleSubmit = async () => {
  // Validate entire form
  const errors = validateCampaign(formData);
  if (errors.length > 0) {
    showValidationErrors(errors);
    return;
  }

  // Convert to API format
  const input: CreateCampaignInput = {
    name: formData.name,
    type: formData.type,
    channel: formData.channel,
    segment_criteria: formData.segment_criteria,
    message_content: formData.message_content,
    ab_test_config: formData.ab_test_config?.enabled
      ? formData.ab_test_config
      : undefined,
    scheduled_at: formData.scheduled_at || new Date().toISOString()
  };

  // Submit via hook
  const campaign = await createCampaign(input);
  if (campaign) {
    onSuccess();
  }
};
```

---

## Progress Indicator

### DaisyUI Steps Component

```tsx
<ul className="steps steps-horizontal w-full mb-8">
  <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>
    Type
  </li>
  <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>
    Audience
  </li>
  <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>
    Message
  </li>
  <li className={`step ${currentStep >= 4 ? 'step-primary' : ''}`}>
    Schedule
  </li>
</ul>
```

**Visual:**
```
[Type] → [Audience] → [Message] → [Schedule]
  ●  →     ○     →      ○     →      ○       (Step 1)
  ●  →     ●     →      ○     →      ○       (Step 2)
  ●  →     ●     →      ●     →      ○       (Step 3)
  ●  →     ●     →      ●     →      ●       (Step 4)
```

---

## Error Handling

### Validation Errors
- Show inline error messages below invalid fields
- Use DaisyUI `label-text-alt text-error` for error text
- Add `input-error` class to invalid inputs
- Prevent step progression until errors are fixed

### API Errors
- Display toast notification on API failure
- Show specific error message from API response
- Allow user to retry submission
- Don't close modal on error

### Empty States
- Show helpful message when segment preview returns 0 customers
- Suggest adjusting filters
- Prevent submission if audience is empty

---

## Responsive Design

### Mobile (< 768px)
- Modal takes full screen: `modal-bottom sm:modal-middle`
- Single column layout for all forms
- Stack A/B test variants vertically
- Collapsible sections for long forms

### Tablet (768px - 1024px)
- Modal width: `max-w-3xl`
- 2-column grid for segment filters
- Side-by-side A/B variants

### Desktop (> 1024px)
- Modal width: `max-w-4xl`
- 2-column grid for segment filters
- Side-by-side message editor + preview
- Side-by-side A/B variants

---

## Accessibility

### Keyboard Navigation
- Tab order follows logical flow
- Enter key submits current step
- Escape key closes modal (with confirmation)
- Arrow keys navigate between type selection cards

### Screen Readers
- Proper ARIA labels on all form controls
- `aria-current="step"` on progress indicator
- `aria-live="polite"` for audience preview updates
- Clear error announcements

### Focus Management
- Focus first input when modal opens
- Focus first error field when validation fails
- Return focus to trigger button when modal closes

---

## Loading States

### Audience Preview Loading
```tsx
{isLoadingPreview && (
  <div className="flex items-center gap-2 text-gray-600">
    <span className="loading loading-spinner loading-sm"></span>
    <span>Loading audience preview...</span>
  </div>
)}
```

### Submit Loading
```tsx
<button
  className="btn btn-primary"
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <span className="loading loading-spinner loading-sm"></span>
      Creating...
    </>
  ) : (
    'Create Campaign'
  )}
</button>
```

---

## Success Feedback

### Toast Notification
```typescript
toast.success('Campaign created successfully!', {
  description: `"${campaign.name}" is now ${campaign.scheduled_at ? 'scheduled' : 'ready to send'}`
});
```

### Modal Close Animation
- Fade out animation (DaisyUI default)
- Clear form data after close
- Refresh campaign list in parent component

---

## Important Implementation Notes

### 1. DaisyUI Modal Pattern
Use native `<dialog>` element with DaisyUI classes:
```tsx
<dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
  <div className="modal-box max-w-4xl">
    {/* Content */}
  </div>
  <form method="dialog" className="modal-backdrop">
    <button onClick={onClose}>close</button>
  </form>
</dialog>
```

### 2. Date/Time Input
Use native `input type="datetime-local"`:
```tsx
<input
  type="datetime-local"
  className="input input-bordered"
  value={scheduledAt}
  onChange={(e) => setScheduledAt(e.target.value)}
  min={new Date().toISOString().slice(0, 16)}
/>
```

### 3. Multi-Select Implementation
For service and breed filters, use DaisyUI dropdown with checkboxes:
```tsx
<div className="dropdown">
  <label tabIndex={0} className="btn btn-outline">
    Services ({selectedServices.length})
  </label>
  <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-white rounded-box w-64">
    {services.map(service => (
      <li key={service.id}>
        <label className="label cursor-pointer">
          <span className="label-text">{service.name}</span>
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={selectedServices.includes(service.id)}
            onChange={() => toggleService(service.id)}
          />
        </label>
      </li>
    ))}
  </ul>
</div>
```

### 4. Variable Insertion at Cursor
Use textarea ref to insert at cursor position:
```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null);

const insertVariable = (variable: string) => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const newText = text.substring(0, start) + variable + text.substring(end);
  onChange(newText);

  // Set cursor after inserted variable
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    textarea.focus();
  }, 0);
};
```

### 5. Debounced Audience Preview
Use debounce for real-time preview:
```typescript
import { useEffect, useCallback } from 'react';

const debouncedFetchPreview = useCallback(
  debounce(async (criteria: SegmentCriteria) => {
    setIsLoadingPreview(true);
    const response = await fetch('/api/admin/campaigns/segment-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segment_criteria: criteria })
    });
    const data = await response.json();
    setPreview(data);
    setIsLoadingPreview(false);
  }, 500),
  []
);

useEffect(() => {
  debouncedFetchPreview(segmentCriteria);
}, [segmentCriteria, debouncedFetchPreview]);
```

Need to install `lodash.debounce` or implement simple debounce:
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### 6. Confirm Before Close
Prevent accidental data loss:
```typescript
const handleClose = () => {
  if (hasUnsavedChanges()) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
  }
  onClose();
  resetForm();
};
```

### 7. Mock Store Integration
For segment preview API in mock mode:
```typescript
// In segment-preview/route.ts
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
  const { getMockStore } = await import('@/mocks/supabase/store');
  const store = getMockStore();

  let users = store.select('users', {
    where: { role: 'customer' }
  });

  // Apply filters
  if (criteria.last_visit_days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.last_visit_days);

    users = users.filter(user => {
      const appointments = store.select('appointments', {
        where: { customer_id: user.id, status: 'completed' }
      });
      const lastVisit = appointments[0]?.scheduled_at;
      return lastVisit && new Date(lastVisit) >= cutoffDate;
    });
  }

  // ... more filters

  return NextResponse.json({
    total_customers: users.length,
    preview: users.slice(0, 5).map(/* ... */)
  });
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Template selection pre-fills form correctly
- [ ] "Start from Scratch" skips template step
- [ ] Step validation prevents progression with errors
- [ ] Audience preview updates in real-time
- [ ] Variable insertion works at cursor position
- [ ] SMS character counter updates correctly
- [ ] A/B test toggle shows/hides variant editors
- [ ] Date/time picker only allows future dates
- [ ] Submit creates campaign and closes modal
- [ ] Success toast appears after creation
- [ ] Campaign list refreshes after creation
- [ ] Modal closes with confirmation if unsaved changes
- [ ] All buttons have loading states
- [ ] Error messages display correctly

### Responsive Testing
- [ ] Mobile: Modal is full screen
- [ ] Mobile: Forms are single column
- [ ] Tablet: Forms use 2-column grid
- [ ] Desktop: Preview panels visible side-by-side

### Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces steps and errors
- [ ] Focus management works correctly
- [ ] All form controls have labels

---

## Files Summary

### New Files to Create (13 files)

1. **Components (11 files)**
   - `src/components/admin/marketing/CreateCampaignModal.tsx` - Main modal wrapper
   - `src/components/admin/marketing/CampaignTypeSelector.tsx` - Step 1
   - `src/components/admin/marketing/SegmentBuilder.tsx` - Step 2 wrapper
   - `src/components/admin/marketing/SegmentFilters.tsx` - Step 2 filters
   - `src/components/admin/marketing/MessageComposer.tsx` - Step 3 wrapper
   - `src/components/admin/marketing/SMSEditor.tsx` - SMS editor
   - `src/components/admin/marketing/EmailEditor.tsx` - Email editor
   - `src/components/admin/marketing/VariableInserter.tsx` - Variable buttons
   - `src/components/admin/marketing/ScheduleSection.tsx` - Step 4 wrapper
   - `src/components/admin/marketing/ABTestToggle.tsx` - A/B test controls
   - `src/components/admin/marketing/TemplateSelector.tsx` - Template selection

2. **API (1 file)**
   - `src/app/api/admin/campaigns/segment-preview/route.ts` - Segment preview endpoint

3. **Library (2 files)**
   - `src/lib/admin/campaign-templates.ts` - Template definitions
   - `src/lib/admin/campaign-validation.ts` - Validation functions

4. **Hooks (1 file)**
   - `src/hooks/admin/use-create-campaign.ts` - Campaign creation hook

### Files to Modify (1 file)

1. `src/components/admin/marketing/CampaignList.tsx`
   - Add modal state
   - Import and render CreateCampaignModal
   - Update handleCreateCampaign to open modal
   - Add handleCreateSuccess callback

---

## Design System Compliance

### Colors
- **Primary Buttons:** `#434E54` (Charcoal)
- **Primary Hover:** `#363F44`
- **Background:** `#F8EEE5` (Warm cream)
- **Cards:** `#FFFFFF` (White)
- **Secondary Background:** `#EAE0D5` (Lighter cream)
- **Text Primary:** `#434E54`
- **Text Secondary:** `#6B7280`

### DaisyUI Classes
- **Buttons:** `btn btn-primary`, `btn btn-ghost`, `btn btn-outline`
- **Inputs:** `input input-bordered`, `textarea textarea-bordered`
- **Cards:** `card bg-white shadow-md`
- **Badges:** `badge badge-info`, `badge badge-warning`
- **Loading:** `loading loading-spinner loading-sm`
- **Modal:** `modal modal-open`, `modal-box`
- **Steps:** `steps steps-horizontal`, `step step-primary`

### Typography
- **Headings:** `text-2xl font-bold text-[#434E54]`
- **Labels:** `label-text font-semibold`
- **Body:** `text-sm text-[#6B7280]`

### Spacing
- **Modal Padding:** `p-6`
- **Section Gaps:** `space-y-6`
- **Form Gaps:** `space-y-4`
- **Button Gaps:** `gap-2`

### Shadows
- **Cards:** `shadow-md` default, `shadow-lg` on hover
- **Dropdowns:** `shadow-lg`

### Borders
- **Inputs:** `border-gray-200` (subtle)
- **Cards:** No border or very thin `border border-gray-100`

### Rounded Corners
- **Buttons:** `rounded-lg` (0.5rem)
- **Cards:** `rounded-xl` (0.75rem)
- **Modal:** `rounded-xl`

---

## Next Steps After Implementation

1. **Test Campaign Creation Flow**
   - Create campaigns with different templates
   - Test all validation scenarios
   - Verify audience preview accuracy
   - Test A/B test configuration

2. **Implement Campaign Sending**
   - Build campaign execution logic (Task 9.6 from tasks.md)
   - Create cron job for scheduled campaigns
   - Implement background queue for sending

3. **Add Campaign Analytics**
   - Track campaign performance (Task 9.7 from tasks.md)
   - Show open rates, click rates, conversions
   - A/B test winner determination

4. **Build Campaign Management**
   - Edit existing campaigns
   - Duplicate campaigns
   - Delete campaigns
   - Pause/resume campaigns

---

## Conclusion

This implementation plan provides a complete roadmap for building the campaign creation modal flow for The Puppy Day. The multi-step wizard guides admins through type selection, audience segmentation, message composition, and scheduling with optional A/B testing and template presets.

**Key Highlights:**
- ✅ DaisyUI-first component design
- ✅ Clean & Elegant Professional aesthetic
- ✅ Comprehensive validation at each step
- ✅ Real-time audience preview
- ✅ Template system for faster campaign creation
- ✅ A/B testing capabilities
- ✅ Responsive and accessible
- ✅ Mock mode support for development

The implementation follows all existing patterns from the codebase and integrates seamlessly with the existing CampaignBuilder page and API.
