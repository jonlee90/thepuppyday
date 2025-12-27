# Calendar Sync Status Components - Implementation Notes

## Overview

This document provides implementation details for the three calendar sync status components created based on the design specification at `.claude/design/calendar-sync-status-components.md`.

## Components Created

### 1. SyncStatusBadge
**Path**: `src/components/admin/calendar/SyncStatusBadge.tsx`

**Purpose**: Inline status indicator for individual appointments showing sync status with Google Calendar.

**Key Features**:
- Color-coded status badges (green=synced, amber=pending, red=failed)
- Tooltip showing last sync time or error message
- Clickable to open SyncHistoryPopover
- Accessible with proper ARIA attributes
- Mobile-responsive with touch targets

**Usage Example**:
```tsx
import { SyncStatusBadge } from '@/components/admin/calendar';
import { useState } from 'react';

function AppointmentRow({ appointment }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <span>{appointment.customer_name}</span>
      <SyncStatusBadge
        appointmentId={appointment.id}
        status={appointment.sync_status}
        lastSyncedAt={appointment.last_synced_at}
        error={appointment.sync_error}
        onClick={() => setShowHistory(true)}
        showLabel={true} // Optional: show text label
      />
      {showHistory && (
        <SyncHistoryPopover
          appointmentId={appointment.id}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
```

**Props**:
- `appointmentId: string` - Unique appointment identifier
- `status: 'synced' | 'pending' | 'failed' | 'not_eligible'` - Current sync status
- `lastSyncedAt?: string` - ISO timestamp of last successful sync
- `error?: string` - Error message if sync failed
- `onClick?: () => void` - Callback when badge is clicked
- `showLabel?: boolean` - Show text label alongside icon (default: false)

---

### 2. SyncHistoryPopover
**Path**: `src/components/admin/calendar/SyncHistoryPopover.tsx`

**Purpose**: Detailed sync history overlay showing all sync operations for an appointment.

**Key Features**:
- Fetches sync history from API endpoint
- Displays sync log entries in chronological order
- Shows action type (created, updated, deleted) with icons
- Links to Google Calendar events
- Loading, empty, and error states
- Mobile-responsive (bottom sheet on mobile, popover on desktop)

**Usage Example**:
```tsx
import { SyncHistoryPopover } from '@/components/admin/calendar';
import { useState } from 'react';

function AppointmentDetails({ appointmentId }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        View Sync History
      </button>

      <SyncHistoryPopover
        appointmentId={appointmentId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

**Props**:
- `appointmentId: string` - Unique appointment identifier
- `isOpen: boolean` - Control popover visibility
- `onClose: () => void` - Callback when popover is closed

**API Endpoint**:
- `GET /api/admin/calendar/sync/history/{appointmentId}`
- Returns: `{ entries: SyncLogEntry[] }`
- Entry format:
  ```typescript
  {
    id: string;
    timestamp: string;
    action: 'created' | 'updated' | 'deleted';
    status: 'success' | 'failed';
    error?: string;
    google_event_id?: string;
  }
  ```

---

### 3. CalendarSyncWidget
**Path**: `src/components/admin/dashboard/CalendarSyncWidget.tsx`

**Purpose**: Dashboard-level sync health metrics and bulk sync controls.

**Key Features**:
- Displays overall sync statistics (total synced, last 24h, failed)
- Connection status indicator
- "Sync All Now" button for bulk sync
- Auto-refreshes every 60 seconds
- Links to calendar settings
- Hidden when calendar not connected

**Usage Example**:
```tsx
import { CalendarSyncWidget } from '@/components/admin/dashboard';

function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Other widgets */}
      <CalendarSyncWidget />
    </div>
  );
}
```

**Props**:
- None (all data is fetched internally)

**API Endpoints**:
- `GET /api/admin/calendar/sync/status` - Fetch sync health metrics
  - Returns:
    ```typescript
    {
      connected: boolean;
      sync_stats?: {
        total_synced: number;
        last_24h: number;
        failed_last_24h: number;
        last_sync_at: string | null;
      };
      health?: {
        status: 'healthy' | 'warning';
        message: string;
      };
    }
    ```
- `POST /api/admin/calendar/sync/bulk` - Trigger bulk sync

---

## API Endpoints

### 1. Sync History Endpoint
**File**: `src/app/api/admin/calendar/sync/history/[appointmentId]/route.ts`

**Endpoint**: `GET /api/admin/calendar/sync/history/{appointmentId}`

**Description**: Fetches sync history for a specific appointment from the `calendar_sync_log` table.

**Authentication**: Requires admin role

**Response Format**:
```json
{
  "entries": [
    {
      "id": "uuid",
      "timestamp": "2025-01-15T10:30:00Z",
      "action": "created",
      "status": "success",
      "google_event_id": "event123"
    }
  ]
}
```

**Database Query**:
```sql
SELECT * FROM calendar_sync_log
WHERE appointment_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

---

### 2. Sync Status Endpoint
**File**: `src/app/api/admin/calendar/sync/status/route.ts`

**Endpoint**: `GET /api/admin/calendar/sync/status`

**Description**: Fetches overall calendar sync health metrics.

**Authentication**: Requires admin role

**Response Format**:
```json
{
  "connected": true,
  "sync_stats": {
    "total_synced": 45,
    "last_24h": 12,
    "failed_last_24h": 2,
    "last_sync_at": "2025-01-15T10:30:00Z"
  },
  "health": {
    "status": "healthy",
    "message": "Sync is operating normally"
  }
}
```

**Note**: This endpoint was already implemented in the project. The CalendarSyncWidget component was updated to work with the existing API response format.

---

### 3. Bulk Sync Endpoint
**File**: `src/app/api/admin/calendar/sync/bulk/route.ts`

**Endpoint**: `POST /api/admin/calendar/sync/bulk`

**Description**: Triggers bulk sync of appointments to Google Calendar.

**Authentication**: Requires admin role

**Request Body**:
```json
{
  "dateFrom": "2025-01-01",
  "dateTo": "2025-12-31",
  "force": false
}
```

**Response Format**:
```json
{
  "success": true,
  "total": 50,
  "successful": 48,
  "failed": 2,
  "skipped": 0,
  "duration_ms": 1500,
  "errors": []
}
```

**Note**: This endpoint was already implemented in the project.

---

## Integration Guide

### Adding SyncStatusBadge to Appointment Lists

To add the sync status badge to existing appointment list components:

1. **Import the components**:
   ```tsx
   import { SyncStatusBadge, SyncHistoryPopover } from '@/components/admin/calendar';
   ```

2. **Add state for popover**:
   ```tsx
   const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
   ```

3. **Render badge in appointment row**:
   ```tsx
   <SyncStatusBadge
     appointmentId={appointment.id}
     status={appointment.sync_status}
     lastSyncedAt={appointment.last_synced_at}
     error={appointment.sync_error}
     onClick={() => setSelectedAppointmentId(appointment.id)}
   />
   ```

4. **Render popover conditionally**:
   ```tsx
   {selectedAppointmentId && (
     <SyncHistoryPopover
       appointmentId={selectedAppointmentId}
       isOpen={true}
       onClose={() => setSelectedAppointmentId(null)}
     />
   )}
   ```

### Adding CalendarSyncWidget to Dashboard

To add the widget to the admin dashboard:

1. **Import the component**:
   ```tsx
   import { CalendarSyncWidget } from '@/components/admin/dashboard';
   ```

2. **Add to dashboard grid**:
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {/* Other widgets */}
     <CalendarSyncWidget />
   </div>
   ```

The widget will automatically:
- Check if calendar is connected
- Hide itself if not connected
- Fetch sync statistics
- Auto-refresh every 60 seconds

---

## Database Requirements

These components expect the following database tables to exist:

### calendar_sync_log
```sql
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY,
  connection_id UUID REFERENCES calendar_connections(id),
  sync_type TEXT, -- 'push', 'pull', 'bulk', 'webhook'
  operation TEXT, -- 'create', 'update', 'delete'
  appointment_id UUID REFERENCES appointments(id),
  google_event_id TEXT,
  status TEXT, -- 'success', 'failed', 'partial'
  error_message TEXT,
  error_code TEXT,
  details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### calendar_event_mappings
```sql
CREATE TABLE calendar_event_mappings (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  connection_id UUID REFERENCES calendar_connections(id),
  google_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL,
  sync_direction TEXT, -- 'push', 'pull'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### calendar_connections
```sql
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_email TEXT NOT NULL,
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expiration TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Design System Adherence

All components follow The Puppy Day design system:

**Colors**:
- Success: `#10B981` (green)
- Warning/Pending: `#F59E0B` (amber)
- Error/Failed: `#EF4444` (red)
- Primary: `#434E54` (charcoal)
- Background: `#F8EEE5` (cream)
- Neutral: `#F9FAFB` (gray-100)

**Typography**:
- Font sizes: 12px - 18px range
- Font weights: regular (400), medium (500), semibold (600), bold (700)

**Spacing**:
- Padding: 12px - 24px
- Gap: 8px - 16px
- Border-radius: 8px (rounded-lg), 12px (rounded-xl), 16px (rounded-2xl)

**Shadows**:
- `shadow-sm`: Subtle elevation
- `shadow-md`: Standard cards
- `shadow-lg`: Elevated popovers/modals

**Transitions**:
- Duration: 150ms - 200ms
- Easing: ease-in-out

---

## Accessibility

All components implement WCAG 2.1 AA accessibility standards:

**SyncStatusBadge**:
- `role="button"` - Indicates clickable element
- `aria-label` - Descriptive label including status and timestamp
- `tabindex="0"` - Keyboard accessible
- Focus ring with 2px offset
- Keyboard support: Enter/Space to open popover

**SyncHistoryPopover**:
- `role="dialog"` - Identifies as dialog/popover
- `aria-label` - Describes purpose
- `aria-live="polite"` - Announces updates
- Escape key to close
- Focus management (returns to badge on close)

**CalendarSyncWidget**:
- `role="region"` - Landmark for navigation
- `aria-label` - Widget identification
- `aria-live="polite"` on stats - Announces updates
- Color is not sole indicator (icons + text)

---

## Testing Recommendations

### Unit Tests
- Test each component's rendering
- Test state management (loading, error, success)
- Test user interactions (click, keyboard)
- Test API error handling

### Integration Tests
- Test SyncStatusBadge → SyncHistoryPopover flow
- Test CalendarSyncWidget auto-refresh
- Test API endpoint responses

### E2E Tests
- Test full sync workflow (badge → history → bulk sync)
- Test accessibility with screen readers
- Test responsive behavior on mobile/tablet/desktop

---

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**: Add Supabase subscriptions for live sync status updates
2. **Batch Actions**: Allow bulk operations from appointment list
3. **Filtering**: Add filters to SyncHistoryPopover (by action, status, date)
4. **Export**: Allow exporting sync history to CSV
5. **Notifications**: Toast notifications for sync events
6. **Retry Logic**: Add manual retry button for failed syncs in popover

### Performance Optimizations
1. **Virtualization**: If sync history exceeds 100 entries
2. **Caching**: Cache sync status with React Query or SWR
3. **Debouncing**: Debounce auto-refresh when user is actively viewing
4. **Lazy Loading**: Load popover content only when opened

---

## Dependencies

These components use:
- **React**: Core framework
- **Next.js 14**: App Router patterns
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **DaisyUI**: Component base classes
- **Lucide React**: Icon library
- **date-fns**: Date formatting (`formatDistanceToNow`)
- **Supabase**: Database queries

---

## File Locations Summary

**Components**:
- `src/components/admin/calendar/SyncStatusBadge.tsx`
- `src/components/admin/calendar/SyncHistoryPopover.tsx`
- `src/components/admin/dashboard/CalendarSyncWidget.tsx`

**API Routes**:
- `src/app/api/admin/calendar/sync/history/[appointmentId]/route.ts`
- `src/app/api/admin/calendar/sync/status/route.ts` (already existed)
- `src/app/api/admin/calendar/sync/bulk/route.ts` (already existed)

**Index Exports**:
- `src/components/admin/calendar/index.ts`
- `src/components/admin/dashboard/index.ts`

**Documentation**:
- `.claude/design/calendar-sync-status-components.md` (design spec)
- `IMPLEMENTATION_NOTES_CALENDAR_SYNC_UI.md` (this file)

---

## Maintenance Notes

**When to update these components**:
1. If `calendar_sync_log` table schema changes
2. If API response formats change
3. If design system colors/spacing change
4. If new sync operations are added
5. If Google Calendar API changes

**Breaking Changes to Avoid**:
- Don't change prop interfaces without versioning
- Don't remove API endpoints without deprecation period
- Don't change database column names without migration
- Don't modify CSS class names used by parent components
