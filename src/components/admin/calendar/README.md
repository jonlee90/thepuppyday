# Google Calendar Error Recovery Components

This directory contains three interconnected UI components for monitoring and recovering from Google Calendar sync failures in The Puppy Day admin panel.

## Components

### 1. QuotaWarning Component

**File:** `QuotaWarning.tsx`

Proactive warning system to prevent API quota exhaustion before it causes service disruption.

**Props:**
```typescript
interface QuotaWarningProps {
  current: number;      // Current quota usage
  limit: number;        // Total quota limit
  percentage: number;   // Usage percentage (0-100)
  resetAt: string;      // ISO timestamp when quota resets
  onDismiss?: () => void; // Optional callback when dismissed
}
```

**Features:**
- Auto-calculates severity level (Warning 80-89%, High 90-94%, Critical 95%+)
- Animated progress bar with color gradients
- Live countdown to quota reset time
- Suggested actions and link to Google Cloud Console
- Auto-hides when quota drops below 80%
- Dismissible with smooth animations

**Usage:**
```tsx
import { QuotaWarning } from '@/components/admin/calendar/QuotaWarning';

<QuotaWarning
  current={850000}
  limit={1000000}
  percentage={85}
  resetAt="2025-12-27T00:00:00Z"
  onDismiss={() => console.log('Quota warning dismissed')}
/>
```

---

### 2. SyncErrorRecovery Component

**File:** `SyncErrorRecovery.tsx`

Comprehensive error management interface for viewing, filtering, and retrying failed Google Calendar sync operations.

**Props:**
```typescript
interface SyncErrorRecoveryProps {
  onRetry?: (appointmentId: string, errorId: string) => Promise<boolean>;
  onResync?: (appointmentId: string, errorId: string) => Promise<boolean>;
  onRetryBatch?: (errorIds: string[]) => Promise<{ errorId: string; success: boolean }[]>;
}
```

**Features:**
- Fetches errors from `/api/admin/calendar/sync/errors`
- Filter by date range, error type, and search query
- Individual retry and resync actions with confirmation
- Bulk retry for multiple selected errors
- Real-time polling (30-second intervals)
- Expandable error details (stack trace, event IDs, timestamps)
- Loading states and skeleton screens
- Toast notifications for success/failure
- Empty state with success illustration

**Usage:**
```tsx
import { SyncErrorRecovery } from '@/components/admin/calendar/SyncErrorRecovery';

// Basic usage (uses default API calls)
<SyncErrorRecovery />

// Advanced usage with custom handlers
<SyncErrorRecovery
  onRetry={async (appointmentId, errorId) => {
    // Custom retry logic
    return true; // or false
  }}
  onResync={async (appointmentId, errorId) => {
    // Custom resync logic
    return true;
  }}
  onRetryBatch={async (errorIds) => {
    // Custom batch retry logic
    return errorIds.map(id => ({ errorId: id, success: true }));
  }}
/>
```

**API Endpoints Expected:**
- `GET /api/admin/calendar/sync/errors` - Returns list of failed syncs
- `POST /api/admin/calendar/sync/retry` - Body: `{ appointmentId, errorId }`
- `POST /api/admin/calendar/sync/resync` - Body: `{ appointmentId, errorId, deleteExisting: true }`
- `POST /api/admin/calendar/sync/retry-batch` - Body: `{ errorIds: string[] }`

---

### 3. PausedSyncBanner Component

**File:** `PausedSyncBanner.tsx`

Critical alert banner to inform administrators that automatic Google Calendar sync has been disabled due to repeated failures.

**Props:**
```typescript
interface PausedSyncBannerProps {
  pausedAt: string;                // ISO timestamp when sync was paused
  pauseReason: string;             // Human-readable reason for pause
  errorCount: number;              // Number of recent errors
  onResume: () => Promise<void>;   // Async callback to resume sync
  onViewErrors: () => void;        // Callback to navigate to error list
}
```

**Features:**
- Prominent red gradient background with alert icon
- Shows pause timestamp and error summary
- Confirmation modal before resuming sync
- Loading state during resume operation
- Success flash animation on successful resume
- Shake animation on resume failure
- Auto-hides when sync is successfully resumed

**Usage:**
```tsx
import { PausedSyncBanner } from '@/components/admin/calendar/PausedSyncBanner';

<PausedSyncBanner
  pausedAt="2025-12-26T14:30:00Z"
  pauseReason="Consecutive rate limit failures"
  errorCount={5}
  onResume={async () => {
    await fetch('/api/admin/calendar/connection/resume', { method: 'POST' });
  }}
  onViewErrors={() => {
    // Navigate to error recovery panel or scroll to it
    document.getElementById('sync-error-recovery')?.scrollIntoView({ behavior: 'smooth' });
  }}
/>
```

---

## Integration Example

See `CalendarErrorRecoveryExample.tsx` for a complete example showing how to integrate all three components together in a Calendar Settings page.

**Key Integration Points:**

1. **Component Placement Order:**
   ```tsx
   {/* 1. PausedSyncBanner - Highest priority (critical alert) */}
   {syncStatus?.isPaused && <PausedSyncBanner {...} />}

   {/* 2. QuotaWarning - Second priority (warning) */}
   {syncStatus?.quotaUsage.percentage >= 80 && <QuotaWarning {...} />}

   {/* 3. Calendar Configuration - Main settings */}
   <div>Calendar Settings...</div>

   {/* 4. SyncErrorRecovery - Error management panel */}
   <SyncErrorRecovery />
   ```

2. **Shared State Synchronization:**
   All components should poll the same API endpoint for consistent state:
   ```typescript
   GET /api/admin/calendar/sync-status
   ```

   Expected response:
   ```typescript
   {
     quotaUsage: {
       current: number;
       limit: number;
       percentage: number;
       resetAt: string;
     };
     isPaused: boolean;
     pauseReason?: string;
     pausedAt?: string;
     failedSyncs: Array<SyncError>;
     errorCount: number;
     lastSyncSuccess?: string;
   }
   ```

3. **Cross-Component Navigation:**
   - PausedSyncBanner → SyncErrorRecovery: "View Error Details" button
   - QuotaWarning → Google Cloud Console: External link
   - SyncErrorRecovery: Standalone, filterable error list

---

## Animations

Custom animations are defined in `src/app/globals.css`:

- `animate-slideDown` - QuotaWarning entry animation (400ms ease-out)
- `animate-slideDownShake` - PausedSyncBanner entry animation (800ms ease-out with shake)
- `animate-shake` - Error state shake animation (300ms ease-in-out)

All components use Tailwind's built-in `animate-pulse` and `animate-spin` for loading states.

---

## Accessibility

All components implement:

- **ARIA roles and labels**: `role="alert"`, `aria-live="assertive"`, `aria-expanded`
- **Keyboard navigation**: Full tab order, Enter/Space activation
- **Screen reader support**: Announces severity, state changes, and updates
- **Focus management**: Focus traps in modals, visible focus rings
- **Color contrast**: WCAG 2.1 AA compliant (4.5:1 minimum)
- **Non-color indicators**: Icons, text, and elevation used alongside color

---

## Design System Compliance

Components follow The Puppy Day design system:

**Colors:**
- Primary: Charcoal `#434E54`
- Background: Cream `#F8EEE5`
- Secondary text: `#6B7280`
- Muted text: `#9CA3AF`
- Error: `#EF4444`
- Warning: `#F59E0B`
- Success: `#10B981`

**Typography:**
- Font family: System font stack (DaisyUI default)
- Headings: 18-28px, semibold to bold
- Body: 14-16px, regular to medium
- Small text: 13-14px, regular

**Shadows:**
- `shadow-sm`: Subtle elevation
- `shadow-md`: Standard card elevation
- `shadow-lg`: Prominent elements (modals, critical alerts)

**Borders:**
- Corner radius: `rounded-lg` (8px), `rounded-xl` (16px)
- Border width: 1px (subtle), 4px left border for severity indicators
- NO bold borders or chunky styling

---

## Testing Checklist

- [ ] QuotaWarning appears at 80%, 90%, 95% thresholds
- [ ] QuotaWarning dismisses and reappears correctly
- [ ] QuotaWarning auto-hides when quota drops below 80%
- [ ] PausedSyncBanner shows when sync paused
- [ ] PausedSyncBanner resume confirmation works
- [ ] PausedSyncBanner auto-hides when sync resumed
- [ ] SyncErrorRecovery loads error list
- [ ] SyncErrorRecovery filters work correctly
- [ ] Individual retry succeeds and removes card
- [ ] Individual retry fails and updates error
- [ ] Resync confirmation modal works
- [ ] Batch retry works for multiple selections
- [ ] Empty state shows when no errors
- [ ] Real-time polling updates (30-second interval)
- [ ] Toast notifications appear and dismiss
- [ ] All components responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all alerts and state changes
- [ ] Color contrast passes WCAG 2.1 AA

---

## Dependencies

- **React**: `useState`, `useEffect`, `useCallback`
- **Lucide React**: Icons (`AlertTriangle`, `X`, `RotateCw`, `Play`, etc.)
- **DaisyUI**: Component classes (`btn`, `card`, `select`, `input`, `modal`, `alert`)
- **Tailwind CSS**: Utility classes for layout, spacing, colors

---

## File Structure

```
src/components/admin/calendar/
├── QuotaWarning.tsx                    # Quota warning component
├── SyncErrorRecovery.tsx               # Error recovery panel
├── PausedSyncBanner.tsx                # Paused sync alert banner
├── CalendarErrorRecoveryExample.tsx    # Integration example
└── README.md                           # This file
```

---

## API Routes (To Be Implemented)

These components expect the following API routes to exist:

**Sync Status:**
```typescript
GET /api/admin/calendar/sync-status
Response: { quotaUsage, isPaused, pauseReason, pausedAt, failedSyncs, errorCount, lastSyncSuccess }
```

**Quota Information:**
```typescript
GET /api/admin/calendar/quota
Response: { current, limit, percentage, resetAt }
```

**Failed Syncs:**
```typescript
GET /api/admin/calendar/sync/errors
Response: { failedSyncs: Array<SyncError> }
```

**Retry Sync:**
```typescript
POST /api/admin/calendar/sync/retry
Body: { appointmentId: string, errorId: string }
Response: { success: boolean, message: string }
```

**Resync (Delete + Recreate):**
```typescript
POST /api/admin/calendar/sync/resync
Body: { appointmentId: string, errorId: string, deleteExisting: boolean }
Response: { success: boolean, message: string }
```

**Batch Retry:**
```typescript
POST /api/admin/calendar/sync/retry-batch
Body: { errorIds: string[] }
Response: { success: boolean, results: Array<{ errorId: string, success: boolean }> }
```

**Resume Auto-Sync:**
```typescript
POST /api/admin/calendar/connection/resume
Response: { success: boolean, message: string }
```

---

## Notes

- Components are fully client-side (`'use client'` directive)
- All props are strongly typed with TypeScript interfaces
- Error handling includes try/catch blocks for all async operations
- Loading states prevent UI flicker during data fetches
- Toast notifications are implemented with vanilla DOM manipulation (can be replaced with a toast library if preferred)
- Real-time polling pauses when user is actively interacting to prevent jarring updates
- All animations are performant and use CSS transforms/opacity for smooth rendering

---

## Support

For questions or issues with these components, refer to:
- Design specification: `.claude/design/calendar-error-recovery-components.md`
- Architecture documentation: `docs/architecture/ARCHITECTURE.md`
- Component implementation examples: `CalendarErrorRecoveryExample.tsx`
