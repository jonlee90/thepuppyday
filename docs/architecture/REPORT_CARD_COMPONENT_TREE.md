# Report Card Form - Component Tree

## Visual Hierarchy

```
page.tsx (Server Component)
│
└── ReportCardForm.tsx (Main Orchestrator)
    │
    ├── PhotoUploadSection.tsx
    │   ├── PhotoUpload.tsx (Before)
    │   └── PhotoUpload.tsx (After)
    │
    ├── AssessmentSection.tsx
    │   ├── MoodSelector.tsx
    │   ├── CoatConditionSelector.tsx
    │   └── BehaviorSelector.tsx
    │
    ├── HealthObservationsSection.tsx
    │
    ├── GroomerNotesSection.tsx
    │   └── DontSendToggle.tsx
    │
    └── SubmitActions.tsx
```

---

## Data Flow

```
┌────────────────────────────────────────────────────────────┐
│  useReportCardForm Hook                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  formState: {                                        │  │
│  │    appointment_id                                    │  │
│  │    mood, coat_condition, behavior                    │  │
│  │    health_observations[]                             │  │
│  │    groomer_notes                                     │  │
│  │    before_photo_url, after_photo_url                 │  │
│  │  }                                                   │  │
│  │  dontSend: boolean                                   │  │
│  │  saveStatus: { isSaving, lastSaved, error }         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Auto-Save (5s debounce)                                  │
│  ├─► LocalStorage (immediate)                             │
│  └─► POST /api/admin/report-cards (isDraft: true)        │
│                                                            │
│  Submit Actions                                           │
│  ├─► Save Draft: isDraft=true                             │
│  └─► Submit: isDraft=false + validation                   │
└────────────────────────────────────────────────────────────┘
```

---

## Page Loading Flow

```
1. Server Component (page.tsx)
   ├─► Fetch appointment data from Supabase
   ├─► Extract: petName, serviceName, customerName, date
   └─► Pass props to ReportCardForm

2. ReportCardForm Client Component
   ├─► Initialize useReportCardForm hook
   │   ├─► Try to load existing report card from server
   │   ├─► Fallback to localStorage if offline
   │   └─► Set initial form state
   │
   └─► Render all sections with form state

3. User Interactions
   ├─► Photo Upload
   │   ├─► Compress image (max 1200px)
   │   ├─► Upload to Supabase Storage
   │   └─► Update form state with URL
   │
   ├─► Assessment Selection
   │   └─► Update form state (triggers auto-save)
   │
   ├─► Health Observations
   │   ├─► Update form state
   │   └─► Check for critical issues
   │
   └─► Groomer Notes
       ├─► Update form state
       └─► Validate character limit

4. Auto-Save (Every 5 seconds)
   ├─► Save to localStorage (immediate)
   └─► POST to /api/admin/report-cards

5. Submit
   ├─► Validate form
   ├─► POST to /api/admin/report-cards (isDraft=false)
   ├─► Clear localStorage
   └─► Redirect to appointments list
```

---

## Component Props Flow

### ReportCardForm
```typescript
props: {
  appointmentId: string
  petName: string
  serviceName: string
  customerName: string
  appointmentDate: string
}
```

### PhotoUploadSection
```typescript
props: {
  beforePhotoUrl: string
  afterPhotoUrl: string
  onBeforePhotoChange: (url: string) => void
  onAfterPhotoChange: (url: string) => void
  onUpload: (file: File) => Promise<string>
}
```

### AssessmentSection
```typescript
props: {
  mood: ReportCardMood | null
  coatCondition: CoatCondition | null
  behavior: BehaviorRating | null
  onMoodChange: (mood: ReportCardMood) => void
  onCoatConditionChange: (condition: CoatCondition) => void
  onBehaviorChange: (behavior: BehaviorRating) => void
}
```

### HealthObservationsSection
```typescript
props: {
  value: HealthObservation[]
  onChange: (observations: HealthObservation[]) => void
  onCriticalIssueDetected?: (hasCritical: boolean) => void
}
```

### GroomerNotesSection
```typescript
props: {
  notes: string
  dontSend: boolean
  onNotesChange: (notes: string) => void
  onDontSendChange: (dontSend: boolean) => void
}
```

### SubmitActions
```typescript
props: {
  formState: ReportCardFormState
  isSaving: boolean
  lastSaved: Date | null
  onSaveDraft: () => Promise<boolean>
  onSubmit: () => Promise<boolean>
}
```

---

## State Management

### Hook: useReportCardForm

**State:**
- `formState` - All form fields
- `dontSend` - Email toggle
- `saveStatus` - Auto-save status
- `hasLoadedRef` - Prevents duplicate loads

**Actions:**
- `setMood(mood)` - Update mood
- `setCoatCondition(condition)` - Update coat condition
- `setBehavior(behavior)` - Update behavior
- `setHealthObservations(observations)` - Update health observations
- `setGroomerNotes(notes)` - Update notes
- `setBeforePhoto(url)` - Update before photo URL
- `setAfterPhoto(url)` - Update after photo URL
- `submit(isDraft)` - Submit form

**Side Effects:**
- Auto-save timer (5s debounce)
- LocalStorage sync
- Initial data load

---

## API Integration

### Photo Upload Flow
```
PhotoUpload Component
  │
  ├─► User selects file
  ├─► Validate (type, size)
  ├─► Compress (max 1200px width)
  ├─► Create local preview
  │
  └─► Upload to Supabase
      │
      ├─► POST /api/admin/report-cards/upload
      │   ├─► FormData with file
      │   └─► Returns: { success, url, path }
      │
      └─► Update form state with URL
```

### Save/Submit Flow
```
useReportCardForm Hook
  │
  ├─► Auto-Save (every 5s)
  │   └─► POST /api/admin/report-cards
  │       ├─► Body: { formState, isDraft: true }
  │       └─► Upsert report_cards table
  │
  └─► Submit (user clicks button)
      ├─► Validate form
      │   ├─► After photo required
      │   └─► At least one assessment
      │
      └─► POST /api/admin/report-cards
          ├─► Body: { formState, isDraft: false }
          ├─► Upsert report_cards table
          ├─► Clear localStorage
          └─► Redirect to /admin/appointments
```

---

## Error Handling

### Photo Upload Errors
- Invalid file type → Show error below upload area
- File too large → Show error below upload area
- Upload failed → Show error, revert preview

### Validation Errors
- After photo missing → Show in SubmitActions
- No assessment selected → Show in SubmitActions
- Notes too long → Character counter turns red

### Network Errors
- Auto-save failed → Show error in save status
- Submit failed → Show error in SubmitActions
- Offline → Save to localStorage only

---

## Styling Patterns

### Button States
```typescript
// Primary button (Submit)
className="bg-[#434E54] text-white hover:bg-[#363F44]"

// Secondary button (Save Draft)
className="border-2 border-[#434E54] text-[#434E54] hover:bg-[#F8EEE5]"

// Disabled
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### Selector States
```typescript
// Unselected
className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"

// Selected
className="border-[#434E54] bg-[#F8EEE5] shadow-md"

// Selected Critical
className="border-red-500 bg-red-50"
```

### Touch Targets
```typescript
// Minimum tap target
className="min-h-[44px] min-w-[44px]"

// Button padding for larger targets
className="px-6 py-3" // Results in ~50px height
```

---

This component tree provides a complete overview of how the Report Card Form is structured and how data flows through the application.
