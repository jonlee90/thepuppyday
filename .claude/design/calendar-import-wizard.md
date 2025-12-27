# Calendar Import Wizard - Design Specification

## Overview

The Calendar Import Wizard is a multi-step modal interface that guides administrators through importing Google Calendar events into The Puppy Day appointment system. This wizard transforms unstructured calendar events into fully mapped appointments with customers, pets, services, and addons.

**Purpose**: Enable seamless migration of existing calendar bookings into the structured appointment system, reducing manual data entry and preventing scheduling conflicts.

**User Personas**:
- **Primary**: Business owner/admin who previously used Google Calendar for bookings
- **Use Case**: One-time migration or periodic bulk imports of appointments scheduled externally

## User Flow

### Primary Happy Path

```
1. Admin navigates to Admin → Calendar Integration
   ↓
2. Sees "Import from Calendar" button (enabled when calendar connected)
   ↓
3. Clicks button → Modal opens with Step 1: Date Range Selection
   ↓
4. Selects date range (default: next 30 days) → Clicks "Preview Events"
   ↓
5. System fetches events → Shows Step 2: Event Selection
   ↓
6. Admin reviews events, sees duplicate warnings, selects events to import
   ↓
7. Clicks "Continue to Mapping" → Step 3: Event Mapping Forms
   ↓
8. For each event: Select customer → Select pet → Select service → Add addons → Add notes
   ↓
9. Clicks "Review Import" → Step 4: Review & Confirm
   ↓
10. Reviews all appointments, sees warnings (past dates, duration mismatches)
    ↓
11. Clicks "Confirm Import" → Progress indicator shows creation
    ↓
12. Success message with summary: "X appointments created, Y skipped"
    ↓
13. Modal closes, calendar page refreshes to show new appointments
```

### Alternative Flows

**No Events Found**:
- Step 2 shows empty state: "No events found in this date range"
- CTA: "Try a different date range" → Return to Step 1

**Duplicate Detection**:
- Step 2 shows warning badge on events with potential duplicates
- User can deselect event or proceed with caution
- Review step shows duplicate warning again

**Validation Errors**:
- Step 3: Inline validation on each field (customer required, pet required, service required)
- Cannot proceed to Step 4 until all selected events have valid mappings

**Partial Success**:
- Some imports succeed, some fail
- Results screen shows: "5 of 8 appointments created. 3 failed."
- Display errors for failed imports with actionable messages

**Cancel Flow**:
- Any step: User clicks "Cancel" → Confirmation dialog
- "Are you sure? All selections will be lost."
- Confirm → Modal closes, no data saved

---

## Component Architecture

### Component Tree

```
ImportButton
  └─ ImportWizard (Modal)
      ├─ WizardHeader
      │   ├─ StepIndicator (1/4, 2/4, 3/4, 4/4)
      │   └─ CloseButton
      │
      ├─ WizardBody (conditional rendering based on currentStep)
      │   ├─ DateRangeStep (step === 1)
      │   │   ├─ DateRangePicker
      │   │   └─ ValidationMessage
      │   │
      │   ├─ EventSelectionStep (step === 2)
      │   │   ├─ LoadingState
      │   │   ├─ EmptyState
      │   │   └─ EventList
      │   │       └─ EventCard[] (checkbox, title, time, duplicate badge)
      │   │
      │   ├─ EventMappingStep (step === 3)
      │   │   └─ EventMappingForm[]
      │   │       ├─ EventHeader (event details)
      │   │       ├─ CustomerSelector (search/create)
      │   │       ├─ PetSelector (filtered by customer)
      │   │       ├─ ServiceSelector
      │   │       ├─ AddonSelector (multi-select)
      │   │       ├─ NotesInput
      │   │       └─ ValidationErrors
      │   │
      │   └─ ReviewStep (step === 4)
      │       ├─ ImportSummary
      │       ├─ AppointmentPreviewCard[]
      │       ├─ WarningList
      │       └─ ProgressIndicator (during import)
      │
      └─ WizardFooter
          ├─ BackButton (disabled on step 1)
          ├─ CancelButton
          └─ NextButton (text changes per step)
```

### State Management

```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  dateRange: {
    dateFrom: string; // ISO date
    dateTo: string;   // ISO date
  };
  preview: ImportPreview | null;
  selectedEventIds: Set<string>;
  mappings: Map<string, EventMapping>; // eventId → mapping
  isLoading: boolean;
  error: string | null;
  importResults: ImportResults | null;
}

interface EventMapping {
  eventId: string;
  customerId: string;
  petId: string;
  serviceId: string;
  addonIds: string[];
  notes: string;
  // Validation
  errors: {
    customer?: string;
    pet?: string;
    service?: string;
  };
}

interface ImportResults {
  successful: number;
  failed: number;
  errors: Array<{ eventId: string; message: string }>;
}
```

### Props Interfaces

```typescript
// ImportButton.tsx
interface ImportButtonProps {
  isConnected: boolean;
  onOpen: () => void;
}

// ImportWizard.tsx
interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (results: ImportResults) => void;
}

// DateRangeStep.tsx
interface DateRangeStepProps {
  dateFrom: string;
  dateTo: string;
  onChange: (field: 'dateFrom' | 'dateTo', value: string) => void;
  onNext: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// EventSelectionStep.tsx
interface EventSelectionStepProps {
  events: GoogleCalendarEvent[];
  duplicates: DuplicateMatch[];
  selectedEventIds: Set<string>;
  onToggleEvent: (eventId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// EventMappingForm.tsx
interface EventMappingFormProps {
  event: GoogleCalendarEvent;
  mapping: EventMapping;
  suggestions: ImportSuggestion | null;
  customers: Customer[];
  pets: Pet[];
  services: Service[];
  addons: Addon[];
  onChange: (field: keyof EventMapping, value: any) => void;
  onCreateCustomer: (name: string) => Promise<Customer>;
  onCreatePet: (customerId: string, name: string) => Promise<Pet>;
}

// ReviewStep.tsx
interface ReviewStepProps {
  mappings: EventMapping[];
  events: GoogleCalendarEvent[];
  isImporting: boolean;
  progress: { current: number; total: number } | null;
  onConfirm: () => Promise<void>;
}
```

---

## Step Flow Diagrams

### Step 1: Date Range Selection

```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│  ● ○ ○ ○  Step 1 of 4: Select Date Range       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Choose the date range to import events from    │
│  your connected Google Calendar.                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Start Date                               │ │
│  │  [Dec 26, 2025      ] 📅                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  End Date                                 │ │
│  │  [Jan 25, 2026      ] 📅                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ℹ️ Default range: Next 30 days                │
│                                                 │
├─────────────────────────────────────────────────┤
│                          [Cancel] [Preview →]   │
└─────────────────────────────────────────────────┘
```

**Interaction Notes**:
- Date pickers use native HTML5 date input (mobile-friendly)
- Validation: End date must be after start date
- Max range: 90 days (prevent API overload)
- "Preview" button triggers API call to `/api/admin/calendar/import/preview`

---

### Step 2: Event Selection

```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│  ○ ● ○ ○  Step 2 of 4: Select Events           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Found 12 events in your calendar               │
│  [Select All] [Deselect All]                    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ☑ Fluffy - Grooming Appointment           │ │
│  │   Wed, Jan 8 • 10:00 AM - 11:30 AM        │ │
│  │   ⚠️ Possible duplicate (Appt #1234)      │ │
│  │   💡 Suggested: Customer "Sarah J"         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ☐ Max - Bath & Nail Trim                  │ │
│  │   Thu, Jan 9 • 2:00 PM - 3:00 PM          │ │
│  │   💡 Suggested: Customer "Mike R"          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ☑ Bella - Full Grooming Service           │ │
│  │   Fri, Jan 10 • 9:00 AM - 11:00 AM        │ │
│  │   No suggestions                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Scroll for 9 more events...]                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  [← Back]              [Cancel] [Continue →]    │
└─────────────────────────────────────────────────┘
```

**Interaction Notes**:
- Checkboxes for multi-select
- Duplicate warning badge (amber) with tooltip showing duplicate details
- Suggestion badge (blue) shows AI-matched customer/pet
- Scroll container if >4 events (max-height: 400px)
- "Continue" disabled if no events selected

---

### Step 3: Event Mapping Forms

```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│  ○ ○ ● ○  Step 3 of 4: Map Appointments        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Configure details for each selected event      │
│  (Mapping 1 of 2)                               │
│                                                 │
│  ╔═══════════════════════════════════════════╗ │
│  ║ 📅 Wed, Jan 8 • 10:00 AM - 11:30 AM       ║ │
│  ║ Fluffy - Grooming Appointment             ║ │
│  ╚═══════════════════════════════════════════╝ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Customer *                               │ │
│  │  [Search or create customer...      ] 🔍 │ │
│  │  💡 Suggested: Sarah Johnson              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Pet *                                    │ │
│  │  [Select pet...                     ] ▾   │ │
│  │  (Select customer first)                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Service *                                │ │
│  │  [Select service...                 ] ▾   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Add-ons (optional)                       │ │
│  │  ☐ Nail Trim (+$15)                       │ │
│  │  ☐ Teeth Brushing (+$10)                  │ │
│  │  ☐ Flea Treatment (+$20)                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Notes (optional)                         │ │
│  │  [Add any special instructions...      ]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Next Event →]                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  [← Back]              [Cancel] [Review →]      │
└─────────────────────────────────────────────────┘
```

**Interaction Notes**:
- Customer selector: Autocomplete search with "Create New Customer" option
- Pet selector: Disabled until customer selected, then filters by customer
- Service selector: Dropdown of active services
- Addons: Checkboxes with prices displayed
- Navigation: "Next Event" cycles through selected events
- Validation: Red border + error message below field if invalid
- "Review" button disabled until all events have valid mappings

**Customer Search Behavior**:
- Type to search existing customers
- Shows dropdown with matches: "Sarah Johnson (555-1234)"
- "Create New Customer" option at bottom of dropdown
- Selecting "Create New" opens inline form: Name, Phone, Email

**Pet Creation Flow**:
- If customer selected but has no pets, show "No pets found. Create one?"
- Inline form: Pet Name, Breed (autocomplete), Weight

---

### Step 4: Review & Confirm

```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│  ○ ○ ○ ●  Step 4 of 4: Review & Confirm        │
├─────────────────────────────────────────────────┤
│                                                 │
│  📋 Import Summary                              │
│  • 2 appointments ready to import               │
│  • 1 warning detected                           │
│                                                 │
│  ⚠️ Warnings                                    │
│  • "Fluffy - Grooming" may be duplicate         │
│    (similar to Appt #1234 on Jan 8)             │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Appointment 1                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ 📅 Wed, Jan 8, 2026 • 10:00 AM            │ │
│  │ 👤 Sarah Johnson                          │ │
│  │ 🐕 Fluffy (Golden Retriever, 45 lbs)      │ │
│  │ ✂️ Premium Grooming Package ($120)        │ │
│  │ ➕ Nail Trim (+$15)                        │ │
│  │ 📝 Notes: Customer requested extra fluff  │ │
│  │                                            │ │
│  │ ⚠️ Possible duplicate                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Appointment 2                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ 📅 Fri, Jan 10, 2026 • 9:00 AM            │ │
│  │ 👤 Lisa Martinez                          │ │
│  │ 🐕 Bella (Poodle, 28 lbs)                 │ │
│  │ ✂️ Basic Grooming ($55)                   │ │
│  │ No addons                                  │ │
│  │ No notes                                   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  [← Back]        [Cancel] [Confirm Import ✓]   │
└─────────────────────────────────────────────────┘
```

**During Import (Progress State)**:
```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│           Creating appointments...              │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 50%  │
│                                                 │
│  1 of 2 appointments created                    │
│                                                 │
│  Please wait, do not close this window.         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Success State**:
```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│              ✅ Import Complete!                │
│                                                 │
│  Successfully created 2 appointments            │
│                                                 │
│  • Wed, Jan 8 - Sarah Johnson (Fluffy)          │
│  • Fri, Jan 10 - Lisa Martinez (Bella)          │
│                                                 │
│  These appointments are now visible in your     │
│  calendar and can be managed from the           │
│  Appointments page.                             │
│                                                 │
├─────────────────────────────────────────────────┤
│                               [Done]            │
└─────────────────────────────────────────────────┘
```

**Partial Success State**:
```
┌─────────────────────────────────────────────────┐
│  Import Calendar Events                    [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│          ⚠️ Import Partially Complete           │
│                                                 │
│  1 of 2 appointments created                    │
│                                                 │
│  ✅ Successfully imported:                      │
│  • Wed, Jan 8 - Sarah Johnson (Fluffy)          │
│                                                 │
│  ❌ Failed to import:                           │
│  • Fri, Jan 10 - Lisa Martinez (Bella)          │
│    Error: Time slot already booked              │
│                                                 │
│  You can retry failed imports from the          │
│  Import History page.                           │
│                                                 │
├─────────────────────────────────────────────────┤
│                               [Done]            │
└─────────────────────────────────────────────────┘
```

---

## UI Layouts (Detailed)

### Modal Container

**Desktop (1024px+)**:
- Modal width: 800px
- Max-height: 90vh
- Centered on screen with backdrop blur
- Border-radius: 20px (rounded-xl)
- Background: White (#FFFFFF)
- Shadow: Large soft shadow (0 20px 60px rgba(67, 78, 84, 0.15))

**Tablet (640px-1023px)**:
- Modal width: 90vw (max 700px)
- Max-height: 85vh
- Same styling as desktop

**Mobile (<640px)**:
- Full-screen modal (width: 100vw, height: 100vh)
- Border-radius: 0
- Fixed positioning
- Slide-up animation from bottom

### Header Component

```
Desktop/Tablet:
┌────────────────────────────────────────────────┐
│  Import Calendar Events                   [×]  │  ← 48px height
│                                                │
│  ● ○ ○ ○  Step X of 4: [Step Name]            │  ← 32px height
└────────────────────────────────────────────────┘
    ↑ 20px padding all sides

Mobile:
┌────────────────────────────────────────────────┐
│  [×]  Import Calendar Events                   │  ← 56px height
│                                                │
│  ● ○ ○ ○  Step X of 4                         │  ← Step name below
│  [Step Name]                                   │
└────────────────────────────────────────────────┘
    ↑ 16px padding
```

**Typography**:
- Title: 20px (text-xl), semibold, charcoal (#434E54)
- Step indicator: 14px (text-sm), medium, text-secondary (#6B7280)
- Step name: 16px (text-base), semibold, charcoal

**Step Indicator Design**:
- Filled circle (●): Current step (charcoal #434E54)
- Empty circle (○): Incomplete step (neutral #E5E5E5)
- Completed steps: Checkmark in circle (success green #6BCB77)

### Body Component (Scrollable)

```
Desktop:
┌────────────────────────────────────────────────┐
│  [Step-specific content]                       │
│                                                │  ← 24px padding
│  [Scrollable area]                             │  ← max-height: calc(90vh - 200px)
│                                                │
│  [More content...]                             │
└────────────────────────────────────────────────┘

Mobile:
┌────────────────────────────────────────────────┐
│  [Step-specific content]                       │
│                                                │  ← 16px padding
│  [Scrollable area]                             │  ← max-height: calc(100vh - 180px)
│                                                │
└────────────────────────────────────────────────┘
```

**Scrolling Behavior**:
- Smooth scroll (`scroll-behavior: smooth`)
- Fade gradient at top/bottom to indicate more content
- Scrollbar styled (thin, charcoal thumb)

### Footer Component

```
Desktop/Tablet:
┌────────────────────────────────────────────────┐
│  [← Back]              [Cancel] [Next →]       │  ← 64px height
└────────────────────────────────────────────────┘
    ↑ 20px padding, space-between layout

Mobile:
┌────────────────────────────────────────────────┐
│  [← Back]                                      │  ← 56px height
│  [Cancel]                          [Next →]    │  ← 56px height
└────────────────────────────────────────────────┘
    ↑ Stacked buttons, 12px gap
```

**Button Styles**:
- **Primary (Next/Confirm)**: Charcoal bg (#434E54), white text, rounded-lg, py-2.5 px-5
- **Secondary (Back)**: Ghost button, charcoal text, hover bg cream
- **Tertiary (Cancel)**: Ghost button, text-secondary, hover bg neutral-200

---

## Step-Specific Layouts

### Step 1: Date Range Selection

**Desktop Layout**:
```
┌──────────────────────────────────────────────────┐
│  Choose the date range to import events from     │  ← 16px body text
│  your connected Google Calendar.                 │
│                                                  │  ← 24px gap
│  ┌──────────────────────────────────────────┐   │
│  │  Start Date                              │   │  ← Label 14px
│  │  ┌────────────────────────┐ 📅          │   │  ← Input 44px height
│  │  │ Dec 26, 2025           │             │   │
│  │  └────────────────────────┘             │   │
│  └──────────────────────────────────────────┘   │
│                                                  │  ← 16px gap
│  ┌──────────────────────────────────────────┐   │
│  │  End Date                                │   │
│  │  ┌────────────────────────┐ 📅          │   │
│  │  │ Jan 25, 2026           │             │   │
│  │  └────────────────────────┘             │   │
│  └──────────────────────────────────────────┘   │
│                                                  │  ← 20px gap
│  ℹ️ Default range: Next 30 days                 │  ← Info badge
│  📊 Maximum range: 90 days                      │
└──────────────────────────────────────────────────┘
```

**Form Field Styling**:
- Container: White bg, border 1px #E5E5E5, rounded-lg, p-4
- Label: 14px, medium weight, text-secondary (#6B7280)
- Input: 44px height, 16px text, rounded-md, border charcoal on focus
- Icon: 20px, positioned absolute right, text-secondary

**Info Badge**:
- Background: Amber-50 (#FFF7ED)
- Border: 1px amber-200
- Text: 14px, amber-800
- Icon: ℹ️ lucide Info icon
- Padding: 12px, rounded-md

### Step 2: Event Selection

**Event Card Layout**:
```
┌────────────────────────────────────────────────┐
│  ☑ Fluffy - Grooming Appointment               │  ← Checkbox + Title (16px semibold)
│                                                │
│     Wed, Jan 8 • 10:00 AM - 11:30 AM (1.5h)   │  ← Date/Time (14px)
│                                                │
│     ⚠️ Possible duplicate (Appt #1234)        │  ← Warning badge
│     💡 Suggested: Customer "Sarah J"           │  ← Suggestion badge
│                                                │
│     "Grooming for golden retriever..."         │  ← Description preview (14px, italic)
└────────────────────────────────────────────────┘
     ↑ 16px padding, hover: bg-cream (#FFFBF7)
```

**Badge Design**:
- **Warning badge**: Amber-100 bg, amber-800 text, ⚠️ icon, rounded-full px-3 py-1
- **Suggestion badge**: Blue-100 bg, blue-800 text, 💡 icon, rounded-full px-3 py-1
- Typography: 13px, medium weight

**Bulk Actions**:
```
Desktop:
[Select All] [Deselect All]     3 events selected
     ↑ Ghost buttons              ↑ Counter (text-secondary)

Mobile (stacked):
[Select All]
[Deselect All]
3 events selected
```

**Empty State**:
```
┌────────────────────────────────────────────────┐
│                                                │
│              📅 No Events Found                │  ← Icon 48px
│                                                │
│     No calendar events found in this date      │  ← 16px text
│     range. Try selecting a different range.    │
│                                                │
│              [← Change Dates]                  │  ← Secondary button
│                                                │
└────────────────────────────────────────────────┘
```

### Step 3: Event Mapping Forms

**Event Header (Current Event Indicator)**:
```
╔════════════════════════════════════════════════╗
║ 📅 Wed, Jan 8, 2026 • 10:00 AM - 11:30 AM     ║  ← 16px text
║ Fluffy - Grooming Appointment                  ║  ← 18px semibold
╚════════════════════════════════════════════════╝
     ↑ Charcoal bg (#434E54), white text, 16px padding, rounded-lg
```

**Customer Selector (Autocomplete)**:
```
┌────────────────────────────────────────────────┐
│  Customer *                                    │  ← Label + required asterisk
│  ┌──────────────────────────────────────┐ 🔍  │
│  │ Search or create customer...         │     │  ← 44px input
│  └──────────────────────────────────────┘     │
│                                                │
│  💡 Suggested: Sarah Johnson                  │  ← Suggestion chip (clickable)
│                                                │
│  Dropdown (when typing):                       │
│  ┌──────────────────────────────────────────┐ │
│  │ Sarah Johnson (555-1234)              ✓ │ │  ← Match result
│  │ Sarah Miller (555-5678)                  │ │
│  │ ─────────────────────────────────────── │ │
│  │ + Create New Customer "Sara..."          │ │  ← Create action
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**Inline Customer Creation Form** (when "Create New Customer" clicked):
```
┌────────────────────────────────────────────────┐
│  Creating New Customer                         │
│                                                │
│  [Full Name*        ]                          │  ← 3 stacked inputs
│  [Phone Number*     ]                          │
│  [Email (optional)  ]                          │
│                                                │
│  [Cancel]  [Create Customer]                   │  ← Actions
└────────────────────────────────────────────────┘
     ↑ Cream bg (#F8EEE5), border, rounded-md, p-4
```

**Pet Selector (Conditional)**:
```
State 1 (No Customer Selected):
┌────────────────────────────────────────────────┐
│  Pet *                                         │
│  ┌──────────────────────────────────────┐ ▾   │
│  │ (Select customer first)              │     │  ← Disabled state
│  └──────────────────────────────────────┘     │
└────────────────────────────────────────────────┘
     ↑ Gray bg, gray text, cursor-not-allowed

State 2 (Customer Selected, Has Pets):
┌────────────────────────────────────────────────┐
│  Pet *                                         │
│  ┌──────────────────────────────────────┐ ▾   │
│  │ Select pet...                        │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  Dropdown:                                     │
│  ┌──────────────────────────────────────────┐ │
│  │ 🐕 Fluffy (Golden Retriever, 45 lbs)     │ │
│  │ 🐕 Max (Beagle, 22 lbs)                  │ │
│  │ ─────────────────────────────────────── │ │
│  │ + Create New Pet                         │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘

State 3 (Customer Has No Pets):
┌────────────────────────────────────────────────┐
│  Pet *                                         │
│  ┌──────────────────────────────────────────┐ │
│  │ ℹ️ No pets found for this customer       │ │
│  │                                            │ │
│  │ [+ Create New Pet]                        │ │  ← Primary action
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**Service Selector**:
```
┌────────────────────────────────────────────────┐
│  Service *                                     │
│  ┌──────────────────────────────────────┐ ▾   │
│  │ Select service...                    │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  Dropdown:                                     │
│  ┌──────────────────────────────────────────┐ │
│  │ ✂️ Basic Grooming                        │ │
│  │    Small: $40 • Medium: $55              │ │  ← Price by size
│  │ ✂️ Premium Grooming                      │ │
│  │    Small: $70 • Medium: $95              │ │
│  │ 🛁 Bath Only                             │ │
│  │    Small: $30 • Medium: $40              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ℹ️ Price will be determined by pet size      │  ← Helper text
└────────────────────────────────────────────────┘
```

**Addon Selector (Multi-select Checkboxes)**:
```
┌────────────────────────────────────────────────┐
│  Add-ons (optional)                            │
│                                                │
│  ☑ Nail Trim                          +$15     │  ← Checkbox + name + price
│  ☐ Teeth Brushing                     +$10     │
│  ☐ Flea Treatment                     +$20     │
│  ☐ Ear Cleaning                       +$8      │
│  ☐ Paw Balm Application               +$12     │
│                                                │
│  Subtotal: $15                                 │  ← Running total
└────────────────────────────────────────────────┘
     ↑ Each row: 12px padding, hover bg-cream, rounded-md
```

**Notes Input**:
```
┌────────────────────────────────────────────────┐
│  Notes (optional)                              │
│  ┌──────────────────────────────────────────┐ │
│  │ Add any special instructions or          │ │  ← Textarea, 80px height
│  │ preferences...                            │ │
│  │                                           │ │
│  └──────────────────────────────────────────┘ │
│  0 / 500 characters                            │  ← Character counter
└────────────────────────────────────────────────┘
```

**Validation Error State**:
```
┌────────────────────────────────────────────────┐
│  Customer *                                    │
│  ┌──────────────────────────────────────┐ 🔍  │
│  │ Search or create customer...         │     │
│  └──────────────────────────────────────┘     │  ← Red border (2px)
│  ❌ Please select or create a customer         │  ← Error message (red text, 14px)
└────────────────────────────────────────────────┘
```

**Navigation Between Events**:
```
Desktop:
Mapping 1 of 3                    [← Prev] [Next →]
     ↑ Counter                          ↑ Navigation buttons

Mobile:
Mapping 1 of 3
[← Previous Event]
[Next Event →]
     ↑ Stacked buttons, full-width
```

### Step 4: Review & Confirm

**Import Summary Card**:
```
┌────────────────────────────────────────────────┐
│  📋 Import Summary                             │  ← 18px semibold
│                                                │
│  • 3 appointments ready to import              │  ← Bullet list, 16px
│  • 1 warning detected                          │
│  • Estimated time: 10-15 seconds               │
└────────────────────────────────────────────────┘
     ↑ Cream bg (#F8EEE5), 16px padding, rounded-lg
```

**Warning Section** (conditional):
```
┌────────────────────────────────────────────────┐
│  ⚠️ Warnings                                   │  ← 16px semibold, amber text
│                                                │
│  • "Fluffy - Grooming" may be duplicate        │  ← 14px, bullet list
│    (similar to Appt #1234 on Jan 8)            │     ↑ Indented details
│                                                │
│  • "Max - Bath" is scheduled in the past       │
│    (Event date: Dec 20, 2025)                  │
└────────────────────────────────────────────────┘
     ↑ Amber-50 bg, amber-200 border, 16px padding, rounded-lg
```

**Appointment Preview Card**:
```
┌────────────────────────────────────────────────┐
│  Appointment 1                                 │  ← 14px, text-secondary
│                                                │
│  📅 Wed, Jan 8, 2026 • 10:00 AM - 11:30 AM    │  ← 16px, icon + text
│  👤 Sarah Johnson (555-1234)                  │
│  📧 sarah@email.com                           │
│  🐕 Fluffy (Golden Retriever, 45 lbs)         │
│  ✂️ Premium Grooming Package                  │  ← Service name
│     $120 (Medium size)                        │  ← Price + size
│  ➕ Add-ons:                                   │
│     • Nail Trim (+$15)                         │
│     • Teeth Brushing (+$10)                    │
│  💰 Total: $145                               │  ← Bold, larger text
│  📝 Notes: Customer requested extra fluff      │
│                                                │
│  ⚠️ Possible duplicate (Appt #1234)           │  ← Warning badge (if applicable)
└────────────────────────────────────────────────┘
     ↑ White bg, border, shadow-sm, 16px padding, rounded-lg
     Hover: shadow-md, y-translate -2px
```

**Icon Key**:
- 📅 Calendar - lucide `Calendar` icon
- 👤 User - lucide `User` icon
- 📧 Email - lucide `Mail` icon
- 🐕 Pet - lucide `Dog` icon (or paw print)
- ✂️ Service - lucide `Scissors` icon
- ➕ Addons - lucide `Plus` icon
- 💰 Total - lucide `DollarSign` icon
- 📝 Notes - lucide `FileText` icon

**Spacing Between Cards**:
- Gap: 16px
- Scroll container with fade gradient at bottom if >3 cards

---

## Interaction Design

### Navigation Flow

**Step Progression**:
```
Step 1 → Step 2 → Step 3 → Step 4 → Success
  ↑        ↑        ↑        ↑
  Back     Back     Back     Back
```

**Button State Changes**:
| Step | Back Button | Cancel Button | Next Button |
|------|-------------|---------------|-------------|
| 1    | Disabled (hidden) | Enabled | "Preview Events" (disabled if invalid dates) |
| 2    | Enabled "← Back" | Enabled | "Continue" (disabled if no events selected) |
| 3    | Enabled "← Back" | Enabled | "Review" (disabled if validation errors) |
| 4    | Enabled "← Back" | Enabled | "Confirm Import" (becomes "Importing..." during API call) |

**Cancel Confirmation Dialog**:
```
┌────────────────────────────────────────────────┐
│  ⚠️ Discard Import?                            │
│                                                │
│  All selected events and mappings will be      │
│  lost. This action cannot be undone.           │
│                                                │
│  [Go Back]           [Yes, Discard]            │
└────────────────────────────────────────────────┘
```

### Loading States

**Step 1 → Step 2 Transition** (Fetching Events):
```
┌────────────────────────────────────────────────┐
│                                                │
│          🔄 Fetching calendar events...        │  ← Spinner animation
│                                                │
│     This may take a few seconds depending      │
│     on the number of events.                   │
│                                                │
└────────────────────────────────────────────────┘
```

**Animation**: Spinner (lucide `Loader2` with `animate-spin`)

**Step 4 Import Progress**:
```
Progress Bar:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60%

Animation: Fill from left to right, smooth transition
Color: Charcoal (#434E54)
Height: 8px, rounded-full
Container: Neutral-200 bg
```

### Hover States

**Event Card (Step 2)**:
- Default: White bg, border neutral-300
- Hover: Cream bg (#FFFBF7), border charcoal-light, cursor pointer
- Transition: All 150ms ease

**Appointment Preview Card (Step 4)**:
- Default: White bg, shadow-sm
- Hover: shadow-md, transform translateY(-2px)
- Transition: All 200ms ease

**Buttons**:
- Primary: Charcoal bg → Darker charcoal (#363F44), shadow-sm → shadow-md
- Secondary: Transparent → Cream bg (#FFFBF7)
- Transition: All 200ms ease

### Focus States

**Inputs & Selects**:
- Default: Border neutral-300 (1px)
- Focus: Border charcoal (2px), ring 2px charcoal at 20% opacity
- Outline: None (use ring instead)

**Buttons**:
- Focus: Ring 2px charcoal at 40% opacity, outline-offset 2px
- Ensure visible focus indicator for keyboard navigation

**Checkboxes**:
- Focus: Ring 2px charcoal at 40% opacity around checkbox

### Error States

**Inline Field Errors**:
```
[Input with error]  ← Red border (2px), shake animation
❌ Error message    ← Red text (14px), lucide AlertCircle icon
```

**Animation**: Shake (3px horizontal movement, 2 iterations, 200ms)

**Toast Notifications** (for API errors):
```
┌────────────────────────────────────────────────┐
│  ❌ Import Failed                              │
│  Unable to fetch calendar events. Please check │
│  your connection and try again.                │
│                                         [×]    │
└────────────────────────────────────────────────┘
```

**Position**: Top-right corner
**Duration**: 5 seconds (auto-dismiss), or manual close
**Animation**: Slide in from right, fade out

### Success States

**Success Toast** (after successful import):
```
┌────────────────────────────────────────────────┐
│  ✅ Import Successful!                         │
│  3 appointments have been created and are now  │
│  visible in your calendar.                     │
│                                         [×]    │
└────────────────────────────────────────────────┘
```

**Final Success Screen** (shown in Step 4 after import completes):
- Green checkmark icon (48px, success color)
- Success message (18px, semibold)
- Summary list (bulleted)
- "Done" button (primary style)

### Transitions & Animations

**Step Transitions**:
- Animation: Slide transition (previous step slides left, new step slides in from right)
- Duration: 300ms
- Easing: ease-in-out
- Mobile: Fade transition (simpler, less resource-intensive)

**Modal Open/Close**:
- Open: Fade in backdrop (200ms) → Scale modal from 0.95 to 1 (200ms)
- Close: Scale modal from 1 to 0.95 (150ms) → Fade out backdrop (150ms)
- Easing: ease-out

**Progress Bar Fill**:
- Animation: Smooth width increase
- Duration: Per increment (200ms per 10%)
- Easing: ease-in-out

**Loading Spinner**:
- Animation: Continuous rotation (360deg)
- Duration: 1000ms
- Easing: linear
- Icon: lucide `Loader2` with `animate-spin` class

---

## Responsive Design

### Breakpoint Strategy

**Mobile First Approach**:
- Base styles: Mobile (<640px)
- Tablet: `sm:` (640px+) and `md:` (768px+)
- Desktop: `lg:` (1024px+) and `xl:` (1280px+)

### Desktop (1024px+)

**Layout**:
- Modal: 800px width, centered
- Two-column layout for forms (customer/pet on left, service/addons on right)
- Event list: Single column with compact cards
- Footer: Horizontal button layout (Back | Cancel Next)

**Typography**:
- Use full text labels ("Previous Event", "Continue to Mapping")
- Show full descriptions and helper text

**Interactions**:
- Hover states on all interactive elements
- Tooltips for badges and warnings
- Larger click targets (minimum 44px)

### Tablet (640px-1023px)

**Layout**:
- Modal: 90vw width (max 700px)
- Single-column layout for forms
- Event list: Same as desktop
- Footer: Horizontal button layout (compact spacing)

**Typography**:
- Same as desktop
- May reduce padding slightly (20px → 16px)

**Interactions**:
- Same as desktop
- Ensure touch targets are 44px minimum

### Mobile (<640px)

**Layout**:
- Full-screen modal (100vw × 100vh)
- Header: Sticky at top
- Footer: Sticky at bottom
- Body: Scrollable middle section

**Header Changes**:
```
┌────────────────────────────────────────────────┐
│  [×]  Import Calendar Events                   │  ← Title + close button same line
│                                                │
│  ● ○ ○ ○  Step 2 of 4                         │  ← Step indicator
│  Select Events                                 │  ← Step name on new line
└────────────────────────────────────────────────┘
```

**Form Layout**:
- Stack all inputs vertically
- Full-width inputs and buttons
- Reduce padding (24px → 16px)
- Smaller font sizes (16px → 15px for body)

**Event Cards**:
- Compact layout (reduce padding to 12px)
- Stack badges vertically
- Truncate long text with ellipsis

**Footer Changes**:
```
┌────────────────────────────────────────────────┐
│  [← Back to Date Range]                        │  ← Full-width button
│  [Cancel Import]                               │  ← Full-width button
│  [Continue to Mapping →]                       │  ← Full-width button (primary)
└────────────────────────────────────────────────┘
     ↑ 12px gap between buttons
```

**Navigation Between Events (Step 3)**:
```
Mapping 1 of 3                    ← Centered text
[← Previous Event]                 ← Full-width button
[Next Event →]                     ← Full-width button
```

**Typography**:
- Reduce heading sizes (20px → 18px for title)
- Body text: 15px (minimum for readability)
- Helper text: 13px

**Interactions**:
- No hover states (touch-only)
- Larger touch targets (48px minimum)
- Bottom sheet for dropdowns (native mobile feel)
- Slide-up animation for modal open

### Responsive Utilities (Tailwind)

```typescript
// Example responsive classes
<div className="
  p-4 sm:p-5 lg:p-6          // Padding scales up
  text-base sm:text-lg        // Typography scales
  grid grid-cols-1 lg:grid-cols-2  // Layout changes
  gap-3 sm:gap-4 lg:gap-6     // Spacing increases
">
```

---

## Accessibility Requirements

### ARIA Attributes

**Modal**:
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="wizard-title"
  aria-describedby="wizard-description"
>
  <h2 id="wizard-title">Import Calendar Events</h2>
  <p id="wizard-description">Step 1 of 4: Select Date Range</p>
  ...
</div>
```

**Step Indicator**:
```tsx
<ol role="list" aria-label="Import wizard progress">
  <li aria-current="step">
    <span className="sr-only">Current Step: </span>
    Select Date Range
  </li>
  <li aria-label="Step 2: Select Events (not started)">
    ...
  </li>
</ol>
```

**Form Fields**:
```tsx
<div>
  <label htmlFor="customer-search" className="...">
    Customer <span aria-label="required">*</span>
  </label>
  <input
    id="customer-search"
    type="text"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "customer-error" : "customer-help"}
  />
  {hasError && (
    <p id="customer-error" role="alert" className="text-error">
      Please select or create a customer
    </p>
  )}
</div>
```

**Checkboxes (Event Selection)**:
```tsx
<div role="group" aria-labelledby="event-list-heading">
  <h3 id="event-list-heading">Select Events to Import</h3>

  <label className="...">
    <input
      type="checkbox"
      aria-label="Fluffy - Grooming Appointment on Jan 8"
      aria-describedby="event-123-details event-123-warning"
    />
    <div id="event-123-details">...</div>
    {hasWarning && (
      <div id="event-123-warning" role="status">
        Possible duplicate
      </div>
    )}
  </label>
</div>
```

**Progress Bar**:
```tsx
<div
  role="progressbar"
  aria-valuenow={60}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Import progress"
>
  <div style={{ width: '60%' }} />
</div>
<div aria-live="polite" aria-atomic="true">
  1 of 2 appointments created
</div>
```

### Keyboard Navigation

**Tab Order**:
1. Close button (×)
2. Step indicator (focusable for screen readers, skippable for sighted users)
3. First input/interactive element in step body
4. All form fields in sequence
5. Footer buttons (Back, Cancel, Next)

**Keyboard Shortcuts**:
- `Esc`: Close modal (with confirmation if data entered)
- `Enter`: Submit current step (same as clicking Next button)
- `Tab`: Navigate forward through interactive elements
- `Shift + Tab`: Navigate backward
- `Arrow Keys`: Navigate within dropdowns and radio groups
- `Space`: Toggle checkboxes

**Focus Management**:
- On modal open: Focus on first interactive element (date input on Step 1)
- On step change: Focus on step heading or first input
- On error: Focus on first field with error
- On modal close: Return focus to "Import from Calendar" button

**Dropdown Navigation** (Customer/Pet/Service selectors):
- `Arrow Down`: Open dropdown, or move to next option
- `Arrow Up`: Move to previous option
- `Enter`: Select highlighted option
- `Esc`: Close dropdown without selecting
- `Home`: Jump to first option
- `End`: Jump to last option
- Type to search: Typing filters/highlights options

### Screen Reader Support

**Announcements**:
```tsx
// Step transition
<div aria-live="assertive" className="sr-only">
  Now on Step 2 of 4: Select Events
</div>

// Loading state
<div aria-live="polite" className="sr-only">
  Fetching calendar events. Please wait.
</div>

// Success/Error
<div role="alert" aria-live="assertive">
  Import successful. 3 appointments created.
</div>
```

**Hidden Labels** (for icon-only buttons):
```tsx
<button aria-label="Close import wizard" className="...">
  <X className="w-5 h-5" aria-hidden="true" />
</button>

<button aria-label="Next step: Select Events" className="...">
  Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
</button>
```

**Semantic HTML**:
- Use `<button>` for actions (not `<div>` with click handlers)
- Use `<a>` for navigation (if applicable)
- Use proper heading hierarchy (`<h2>` for modal title, `<h3>` for section headings)
- Use `<fieldset>` and `<legend>` for grouped form controls
- Use `<label>` for all form inputs

**Color Contrast**:
- Text on background: Minimum 4.5:1 (WCAG AA)
- Large text (18px+): Minimum 3:1
- Charcoal (#434E54) on cream (#F8EEE5): ~8.5:1 ✓
- Charcoal on white: ~11:1 ✓
- Error red (#EF4444) on white: ~4.5:1 ✓

**Focus Indicators**:
- Visible focus ring on all interactive elements
- Minimum 2px width, contrasting color
- Use `outline` or `ring` utility (not `border` which affects layout)

### WCAG 2.1 AA Compliance Checklist

- ✅ **1.3.1 Info and Relationships**: Semantic HTML, proper ARIA labels
- ✅ **1.4.3 Contrast**: 4.5:1 for normal text, 3:1 for large text
- ✅ **2.1.1 Keyboard**: All functionality available via keyboard
- ✅ **2.1.2 No Keyboard Trap**: Users can navigate away from all elements
- ✅ **2.4.3 Focus Order**: Logical tab order
- ✅ **2.4.7 Focus Visible**: Visible focus indicators
- ✅ **3.2.2 On Input**: No automatic context changes on input
- ✅ **3.3.1 Error Identification**: Errors clearly identified
- ✅ **3.3.2 Labels or Instructions**: All inputs have labels
- ✅ **4.1.2 Name, Role, Value**: Proper ARIA attributes for custom controls
- ✅ **4.1.3 Status Messages**: Live regions for dynamic content

---

## Animation Patterns

### Step Transitions

**Forward Navigation** (Step 1 → Step 2):
```css
/* Outgoing step */
.step-exit {
  transform: translateX(0);
  opacity: 1;
}
.step-exit-active {
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
}

/* Incoming step */
.step-enter {
  transform: translateX(100%);
  opacity: 0;
}
.step-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
}
```

**Backward Navigation** (Step 2 → Step 1):
```css
/* Reverse directions */
.step-exit-back {
  transform: translateX(0);
  opacity: 1;
}
.step-exit-back-active {
  transform: translateX(100%);
  opacity: 0;
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
}

.step-enter-back {
  transform: translateX(-100%);
  opacity: 0;
}
.step-enter-back-active {
  transform: translateX(0);
  opacity: 1;
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
}
```

**Mobile**: Use fade transition instead (simpler, better performance)
```css
.step-mobile-exit {
  opacity: 1;
}
.step-mobile-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-in-out;
}
.step-mobile-enter {
  opacity: 0;
}
.step-mobile-enter-active {
  opacity: 1;
  transition: opacity 200ms ease-in-out;
}
```

### Modal Open/Close

**Open Animation**:
```tsx
// Framer Motion variant
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

<motion.div
  variants={backdropVariants}
  initial="hidden"
  animate="visible"
  exit="hidden"
  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
>
  <motion.div
    variants={modalVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="modal-content"
  >
    {/* Modal content */}
  </motion.div>
</motion.div>
```

**Mobile**: Slide up from bottom
```tsx
const mobileModalVariants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
};
```

### Loading States

**Spinner Animation** (using Lucide `Loader2`):
```tsx
import { Loader2 } from 'lucide-react';

<Loader2 className="w-8 h-8 animate-spin text-charcoal" />
```

**Progress Bar Fill**:
```tsx
// Framer Motion for smooth width changes
<motion.div
  className="h-2 bg-charcoal rounded-full"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
/>
```

**Skeleton Loading** (for event list while fetching):
```tsx
// Pulse animation
<div className="animate-pulse space-y-4">
  <div className="h-20 bg-neutral-200 rounded-lg"></div>
  <div className="h-20 bg-neutral-200 rounded-lg"></div>
  <div className="h-20 bg-neutral-200 rounded-lg"></div>
</div>
```

### Success/Error States

**Success Checkmark Animation**:
```tsx
// Scale in with bounce
const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 200,
    },
  },
};

<motion.div
  variants={checkmarkVariants}
  initial="hidden"
  animate="visible"
>
  <CheckCircle className="w-16 h-16 text-success" />
</motion.div>
```

**Error Shake Animation**:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.error-shake {
  animation: shake 200ms ease-in-out 2;
}
```

### Hover/Focus Transitions

**Button Hover**:
```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -1 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
  className="..."
>
  Continue
</motion.button>
```

**Card Hover** (Event cards, Appointment preview cards):
```tsx
<motion.div
  whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(67, 78, 84, 0.1)' }}
  transition={{ duration: 0.2 }}
  className="..."
>
  {/* Card content */}
</motion.div>
```

### Micro-Interactions

**Checkbox Check Animation**:
```css
/* Scale in checkmark when checked */
input[type="checkbox"]:checked + svg {
  animation: checkmark-pop 200ms ease-in-out;
}

@keyframes checkmark-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

**Badge Appearance** (Warnings, Suggestions):
```tsx
// Fade in with slight slide
<motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.2, delay: 0.1 }}
  className="badge"
>
  ⚠️ Possible duplicate
</motion.div>
```

**Toast Notification**:
```tsx
// Slide in from right
const toastVariants = {
  hidden: { x: 400, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 20, stiffness: 200 },
  },
  exit: {
    x: 400,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

<motion.div
  variants={toastVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  className="toast"
>
  {/* Toast content */}
</motion.div>
```

### Performance Considerations

**Optimize Animations**:
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflows)
- Use `will-change` sparingly for complex animations
- Reduce animations on mobile (simpler transitions)

**Framer Motion Performance**:
```tsx
// Lazy load motion components
import { motion } from 'framer-motion';

// Or use layout animations for dynamic content
<motion.div layout>
  {/* Content that changes size/position */}
</motion.div>
```

**Reduce Motion Preference**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In React
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

---

## Assets Needed

### Icons (Lucide React)

**Primary Icons**:
- `Calendar` - Date/time representation
- `User` - Customer
- `Dog` or `PawPrint` - Pet (may need custom icon if Dog not available)
- `Scissors` - Grooming service
- `Plus` - Add-ons, create new
- `DollarSign` - Pricing, totals
- `FileText` - Notes
- `X` - Close modal, remove item
- `ArrowRight` - Next, forward navigation
- `ArrowLeft` - Back, previous navigation
- `Check` - Completed step, success
- `CheckCircle` - Success state
- `AlertCircle` - Error state
- `AlertTriangle` - Warning
- `Info` - Info badges, helper text
- `Loader2` - Loading spinner
- `Search` - Search/autocomplete
- `ChevronDown` - Dropdown indicator
- `Clock` - Time/duration

**Specialty Icons**:
- `Upload` or `CloudUpload` - Import action
- `Eye` - Preview
- `Edit` - Modify mapping
- `Trash2` - Delete/cancel
- `Filter` - Filter events (future enhancement)

### Illustrations (Optional)

**Empty States**:
- "No events found" - Calendar with X or empty calendar illustration
- Could use simple SVG illustrations from services like unDraw or create custom

**Success State**:
- Checkmark illustration or animated success icon
- Keep it minimal (lucide `CheckCircle` is sufficient)

### Images

No images required for this wizard. All visuals achieved through:
- Icons (Lucide React)
- Badges (styled divs with text + icons)
- Cards (structured layout with borders/shadows)

### Color Swatches (Reference)

**From Design System**:
```css
--background: #F8EEE5;        /* Warm cream */
--background-light: #FFFBF7;  /* Lighter cream */
--primary: #434E54;            /* Charcoal */
--primary-hover: #363F44;      /* Darker charcoal */
--success: #6BCB77;            /* Green */
--warning: #FFB347;            /* Amber (adjust to #F59E0B for CTAs) */
--error: #EF4444;              /* Red */
--info: #74B9FF;               /* Blue */
--neutral-100: #FFFFFF;        /* White */
--neutral-200: #F5F5F5;        /* Light gray */
--neutral-300: #E5E5E5;        /* Gray */
--neutral-400: #9CA3AF;        /* Mid gray */
--text-primary: #434E54;       /* Charcoal */
--text-secondary: #6B7280;     /* Gray text */
```

### Typography Reference

**Font Family**: System font stack or specified in global styles
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Weights Used**:
- Regular (400) - Body text
- Medium (500) - Labels, subtle emphasis
- Semibold (600) - Headings, buttons
- Bold (700) - Strong emphasis (use sparingly)

---

## Next Steps

**Handoff to `@agent-daisyui-expert`**:

This comprehensive design specification is now complete and saved at:
**C:\Users\Jon\Documents\claude projects\thepuppyday\.claude\design\calendar-import-wizard.md**

### Implementation Checklist for DaisyUI Expert

1. **Component Files to Create**:
   - `src/components/admin/calendar/ImportButton.tsx`
   - `src/components/admin/calendar/ImportWizard.tsx`
   - `src/components/admin/calendar/DateRangeStep.tsx`
   - `src/components/admin/calendar/EventSelectionStep.tsx`
   - `src/components/admin/calendar/EventMappingForm.tsx`
   - `src/components/admin/calendar/ReviewStep.tsx`

2. **API Integration**:
   - POST `/api/admin/calendar/import/preview` (fetch events)
   - POST `/api/admin/calendar/import/confirm` (create appointments)

3. **DaisyUI Components to Use**:
   - `modal` - Modal container
   - `btn` - Buttons (primary, secondary, ghost)
   - `input` - Date inputs, text inputs, search
   - `select` - Dropdowns for pet/service selection
   - `checkbox` - Event selection, addon selection
   - `textarea` - Notes input
   - `badge` - Warnings, suggestions, status indicators
   - `progress` - Import progress bar
   - `alert` - Info messages, warnings
   - `card` - Event cards, appointment preview cards

4. **State Management**:
   - Use React `useState` for wizard state (or Zustand if complex)
   - Manage step navigation, selections, mappings, validation errors

5. **Validation**:
   - Client-side validation for required fields
   - Date range validation (end after start, max 90 days)
   - Mapping validation (customer, pet, service required)

6. **Error Handling**:
   - Network errors (toast notifications)
   - Validation errors (inline messages)
   - Partial import failures (display in results)

7. **Testing Scenarios**:
   - Empty event list
   - Duplicate detection
   - Validation errors
   - API failures
   - Successful import (full and partial)

**Ready for Implementation**: Use this design spec to create production-ready React components with DaisyUI styling and Tailwind utilities.
