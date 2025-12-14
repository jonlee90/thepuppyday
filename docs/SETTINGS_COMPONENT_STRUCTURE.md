# Settings Components - Technical Structure

## Component Hierarchy

```
SettingsPage (Server Component)
└── SettingsClient (Client Component)
    ├── TabNavigation
    │   ├── Business Hours Tab
    │   ├── Report Cards Tab
    │   ├── Waitlist Tab
    │   ├── Marketing Tab
    │   └── Templates Tab
    │
    └── TabContent (Conditional Rendering)
        ├── BusinessHoursSection (inline in SettingsClient)
        ├── <ReportCardSettings />
        ├── <WaitlistSettings />
        ├── <MarketingSettings />
        └── <TemplateEditor />
```

## Component Files

### Core Settings
```
src/app/admin/settings/
├── page.tsx              # Server Component (data fetching)
└── SettingsClient.tsx    # Client Component (tab navigation + business hours)
```

### Phase 6 Settings Components
```
src/components/admin/settings/
├── ReportCardSettings.tsx   # Report card automation settings
├── WaitlistSettings.tsx     # Waitlist configuration
├── MarketingSettings.tsx    # Marketing automation settings
├── TemplateEditor.tsx       # Notification template editor
└── index.ts                 # Barrel export file
```

## Data Flow

### Settings Page Load
```
1. page.tsx (Server)
   └── Fetch business hours from Supabase
       └── Pass to SettingsClient as initialBusinessHours

2. SettingsClient (Client)
   └── Initialize state with business hours
       └── Render tab navigation
           └── Render active tab content

3. Phase 6 Components (Client)
   └── useEffect on mount
       └── Fetch settings from /api/admin/settings/phase6
           └── Display in form fields
```

### Save Flow
```
1. User modifies settings
   └── State updated in component

2. User clicks "Save Changes"
   └── API call to backend
       └── PUT /api/admin/settings/phase6 (Report Cards, Waitlist, Marketing)
       └── PUT /api/admin/settings/templates (Templates)

3. Backend validates and saves
   └── Database updated
       └── Response sent to frontend

4. Frontend displays result
   └── Success: Green message + auto-dismiss after 3s
   └── Error: Red message + persistent until next action
```

## State Management

### Local State (useState)

#### SettingsClient.tsx
```typescript
- activeTab: TabType          // Current active tab
- businessHours: BusinessHours  // Business hours data
- isSaving: boolean           // Save in progress
- saveMessage: Message | null // Success/error message
```

#### ReportCardSettings.tsx
```typescript
- settings: ReportCardSettings  // Form data
- isLoading: boolean            // Initial load
- isSaving: boolean             // Save in progress
- saveMessage: Message | null   // Success/error message
```

#### WaitlistSettings.tsx
```typescript
- settings: WaitlistSettings   // Form data
- isLoading: boolean           // Initial load
- isSaving: boolean            // Save in progress
- saveMessage: Message | null  // Success/error message
```

#### MarketingSettings.tsx
```typescript
- settings: MarketingSettings  // Form data
- isLoading: boolean           // Initial load
- isSaving: boolean            // Save in progress
- saveMessage: Message | null  // Success/error message
```

#### TemplateEditor.tsx
```typescript
- templates: NotificationTemplates | null  // All templates
- selectedType: NotificationTemplateType   // Currently editing
- currentTemplate: NotificationTemplate    // Active template
- isLoading: boolean                       // Initial load
- isSaving: boolean                        // Save in progress
- showPreview: boolean                     // Preview toggle
- showResetConfirm: boolean                // Reset modal
- saveMessage: Message | null              // Success/error message
```

## API Integration

### Endpoints Used

#### Business Hours
```
GET  /api/admin/settings      # Fetched by Server Component
PUT  /api/admin/settings/business-hours
```

#### Phase 6 Settings
```
GET  /api/admin/settings/phase6
PUT  /api/admin/settings/phase6
```

#### Templates
```
GET  /api/admin/settings/templates
PUT  /api/admin/settings/templates
POST /api/admin/settings/templates/reset
```

### Request/Response Formats

#### Phase 6 Settings - GET Response
```typescript
{
  report_card: {
    auto_send_delay_minutes: number;
    expiration_days: number;
    google_review_url: string;
  };
  waitlist: {
    response_window_hours: number;
    default_discount_percent: number;
  };
  marketing: {
    retention_reminder_advance_days: number;
  };
}
```

#### Phase 6 Settings - PUT Request
```typescript
{
  report_card?: Partial<ReportCardSettings>;
  waitlist?: Partial<WaitlistSettings>;
  marketing?: Partial<MarketingSettings>;
}
```

#### Templates - GET Response
```typescript
{
  report_card: NotificationTemplate;
  waitlist_offer: NotificationTemplate;
  breed_reminder: NotificationTemplate;
  appointment_confirmation: NotificationTemplate;
  appointment_reminder: NotificationTemplate;
}
```

#### Templates - PUT Request
```typescript
{
  templates: Partial<NotificationTemplates>;
}
```

#### Templates Reset - POST Request
```typescript
{
  types?: NotificationTemplateType[];  // Optional: specific types to reset
}
```

## Styling Patterns

### Card Structure
```tsx
<div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
  {/* Header with icon */}
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
      <Icon className="w-5 h-5 text-[#434E54]" />
    </div>
    <div>
      <h2 className="text-lg font-semibold text-[#434E54]">Title</h2>
      <p className="text-sm text-[#6B7280]">Description</p>
    </div>
  </div>

  {/* Content */}
  <div className="space-y-6">
    {/* Form fields */}
  </div>

  {/* Actions */}
  <div className="mt-6 flex items-center gap-4">
    <button>Save</button>
    {/* Messages */}
  </div>
</div>
```

### Form Field Pattern
```tsx
<div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
  <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
    <Icon className="w-4 h-4" />
    Field Label
  </label>
  <p className="text-xs text-[#6B7280] mb-3">
    Helper text explaining the field
  </p>
  {/* Input element */}
</div>
```

### Range Slider + Number Input Pattern
```tsx
<div className="flex items-center gap-4">
  <input
    type="range"
    min="X"
    max="Y"
    step="Z"
    value={value}
    onChange={(e) => setValue(parseInt(e.target.value))}
    className="range range-sm flex-1"
  />
  <input
    type="number"
    min="X"
    max="Y"
    value={value}
    onChange={(e) => setValue(parseInt(e.target.value))}
    className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
  />
  <span className="text-sm text-[#6B7280] min-w-[60px]">unit</span>
</div>
```

### Quick-Select Buttons Pattern
```tsx
<div className="mt-3 flex gap-2">
  {values.map((val) => (
    <button
      key={val}
      onClick={() => setValue(val)}
      className={`btn btn-xs ${
        value === val
          ? 'bg-[#434E54] text-white'
          : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
      }`}
    >
      {val}unit
    </button>
  ))}
</div>
```

### Loading Skeleton Pattern
```tsx
if (isLoading) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}
```

### Save Button Pattern
```tsx
<button
  onClick={handleSave}
  disabled={isSaving}
  className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
>
  {isSaving ? (
    <>
      <span className="loading loading-spinner loading-sm"></span>
      Saving...
    </>
  ) : (
    <>
      <Save className="w-4 h-4" />
      Save Changes
    </>
  )}
</button>
```

### Message Display Pattern
```tsx
{saveMessage && (
  <div
    className={`flex items-center gap-2 ${
      saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
    }`}
  >
    <AlertCircle className="w-4 h-4" />
    <span className="text-sm font-medium">{saveMessage.text}</span>
  </div>
)}
```

## TypeScript Types

### Component Props

```typescript
// SettingsClient
interface SettingsClientProps {
  initialBusinessHours: BusinessHours | null;
}

// Phase 6 components have no props (self-contained)
// They fetch their own data on mount
```

### Internal Types

```typescript
// Message type (used by all components)
type SaveMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

// Tab type
type TabType = 'hours' | 'report-cards' | 'waitlist' | 'marketing' | 'templates';

// See src/types/settings.ts for all settings types
```

## Performance Considerations

### Loading Strategy
- Server Component fetches business hours (SSR)
- Client Components fetch Phase 6 settings (CSR)
- Only active tab component is rendered

### Optimization Opportunities
- Could implement `useSWR` or React Query for caching
- Could add debouncing to auto-save
- Could implement optimistic updates
- Could add form dirty state tracking

### Bundle Size
- All Phase 6 components are code-split
- Only loaded when Settings page is accessed
- DaisyUI components are tree-shakeable

## Testing Strategy

### Unit Tests (Recommended)
```typescript
// Test each component in isolation
describe('ReportCardSettings', () => {
  it('renders loading state initially')
  it('fetches settings on mount')
  it('updates slider when number input changes')
  it('updates number input when slider changes')
  it('calls API on save')
  it('displays success message on successful save')
  it('displays error message on failed save')
})
```

### Integration Tests (Recommended)
```typescript
// Test tab navigation and component interaction
describe('SettingsClient', () => {
  it('renders all tabs')
  it('switches between tabs correctly')
  it('maintains business hours state across tab switches')
  it('loads phase 6 components when tabs are activated')
})
```

### E2E Tests (Recommended)
```typescript
// Test full user workflows
describe('Settings Page', () => {
  it('allows admin to update report card settings')
  it('allows admin to customize email template')
  it('prevents non-admin access')
  it('persists changes after save')
})
```

## Accessibility Features

### Keyboard Navigation
- All tabs are keyboard accessible (Tab key)
- All form fields are keyboard accessible
- Modals can be closed with Escape key

### Screen Readers
- Proper label associations with `htmlFor`
- Icon buttons have text labels
- Loading states announce to screen readers
- Error messages are announced

### Visual
- High contrast text colors
- Clear focus indicators
- Consistent visual hierarchy
- Adequate spacing for touch targets

## Browser Compatibility

### Tested Browsers
- Chrome/Edge (Chromium) - Full support
- Firefox - Full support
- Safari - Full support

### Required Features
- ES6+ JavaScript
- CSS Grid and Flexbox
- Modern form inputs (range, number, time)
- Fetch API

### Polyfills
- None required for modern browsers (2020+)

---

**Last Updated:** 2025-12-14
**Version:** 1.0
**Phase:** Phase 6 - Settings & Configuration
