# Technical Design Document: Google Calendar Integration

## Executive Summary

This document provides a comprehensive technical design for implementing bidirectional Google Calendar synchronization for The Puppy Day grooming application. The integration is **admin-only** and enables business owners to synchronize all grooming appointments between the application and Google Calendar.

### Key Architectural Decisions

1. **Server-Side OAuth Flow**: All Google API interactions occur server-side using Next.js API routes to protect credentials and enable secure token management
2. **Database-Backed Sync State**: Token storage, event mappings, and sync history are persisted in PostgreSQL via Supabase
3. **Webhook-Based Updates**: Real-time sync from Google Calendar to app using push notifications (webhooks)
4. **Event-Driven Architecture**: Appointment status changes trigger automatic sync operations
5. **Exponential Backoff Retry**: Graceful handling of rate limits and transient failures

### Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Database & Types | 1-2 days | Schema migration, TypeScript types, API route scaffolding |
| Phase 2: OAuth & Connection | 2-3 days | OAuth flow, token management, connection UI |
| Phase 3: Push Sync (App → Google) | 3-4 days | Appointment to event mapping, status-based sync, batch operations |
| Phase 4: Pull Sync (Google → App) | 3-4 days | Import wizard, event parsing, duplicate detection |
| Phase 5: Webhooks & Real-time | 2-3 days | Webhook endpoint, channel watch, notification handling |
| Phase 6: Testing & Polish | 2-3 days | Error handling, UI polish, documentation |

**Total Estimated Time**: 13-19 days

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        The Puppy Day App                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐        ┌──────────────┐                      │
│  │   Admin UI   │───────▶│  API Routes  │                      │
│  │ (Next.js)    │        │  (Next.js)   │                      │
│  └──────────────┘        └──────┬───────┘                      │
│                                  │                              │
│                         ┌────────▼────────┐                     │
│                         │ Calendar Service │                    │
│                         │   (lib/calendar) │                    │
│                         └────────┬────────┘                     │
│                                  │                              │
│  ┌──────────────────────────────┼──────────────────────────┐   │
│  │          Supabase PostgreSQL Database                   │   │
│  ├──────────────────────────────┼──────────────────────────┤   │
│  │ • calendar_connections       │ • appointments           │   │
│  │ • calendar_sync_log          │ • users                  │   │
│  │ • calendar_event_mapping     │ • pets                   │   │
│  │ • settings (sync prefs)      │ • services               │   │
│  └──────────────────────────────┼──────────────────────────┘   │
│                                  │                              │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   │ HTTPS
                                   │
                    ┌──────────────▼────────────────┐
                    │   Google Calendar API         │
                    ├───────────────────────────────┤
                    │ • OAuth 2.0 (Web Server)      │
                    │ • Events API (CRUD)           │
                    │ • Push Notifications          │
                    │ • Batch Operations            │
                    └───────────────────────────────┘
                                   │
                                   │ Webhook (HTTPS POST)
                                   │
                    ┌──────────────▼────────────────┐
                    │ /api/admin/calendar/webhook   │
                    │ (Receives change notifications)│
                    └───────────────────────────────┘
```

### Data Flow

#### Push Sync Flow (App → Google Calendar)

```
Appointment Status Change
         │
         ▼
Check if status matches sync criteria
         │
         ▼
Fetch appointment details + customer + pet + service
         │
         ▼
Check calendar_event_mapping table
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Event     No Event
Exists    Exists
    │         │
    ▼         ▼
UPDATE    CREATE
Event     Event
    │         │
    └────┬────┘
         │
         ▼
Store event_id in calendar_event_mapping
         │
         ▼
Log sync operation in calendar_sync_log
```

#### Pull Sync Flow (Google Calendar → App)

```
Admin Initiates Import
         │
         ▼
Fetch events from Google Calendar
(filtered by date range)
         │
         ▼
For each event:
  - Parse event data
  - Extract customer/pet info from description
  - Check for duplicate appointments
         │
         ▼
Present preview to admin
         │
         ▼
Admin confirms import
         │
         ▼
For each confirmed event:
  - Match/create customer
  - Match/create pet
  - Create appointment
  - Create calendar_event_mapping
  - Log sync operation
```

#### Webhook Flow (Real-time Updates)

```
Google Calendar detects change
         │
         ▼
POST /api/admin/calendar/webhook
         │
         ▼
Validate webhook authenticity
         │
         ▼
Fetch changed event from Google Calendar
         │
         ▼
Check calendar_event_mapping
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Mapped    Not Mapped
Event     Event
    │         │
    ▼         ▼
UPDATE    Log &
Appointment Ignore
    │
    ▼
Log sync operation
```

---

## Data Models & Database Schema

### New Tables

#### 1. `calendar_connections` Table

Stores OAuth tokens and Google Calendar metadata for the admin connection.

```sql
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- OAuth tokens (encrypted at rest)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,

  -- Google Calendar metadata
  calendar_id TEXT NOT NULL, -- Usually "primary"
  calendar_email TEXT NOT NULL,

  -- Webhook channel info
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expiration TIMESTAMPTZ,

  -- Connection status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(admin_id) -- Only one connection per admin (business-wide)
);

-- Index for active connection lookups
CREATE INDEX idx_calendar_connections_active ON calendar_connections(admin_id)
  WHERE is_active = true;

-- Index for webhook expiration checks
CREATE INDEX idx_calendar_connections_webhook_expiry
  ON calendar_connections(webhook_expiration)
  WHERE webhook_expiration IS NOT NULL;
```

#### 2. `calendar_event_mapping` Table

Maps appointments to Google Calendar event IDs for bidirectional sync.

```sql
CREATE TABLE calendar_event_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('push', 'pull')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(appointment_id, connection_id),
  UNIQUE(google_event_id, connection_id)
);

-- Index for appointment lookups
CREATE INDEX idx_calendar_event_mapping_appointment
  ON calendar_event_mapping(appointment_id);

-- Index for Google event lookups (webhook processing)
CREATE INDEX idx_calendar_event_mapping_google_event
  ON calendar_event_mapping(google_event_id);
```

#### 3. `calendar_sync_log` Table

Audit trail of all sync operations for debugging and monitoring.

```sql
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE SET NULL,

  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('push', 'pull', 'bulk', 'webhook')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'import')),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  google_event_id TEXT,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  error_code TEXT,

  -- Metadata
  details JSONB, -- Additional context (e.g., which fields changed)
  duration_ms INTEGER, -- Operation duration

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for recent sync history queries
CREATE INDEX idx_calendar_sync_log_created_at ON calendar_sync_log(created_at DESC);

-- Index for error tracking
CREATE INDEX idx_calendar_sync_log_failed ON calendar_sync_log(status)
  WHERE status = 'failed';

-- Index for appointment history
CREATE INDEX idx_calendar_sync_log_appointment
  ON calendar_sync_log(appointment_id)
  WHERE appointment_id IS NOT NULL;
```

#### 4. `settings` Table Update

Add calendar sync preferences to existing `settings` table.

```sql
-- Insert calendar_sync_settings key
INSERT INTO settings (key, value) VALUES (
  'calendar_sync_settings',
  '{
    "sync_statuses": ["confirmed", "checked_in"],
    "auto_sync_enabled": true,
    "sync_past_appointments": false,
    "sync_completed_appointments": false
  }'::jsonb
);
```

### Schema Changes to Existing Tables

No changes required to existing tables. The integration is fully additive.

### Database Indexes for Performance

All necessary indexes are included in the table definitions above. Key indexes:

1. **Fast connection lookups**: `idx_calendar_connections_active`
2. **Webhook renewal tracking**: `idx_calendar_connections_webhook_expiry`
3. **Bidirectional event mapping**: `idx_calendar_event_mapping_appointment`, `idx_calendar_event_mapping_google_event`
4. **Sync history queries**: `idx_calendar_sync_log_created_at`
5. **Error tracking**: `idx_calendar_sync_log_failed`

---

## API Design

### API Route Structure

```
/api/admin/calendar/
├── auth/
│   ├── start         POST   - Initiate OAuth flow
│   ├── callback      GET    - OAuth callback handler
│   └── disconnect    POST   - Revoke tokens and disconnect
├── sync/
│   ├── manual        POST   - Trigger manual sync of single appointment
│   ├── bulk          POST   - Trigger bulk sync of all appointments
│   └── status        GET    - Get current sync status
├── import/
│   ├── preview       POST   - Preview events from Google Calendar
│   └── confirm       POST   - Confirm and execute import
├── settings/
│   └── route.ts      GET/PUT - Manage sync preferences
├── webhook/
│   └── route.ts      POST   - Handle Google Calendar webhooks
└── connection/
    └── route.ts      GET    - Get connection status and metadata
```

### Detailed API Specifications

#### 1. POST `/api/admin/calendar/auth/start`

**Description**: Initiates Google OAuth 2.0 flow

**Request**:
```typescript
// No body required
```

**Response**:
```typescript
{
  authUrl: string; // Redirect URL to Google OAuth consent screen
}
```

**Implementation**:
```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/calendar/auth/callback`
);

const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Get refresh token
  prompt: 'consent', // Force consent to ensure refresh token
  scope: scopes,
  state: adminUserId, // Pass admin ID for verification
});
```

**Error Codes**:
- `401` - Unauthorized (not admin)
- `409` - Conflict (already connected)
- `500` - Server error

---

#### 2. GET `/api/admin/calendar/auth/callback`

**Description**: OAuth callback handler

**Query Parameters**:
```typescript
{
  code: string;      // Authorization code from Google
  state: string;     // Admin user ID
  error?: string;    // Error if authorization failed
}
```

**Response**: HTTP redirect to `/admin/settings/calendar?status=success` or `?status=error`

**Implementation Flow**:
1. Exchange authorization code for tokens
2. Encrypt and store tokens in `calendar_connections`
3. Fetch calendar metadata (calendar ID, email)
4. Set up webhook channel for push notifications
5. Redirect to settings page

---

#### 3. POST `/api/admin/calendar/auth/disconnect`

**Description**: Disconnect Google Calendar and revoke tokens

**Request**:
```typescript
// No body required
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Implementation**:
1. Revoke tokens with Google
2. Delete all `calendar_event_mapping` entries
3. Delete `calendar_connections` entry
4. Stop webhook channel

---

#### 4. POST `/api/admin/calendar/sync/manual`

**Description**: Manually sync a single appointment

**Request**:
```typescript
{
  appointmentId: string; // UUID
  force?: boolean;       // Force sync even if status doesn't match criteria
}
```

**Response**:
```typescript
{
  success: boolean;
  eventId?: string;      // Google Calendar event ID
  operation: 'created' | 'updated' | 'deleted' | 'skipped';
  message: string;
}
```

**Error Codes**:
- `400` - Invalid appointment ID or validation error
- `404` - Appointment not found
- `429` - Rate limited by Google API
- `500` - Sync failed

---

#### 5. POST `/api/admin/calendar/sync/bulk`

**Description**: Bulk sync all appointments matching criteria

**Request**:
```typescript
{
  dateFrom?: string;     // ISO date (default: today)
  dateTo?: string;       // ISO date (default: +30 days)
  force?: boolean;       // Force sync all, ignore status criteria
}
```

**Response**:
```typescript
{
  jobId: string;         // Background job ID for status tracking
  totalAppointments: number;
  estimated_duration_seconds: number;
}
```

**Implementation**: Initiates background job, returns immediately

---

#### 6. GET `/api/admin/calendar/sync/status`

**Description**: Get sync status for a bulk job or overall sync health

**Query Parameters**:
```typescript
{
  jobId?: string;        // Optional: specific job ID
}
```

**Response**:
```typescript
{
  // If jobId provided
  job?: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: {
      total: number;
      completed: number;
      failed: number;
    };
    startedAt: string;
    completedAt?: string;
    errors?: Array<{
      appointmentId: string;
      error: string;
    }>;
  };

  // Overall sync health
  health: {
    isConnected: boolean;
    lastSyncAt: string | null;
    recentErrors: number;
    webhookStatus: 'active' | 'expired' | 'none';
  };
}
```

---

#### 7. POST `/api/admin/calendar/import/preview`

**Description**: Preview appointments from Google Calendar

**Request**:
```typescript
{
  dateFrom: string;      // ISO date
  dateTo: string;        // ISO date
}
```

**Response**:
```typescript
{
  events: Array<{
    googleEventId: string;
    summary: string;
    description: string;
    start: string;
    end: string;

    // Parsed data (best-effort extraction)
    parsedData: {
      customerName?: string;
      petName?: string;
      phone?: string;
      email?: string;
      serviceName?: string;
    };

    // Matching results
    matches: {
      existingAppointment?: {
        id: string;
        scheduledAt: string;
        customer: string;
        pet: string;
      };
      suggestedCustomer?: {
        id: string;
        name: string;
      };
      suggestedPet?: {
        id: string;
        name: string;
      };
    };

    // Import status
    canImport: boolean;
    importWarnings: string[];
  }>;
}
```

---

#### 8. POST `/api/admin/calendar/import/confirm`

**Description**: Execute import of selected events

**Request**:
```typescript
{
  imports: Array<{
    googleEventId: string;

    // Customer mapping
    customerId?: string;   // Use existing customer
    customerData?: {       // Or create new customer
      firstName: string;
      lastName: string;
      email?: string;
      phone: string;
    };

    // Pet mapping
    petId?: string;        // Use existing pet
    petData?: {            // Or create new pet
      name: string;
      breedId?: string;
      size: 'small' | 'medium' | 'large' | 'xlarge';
      weight?: number;
    };

    // Appointment data
    serviceId: string;
    addonIds?: string[];
    notes?: string;
  }>;
}
```

**Response**:
```typescript
{
  results: Array<{
    googleEventId: string;
    success: boolean;
    appointmentId?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
```

---

#### 9. GET/PUT `/api/admin/calendar/settings`

**Description**: Manage calendar sync preferences

**GET Response**:
```typescript
{
  data: {
    sync_statuses: Array<'confirmed' | 'pending' | 'checked_in' | 'in_progress' | 'completed'>;
    auto_sync_enabled: boolean;
    sync_past_appointments: boolean;
    sync_completed_appointments: boolean;
  };
  last_updated: string | null;
}
```

**PUT Request**:
```typescript
{
  sync_statuses: string[];
  auto_sync_enabled: boolean;
  sync_past_appointments: boolean;
  sync_completed_appointments: boolean;
}
```

**Validation**: Uses Zod schema (defined in types section)

---

#### 10. POST `/api/admin/calendar/webhook`

**Description**: Receive Google Calendar push notifications

**Headers**:
```
X-Goog-Channel-ID: <channel_id>
X-Goog-Channel-Token: <verification_token>
X-Goog-Resource-ID: <resource_id>
X-Goog-Resource-State: <state>
X-Goog-Resource-URI: <resource_uri>
X-Goog-Message-Number: <message_number>
```

**Request Body**: Empty (Google sends notification without event details)

**Response**:
```typescript
{
  success: boolean;
}
```

**Implementation**:
1. Validate webhook authenticity (check channel ID matches stored)
2. Fetch updated event from Google Calendar using resource URI
3. Find mapping in `calendar_event_mapping`
4. Update appointment if mapping exists
5. Log operation

---

#### 11. GET `/api/admin/calendar/connection`

**Description**: Get current connection status

**Response**:
```typescript
{
  isConnected: boolean;
  connection?: {
    calendarEmail: string;
    calendarId: string;
    connectedAt: string;
    lastSyncAt: string | null;
    webhookStatus: 'active' | 'expiring_soon' | 'expired' | 'none';
    webhookExpiresAt: string | null;
  };
}
```

---

## Authentication & Authorization

### Google OAuth 2.0 Implementation

**OAuth Scopes Required**:
```
https://www.googleapis.com/auth/calendar.events
```

**OAuth Flow** (Web Server Application):

1. **Authorization Request**:
```
GET https://accounts.google.com/o/oauth2/v2/auth
  ?client_id={CLIENT_ID}
  &redirect_uri={REDIRECT_URI}
  &response_type=code
  &scope=https://www.googleapis.com/auth/calendar.events
  &access_type=offline
  &prompt=consent
  &state={ADMIN_USER_ID}
```

2. **Token Exchange**:
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code={AUTH_CODE}
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
&redirect_uri={REDIRECT_URI}
&grant_type=authorization_code
```

3. **Response**:
```json
{
  "access_token": "ya29.xxx",
  "refresh_token": "1//xxx",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "https://www.googleapis.com/auth/calendar.events"
}
```

### Token Storage & Encryption

**Encryption Method**: AES-256-GCM using Node.js `crypto` module

```typescript
// lib/calendar/encryption.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Token Refresh Mechanism

```typescript
// lib/calendar/token-manager.ts

import { google } from 'googleapis';
import { decryptToken, encryptToken } from './encryption';
import type { AppSupabaseClient } from '@/lib/supabase/server';

export async function refreshAccessToken(
  supabase: AppSupabaseClient,
  connectionId: string
): Promise<string> {
  // Fetch connection
  const { data: connection } = await supabase
    .from('calendar_connections')
    .select('refresh_token, token_expiry')
    .eq('id', connectionId)
    .single();

  if (!connection) {
    throw new Error('Calendar connection not found');
  }

  // Check if token is expired
  const now = new Date();
  const expiry = new Date(connection.token_expiry);

  if (expiry > now) {
    // Token still valid, decrypt and return
    return decryptToken(connection.access_token);
  }

  // Refresh token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: decryptToken(connection.refresh_token),
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update database
  await supabase
    .from('calendar_connections')
    .update({
      access_token: encryptToken(credentials.access_token!),
      token_expiry: new Date(credentials.expiry_date!).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId);

  return credentials.access_token!;
}
```

### Admin Role Verification

All API routes protected with existing `requireAdmin` middleware:

```typescript
// In every calendar API route
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase); // Throws if not admin

  // ... rest of implementation
}
```

---

## Sync Logic & Algorithms

### Push Sync (App → Google Calendar)

#### Trigger Conditions

Automatic sync triggers when:
1. Appointment status changes to a status in `sync_statuses` setting
2. Appointment details are updated (time, service, customer, pet)
3. Admin manually triggers sync

#### Sync Algorithm

```typescript
// lib/calendar/sync/push.ts

export async function syncAppointmentToGoogle(
  supabase: AppSupabaseClient,
  appointmentId: string,
  connectionId: string
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    // 1. Fetch appointment with all related data
    const appointment = await fetchAppointmentWithRelations(supabase, appointmentId);

    // 2. Check sync criteria
    const settings = await getCalendarSettings(supabase);
    if (!shouldSyncAppointment(appointment, settings)) {
      return { status: 'skipped', reason: 'Does not match sync criteria' };
    }

    // 3. Check if event already exists
    const mapping = await supabase
      .from('calendar_event_mapping')
      .select('google_event_id')
      .eq('appointment_id', appointmentId)
      .eq('connection_id', connectionId)
      .maybeSingle();

    // 4. Get Google Calendar client
    const calendar = await getCalendarClient(supabase, connectionId);

    // 5. Map appointment to Google Calendar event
    const eventData = mapAppointmentToEvent(appointment);

    let googleEventId: string;
    let operation: 'create' | 'update' | 'delete';

    // 6. Perform sync operation
    if (appointment.status === 'cancelled' || appointment.status === 'no_show') {
      // Delete event
      if (mapping?.google_event_id) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: mapping.google_event_id,
        });
        operation = 'delete';
        googleEventId = mapping.google_event_id;

        // Remove mapping
        await supabase
          .from('calendar_event_mapping')
          .delete()
          .eq('id', mapping.id);
      } else {
        return { status: 'skipped', reason: 'No event to delete' };
      }
    } else if (mapping?.google_event_id) {
      // Update existing event
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: mapping.google_event_id,
        requestBody: eventData,
      });
      operation = 'update';
      googleEventId = response.data.id!;
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
      });
      operation = 'create';
      googleEventId = response.data.id!;

      // Create mapping
      await supabase
        .from('calendar_event_mapping')
        .insert({
          appointment_id: appointmentId,
          connection_id: connectionId,
          google_event_id: googleEventId,
          sync_direction: 'push',
        });
    }

    // 7. Log success
    await logSync(supabase, {
      connection_id: connectionId,
      sync_type: 'push',
      operation,
      appointment_id: appointmentId,
      google_event_id: googleEventId,
      status: 'success',
      duration_ms: Date.now() - startTime,
    });

    return { status: 'success', operation, eventId: googleEventId };

  } catch (error) {
    // 8. Log failure
    await logSync(supabase, {
      connection_id: connectionId,
      sync_type: 'push',
      operation: mapping?.google_event_id ? 'update' : 'create',
      appointment_id: appointmentId,
      status: 'failed',
      error_message: error.message,
      error_code: error.code,
      duration_ms: Date.now() - startTime,
    });

    throw error;
  }
}
```

#### Appointment to Event Mapping

```typescript
// lib/calendar/mapping.ts

export function mapAppointmentToEvent(appointment: AppointmentWithRelations): calendar_v3.Schema$Event {
  const { customer, pet, service, addons } = appointment;

  // Calculate duration
  const addonDuration = addons.reduce((sum, addon) => sum + (addon.duration_minutes || 0), 0);
  const totalDuration = service.duration_minutes + addonDuration;

  const startTime = new Date(appointment.scheduled_at);
  const endTime = new Date(startTime.getTime() + totalDuration * 60000);

  // Build event title
  const title = `${service.name} - ${pet.name} (${customer.first_name} ${customer.last_name})`;

  // Build description with customer info
  const addonsList = addons.length > 0
    ? `\n\nAdd-ons:\n${addons.map(a => `- ${a.name}`).join('\n')}`
    : '';

  const notes = appointment.notes
    ? `\n\nNotes: ${appointment.notes}`
    : '';

  const description = `
Customer: ${customer.first_name} ${customer.last_name}
Phone: ${customer.phone || 'N/A'}
Email: ${customer.email}

Pet: ${pet.name}
Size: ${pet.size.toUpperCase()}
Breed: ${pet.breed_custom || 'Unknown'}

Service: ${service.name}${addonsList}

Status: ${appointment.status.toUpperCase()}
Booking Reference: ${appointment.booking_reference}${notes}

---
Managed by The Puppy Day
`.trim();

  return {
    summary: title,
    description: description,
    location: 'The Puppy Day, 14936 Leffingwell Rd, La Mirada, CA 90638',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
      ],
    },
    colorId: getEventColor(appointment.status),
  };
}

function getEventColor(status: string): string {
  // Google Calendar color IDs
  const colorMap = {
    'pending': '5',      // Yellow
    'confirmed': '9',    // Blue
    'checked_in': '10',  // Green
    'in_progress': '10', // Green
    'completed': '8',    // Gray
    'cancelled': '11',   // Red
    'no_show': '11',     // Red
  };

  return colorMap[status] || '9'; // Default to blue
}
```

#### Sync Criteria Check

```typescript
export function shouldSyncAppointment(
  appointment: Appointment,
  settings: CalendarSyncSettings
): boolean {
  // Check if auto-sync is enabled
  if (!settings.auto_sync_enabled) {
    return false;
  }

  // Check if appointment status matches sync criteria
  if (!settings.sync_statuses.includes(appointment.status)) {
    return false;
  }

  // Check if appointment is in the past
  if (!settings.sync_past_appointments) {
    const now = new Date();
    const scheduledAt = new Date(appointment.scheduled_at);
    if (scheduledAt < now) {
      return false;
    }
  }

  // Check if appointment is completed
  if (!settings.sync_completed_appointments && appointment.status === 'completed') {
    return false;
  }

  return true;
}
```

### Pull Sync (Google Calendar → App)

#### Import Wizard Algorithm

```typescript
// lib/calendar/sync/pull.ts

export async function previewGoogleCalendarEvents(
  supabase: AppSupabaseClient,
  connectionId: string,
  dateFrom: string,
  dateTo: string
): Promise<ImportPreview[]> {
  // 1. Get calendar client
  const calendar = await getCalendarClient(supabase, connectionId);

  // 2. Fetch events from Google Calendar
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date(dateFrom).toISOString(),
    timeMax: new Date(dateTo).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  // 3. Process each event
  const previews: ImportPreview[] = [];

  for (const event of events) {
    // Parse event data
    const parsedData = parseEventDescription(event.description || '');

    // Check for duplicate appointment
    const existingAppointment = await findDuplicateAppointment(
      supabase,
      event.start?.dateTime,
      parsedData
    );

    // Find matching customer/pet
    const suggestedCustomer = await findMatchingCustomer(supabase, parsedData);
    const suggestedPet = await findMatchingPet(supabase, parsedData, suggestedCustomer?.id);

    // Determine import status
    const canImport = !existingAppointment;
    const warnings: string[] = [];

    if (existingAppointment) {
      warnings.push('Duplicate appointment already exists');
    }
    if (!suggestedCustomer && !parsedData.customerName) {
      warnings.push('Customer information not found in event');
    }
    if (!suggestedPet && !parsedData.petName) {
      warnings.push('Pet information not found in event');
    }

    previews.push({
      googleEventId: event.id!,
      summary: event.summary || '',
      description: event.description || '',
      start: event.start?.dateTime || '',
      end: event.end?.dateTime || '',
      parsedData,
      matches: {
        existingAppointment,
        suggestedCustomer,
        suggestedPet,
      },
      canImport,
      importWarnings: warnings,
    });
  }

  return previews;
}
```

#### Event Description Parsing

```typescript
export function parseEventDescription(description: string): ParsedEventData {
  const data: ParsedEventData = {};

  // Extract customer name
  const customerMatch = description.match(/Customer:\s*(.+)/i);
  if (customerMatch) {
    data.customerName = customerMatch[1].trim();
  }

  // Extract phone
  const phoneMatch = description.match(/Phone:\s*([\d\s\-\(\)]+)/i);
  if (phoneMatch) {
    data.phone = phoneMatch[1].trim();
  }

  // Extract email
  const emailMatch = description.match(/Email:\s*([^\s\n]+)/i);
  if (emailMatch) {
    data.email = emailMatch[1].trim();
  }

  // Extract pet name
  const petMatch = description.match(/Pet:\s*(.+)/i);
  if (petMatch) {
    data.petName = petMatch[1].trim();
  }

  // Extract service
  const serviceMatch = description.match(/Service:\s*(.+)/i);
  if (serviceMatch) {
    data.serviceName = serviceMatch[1].trim();
  }

  return data;
}
```

#### Duplicate Detection

```typescript
export async function findDuplicateAppointment(
  supabase: AppSupabaseClient,
  scheduledAt: string,
  parsedData: ParsedEventData
): Promise<ExistingAppointment | null> {
  // Search for appointments at same time
  const timeWindow = 30 * 60 * 1000; // 30 minutes
  const startTime = new Date(new Date(scheduledAt).getTime() - timeWindow);
  const endTime = new Date(new Date(scheduledAt).getTime() + timeWindow);

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      customer:users!customer_id(first_name, last_name),
      pet:pets(name)
    `)
    .gte('scheduled_at', startTime.toISOString())
    .lte('scheduled_at', endTime.toISOString());

  if (!appointments || appointments.length === 0) {
    return null;
  }

  // If pet name matches, it's likely a duplicate
  if (parsedData.petName) {
    const match = appointments.find(apt =>
      apt.pet?.name.toLowerCase() === parsedData.petName?.toLowerCase()
    );

    if (match) {
      return {
        id: match.id,
        scheduledAt: match.scheduled_at,
        customer: `${match.customer.first_name} ${match.customer.last_name}`,
        pet: match.pet.name,
      };
    }
  }

  return null;
}
```

### Conflict Resolution Strategy

**Priority Rules**:

1. **App is Source of Truth**: When conflicts occur, app data takes precedence
2. **Manual Override**: Admin can force sync in either direction via UI
3. **Last Write Wins**: If both systems updated simultaneously, most recent update wins
4. **Preserve User Edits**: Never auto-delete events manually created in Google Calendar

**Conflict Detection**:

```typescript
export async function detectConflict(
  appointment: Appointment,
  googleEvent: calendar_v3.Schema$Event,
  lastSyncedAt: Date
): Promise<ConflictInfo | null> {
  const appUpdatedAt = new Date(appointment.updated_at);
  const googleUpdatedAt = new Date(googleEvent.updated!);

  // Both updated after last sync
  if (appUpdatedAt > lastSyncedAt && googleUpdatedAt > lastSyncedAt) {
    return {
      type: 'both_updated',
      appUpdatedAt,
      googleUpdatedAt,
      resolution: googleUpdatedAt > appUpdatedAt ? 'use_google' : 'use_app',
    };
  }

  return null;
}
```

### Idempotency Handling

**Strategy**: Use `google_event_id` as idempotency key

```typescript
// Before creating event
const existingMapping = await supabase
  .from('calendar_event_mapping')
  .select('google_event_id')
  .eq('appointment_id', appointmentId)
  .maybeSingle();

if (existingMapping) {
  // Event already exists, update instead of create
  await calendar.events.update({
    calendarId: 'primary',
    eventId: existingMapping.google_event_id,
    requestBody: eventData,
  });
} else {
  // Create new event
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventData,
  });

  // Store mapping with retry protection
  await supabase
    .from('calendar_event_mapping')
    .insert({
      appointment_id: appointmentId,
      connection_id: connectionId,
      google_event_id: response.data.id!,
      sync_direction: 'push',
    })
    .onConflict('appointment_id,connection_id')
    .ignore(); // Idempotency: ignore duplicate inserts
}
```

---

## Background Jobs & Workers

### Job Queue Architecture

**Option 1: Supabase Edge Functions (Recommended)**

```typescript
// supabase/functions/calendar-sync-job/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { jobType, payload } = await req.json();

  switch (jobType) {
    case 'bulk_sync':
      await handleBulkSync(supabase, payload);
      break;
    case 'webhook_renewal':
      await handleWebhookRenewal(supabase);
      break;
    default:
      return new Response('Unknown job type', { status: 400 });
  }

  return new Response('OK', { status: 200 });
});
```

**Option 2: Next.js API Route with Queue (Alternative)**

```typescript
// lib/calendar/queue.ts

import { createClient } from '@supabase/supabase-js';

interface QueueJob {
  id: string;
  type: string;
  payload: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor: Date;
}

// Simple in-memory queue (for MVP, replace with Redis for production)
const jobQueue: QueueJob[] = [];
let isProcessing = false;

export async function enqueueJob(type: string, payload: unknown): Promise<string> {
  const job: QueueJob = {
    id: crypto.randomUUID(),
    type,
    payload,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    scheduledFor: new Date(),
  };

  jobQueue.push(job);
  processQueue(); // Start processing if not already running

  return job.id;
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (jobQueue.length > 0) {
    const job = jobQueue.shift()!;

    try {
      job.status = 'running';
      await executeJob(job);
      job.status = 'completed';
    } catch (error) {
      job.attempts++;

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        console.error(`Job ${job.id} failed after ${job.attempts} attempts:`, error);
      } else {
        // Re-queue with exponential backoff
        job.scheduledFor = new Date(Date.now() + Math.pow(2, job.attempts) * 1000);
        jobQueue.push(job);
      }
    }
  }

  isProcessing = false;
}
```

### Job Types

#### 1. Bulk Sync Job

```typescript
async function handleBulkSync(
  supabase: AppSupabaseClient,
  payload: { connectionId: string; dateFrom: string; dateTo: string }
) {
  const { connectionId, dateFrom, dateTo } = payload;

  // Fetch appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .gte('scheduled_at', dateFrom)
    .lte('scheduled_at', dateTo);

  // Process in batches of 10 (Google API rate limit consideration)
  const batchSize = 10;
  for (let i = 0; i < appointments.length; i += batchSize) {
    const batch = appointments.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(apt => syncAppointmentToGoogle(supabase, apt.id, connectionId))
    );

    // Wait 1 second between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

#### 2. Webhook Renewal Job

Google Calendar webhooks expire after ~7 days. Need periodic renewal.

```typescript
async function handleWebhookRenewal(supabase: AppSupabaseClient) {
  // Find connections with expiring webhooks (< 1 day remaining)
  const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { data: connections } = await supabase
    .from('calendar_connections')
    .select('*')
    .lt('webhook_expiration', expiryThreshold.toISOString())
    .eq('is_active', true);

  for (const connection of connections) {
    try {
      // Stop old channel
      if (connection.webhook_channel_id) {
        await stopWebhookChannel(connection);
      }

      // Start new channel
      await setupWebhookChannel(supabase, connection.id);

      console.log(`Renewed webhook for connection ${connection.id}`);
    } catch (error) {
      console.error(`Failed to renew webhook for connection ${connection.id}:`, error);
    }
  }
}
```

### Retry Logic

**Exponential Backoff Implementation**:

```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 404 || error.code === 403) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;

      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Job Monitoring

**Status Tracking**:

```typescript
// Store job status in database
CREATE TABLE calendar_sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES calendar_connections(id),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress JSONB, -- { total: 100, completed: 50, failed: 2 }
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Error Handling & Recovery

### Google API Error Handling

#### Rate Limit Handling (429 errors)

```typescript
export async function handleRateLimit(error: any, retryAfter?: number) {
  // Google sends Retry-After header in seconds
  const delay = retryAfter ? retryAfter * 1000 : 60000; // Default 1 minute

  console.log(`Rate limited, waiting ${delay}ms before retry`);
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

#### Network Failure Retry

```typescript
export async function syncWithRetry(
  supabase: AppSupabaseClient,
  appointmentId: string,
  connectionId: string
): Promise<SyncResult> {
  return retryWithBackoff(
    () => syncAppointmentToGoogle(supabase, appointmentId, connectionId),
    3,  // max attempts
    1000 // base delay
  );
}
```

### Partial Sync Failure Recovery

```typescript
export async function bulkSyncWithRecovery(
  supabase: AppSupabaseClient,
  appointmentIds: string[],
  connectionId: string
): Promise<BulkSyncResult> {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const appointmentId of appointmentIds) {
    try {
      await syncAppointmentToGoogle(supabase, appointmentId, connectionId);
      results.successful.push(appointmentId);
    } catch (error) {
      results.failed.push({
        id: appointmentId,
        error: error.message,
      });

      // Continue with remaining appointments
      console.error(`Failed to sync appointment ${appointmentId}:`, error);
    }
  }

  return results;
}
```

### User-Facing Error Messages

```typescript
export function formatUserErrorMessage(error: any): string {
  // Rate limit errors
  if (error.code === 429 || error.message.includes('rateLimitExceeded')) {
    return 'Google Calendar rate limit reached. Please try again in a few minutes.';
  }

  // Authentication errors
  if (error.code === 401 || error.message.includes('invalid_grant')) {
    return 'Google Calendar connection expired. Please reconnect your calendar.';
  }

  // Not found errors
  if (error.code === 404) {
    return 'Calendar event not found. It may have been deleted from Google Calendar.';
  }

  // Permission errors
  if (error.code === 403) {
    return 'Insufficient permissions to access Google Calendar. Please reconnect with full permissions.';
  }

  // Network errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
    return 'Network error connecting to Google Calendar. Please check your internet connection.';
  }

  // Generic error
  return 'An unexpected error occurred while syncing with Google Calendar. Please try again.';
}
```

### Admin Notifications for Critical Failures

```typescript
export async function notifyAdminOfSyncFailure(
  supabase: AppSupabaseClient,
  adminId: string,
  error: SyncError
) {
  // Check if error is critical (e.g., auth failure, webhook expiration)
  if (!error.isCritical) return;

  // Send notification to admin
  await supabase
    .from('notifications_log')
    .insert({
      user_id: adminId,
      notification_type: 'calendar_sync_error',
      channel: 'email',
      subject: 'Google Calendar Sync Error',
      body: `Your Google Calendar integration has encountered an error: ${error.message}. Please visit the settings page to resolve this issue.`,
      status: 'pending',
    });
}
```

---

## Security & Privacy

### OAuth Token Encryption

**Encryption at Rest**: All tokens stored in `calendar_connections` table are encrypted using AES-256-GCM (see Authentication section for implementation)

**Environment Variables**:
```bash
# .env.local
CALENDAR_TOKEN_ENCRYPTION_KEY=<64-character-hex-string>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

### Secure Token Transmission

- All API communication uses HTTPS
- Tokens never exposed in client-side code
- Tokens never logged in server logs
- OAuth flow uses `state` parameter to prevent CSRF

### Customer Data in Calendar Events

**Data Included in Event Description**:
- Customer name
- Customer phone
- Customer email
- Pet name, size, breed
- Service name
- Add-ons
- Appointment status
- Special notes

**Privacy Considerations**:
1. Admin must acknowledge that customer data will be stored in Google Calendar
2. Calendar should be set to private (not shared publicly)
3. Data is formatted in a professional manner suitable for business use
4. Sensitive medical information is NOT included in calendar events

**User Consent**:
- No customer consent required as this is admin-only feature
- Admin is responsible for securing their Google Calendar
- Terms of service should mention calendar integration

### Audit Logging

**All sync operations logged**:
```sql
INSERT INTO calendar_sync_log (
  connection_id,
  sync_type,
  operation,
  appointment_id,
  google_event_id,
  status,
  created_at
) VALUES (...);
```

**Settings changes logged**:
```sql
-- Uses existing settings audit system
INSERT INTO settings_audit_log (
  admin_id,
  setting_type,
  setting_key,
  old_value,
  new_value
) VALUES (...);
```

### Compliance Considerations

**GDPR Compliance**:
- Customer data synced to third-party service (Google)
- Admin responsible for GDPR compliance of their Google account
- Data can be deleted by disconnecting calendar integration
- Sync log provides audit trail for data access

**Data Retention**:
- Calendar events remain in Google Calendar indefinitely unless manually deleted
- Admin can bulk-delete events by disconnecting calendar
- Sync logs retained for 90 days, then archived

**Right to be Forgotten**:
```typescript
export async function deleteCustomerFromCalendar(
  supabase: AppSupabaseClient,
  customerId: string
) {
  // Find all appointments for customer
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('customer_id', customerId);

  // Delete calendar events
  for (const apt of appointments) {
    const mapping = await supabase
      .from('calendar_event_mapping')
      .select('google_event_id, connection_id')
      .eq('appointment_id', apt.id)
      .maybeSingle();

    if (mapping) {
      const calendar = await getCalendarClient(supabase, mapping.connection_id);
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: mapping.google_event_id,
      });

      // Remove mapping
      await supabase
        .from('calendar_event_mapping')
        .delete()
        .eq('appointment_id', apt.id);
    }
  }
}
```

---

## Performance Optimization

### Batch API Calls

**Google Calendar Batch Limit**: 1000 calls per batch

```typescript
export async function batchSyncAppointments(
  supabase: AppSupabaseClient,
  appointmentIds: string[],
  connectionId: string
) {
  const calendar = await getCalendarClient(supabase, connectionId);

  // Split into batches of 50 (conservative limit)
  const batchSize = 50;
  const batches = [];

  for (let i = 0; i < appointmentIds.length; i += batchSize) {
    batches.push(appointmentIds.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    // Create batch request
    const boundary = '===============' + Date.now() + '==';
    const parts: string[] = [];

    for (const appointmentId of batch) {
      const appointment = await fetchAppointmentWithRelations(supabase, appointmentId);
      const eventData = mapAppointmentToEvent(appointment);

      parts.push([
        `--${boundary}`,
        'Content-Type: application/http',
        '',
        'POST /calendar/v3/calendars/primary/events',
        'Content-Type: application/json',
        '',
        JSON.stringify(eventData),
      ].join('\r\n'));
    }

    parts.push(`--${boundary}--`);

    // Execute batch
    await calendar.request({
      method: 'POST',
      url: 'https://www.googleapis.com/batch/calendar/v3',
      headers: {
        'Content-Type': `multipart/mixed; boundary=${boundary}`,
      },
      body: parts.join('\r\n'),
    });

    // Wait between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### Caching Strategies

**Calendar Settings Cache**:
```typescript
// Cache settings in memory for 5 minutes
const settingsCache = new Map<string, { data: CalendarSyncSettings; expiry: number }>();

export async function getCachedSettings(
  supabase: AppSupabaseClient
): Promise<CalendarSyncSettings> {
  const cacheKey = 'calendar_sync_settings';
  const cached = settingsCache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const settings = await fetchSettings(supabase);

  settingsCache.set(cacheKey, {
    data: settings,
    expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return settings;
}
```

**Connection Info Cache**:
```typescript
// Cache connection for 1 minute
const connectionCache = new Map<string, { data: CalendarConnection; expiry: number }>();

export async function getCachedConnection(
  supabase: AppSupabaseClient,
  adminId: string
): Promise<CalendarConnection | null> {
  const cached = connectionCache.get(adminId);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const connection = await fetchConnection(supabase, adminId);

  if (connection) {
    connectionCache.set(adminId, {
      data: connection,
      expiry: Date.now() + 60 * 1000, // 1 minute
    });
  }

  return connection;
}
```

### Webhook-Based Updates vs Polling

**Webhooks (Recommended)**:
- Real-time updates when Google Calendar changes
- No unnecessary API calls
- Efficient resource usage

**Setup**:
```typescript
export async function setupWebhookChannel(
  supabase: AppSupabaseClient,
  connectionId: string
) {
  const calendar = await getCalendarClient(supabase, connectionId);

  const channelId = crypto.randomUUID();
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/calendar/webhook`;

  const response = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      token: process.env.CALENDAR_WEBHOOK_SECRET, // Verification token
    },
  });

  // Store webhook metadata
  await supabase
    .from('calendar_connections')
    .update({
      webhook_channel_id: channelId,
      webhook_resource_id: response.data.resourceId,
      webhook_expiration: new Date(parseInt(response.data.expiration!)).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId);

  return response.data;
}
```

**Fallback Polling** (if webhooks fail):
```typescript
// Cron job runs every 15 minutes
export async function pollForChanges(
  supabase: AppSupabaseClient,
  connectionId: string
) {
  const connection = await supabase
    .from('calendar_connections')
    .select('last_sync_at')
    .eq('id', connectionId)
    .single();

  const calendar = await getCalendarClient(supabase, connectionId);

  // Fetch events updated since last sync
  const response = await calendar.events.list({
    calendarId: 'primary',
    updatedMin: connection.data.last_sync_at,
    singleEvents: true,
  });

  // Process updated events
  for (const event of response.data.items || []) {
    await processUpdatedEvent(supabase, connectionId, event);
  }

  // Update last sync timestamp
  await supabase
    .from('calendar_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', connectionId);
}
```

### Database Query Optimization

**Indexed Queries**:
- All foreign keys have indexes
- `calendar_event_mapping` indexed on both `appointment_id` and `google_event_id`
- `calendar_sync_log` indexed on `created_at` for recent history queries

**Efficient Joins**:
```typescript
// Fetch appointment with all related data in single query
export async function fetchAppointmentWithRelations(
  supabase: AppSupabaseClient,
  appointmentId: string
) {
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:users!customer_id(*),
      pet:pets(*),
      service:services(*),
      addons:appointment_addons(
        addon:addons(*)
      )
    `)
    .eq('id', appointmentId)
    .single();

  return data;
}
```

### Rate Limit Management

**Google Calendar API Quotas**:
- **Queries per day**: 1,000,000 (shared across all users)
- **Queries per 100 seconds per user**: 600
- **Queries per minute per user**: Dynamic (starts low, increases with consistent usage)

**Rate Limit Tracking**:
```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequestsPerMinute = 60; // Conservative limit

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => time > oneMinuteAgo);

    if (this.requests.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requests[0];
      const waitTime = 60000 - (now - oldestRequest);

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

export async function callGoogleAPI<T>(fn: () => Promise<T>): Promise<T> {
  await rateLimiter.waitIfNeeded();
  return fn();
}
```

---

## Testing Strategy

### Unit Tests

**Test Coverage**:
1. Token encryption/decryption
2. Appointment to event mapping
3. Event description parsing
4. Duplicate detection logic
5. Sync criteria evaluation
6. Error formatting

**Example Test**:
```typescript
// __tests__/lib/calendar/mapping.test.ts

import { describe, it, expect } from 'vitest';
import { mapAppointmentToEvent } from '@/lib/calendar/mapping';

describe('mapAppointmentToEvent', () => {
  it('should correctly map appointment to Google Calendar event', () => {
    const appointment = {
      id: '123',
      scheduled_at: '2025-01-15T10:00:00Z',
      status: 'confirmed',
      booking_reference: 'APT-2025-123456',
      customer: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
      },
      pet: {
        name: 'Buddy',
        size: 'medium',
        breed_custom: 'Golden Retriever',
      },
      service: {
        name: 'Basic Grooming',
        duration_minutes: 60,
      },
      addons: [
        { name: 'Teeth Brushing', duration_minutes: 10 },
      ],
      notes: 'Please be gentle, first time',
    };

    const event = mapAppointmentToEvent(appointment);

    expect(event.summary).toBe('Basic Grooming - Buddy (John Doe)');
    expect(event.location).toBe('The Puppy Day, 14936 Leffingwell Rd, La Mirada, CA 90638');
    expect(event.description).toContain('Customer: John Doe');
    expect(event.description).toContain('Pet: Buddy');
    expect(event.description).toContain('Teeth Brushing');
    expect(event.description).toContain('Please be gentle, first time');
    expect(event.start.timeZone).toBe('America/Los_Angeles');

    // Duration should be 70 minutes (60 + 10)
    const startTime = new Date(event.start.dateTime!);
    const endTime = new Date(event.end.dateTime!);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    expect(durationMinutes).toBe(70);
  });
});
```

### Integration Tests

**Test Scenarios**:
1. OAuth flow end-to-end
2. Push sync creating event in Google Calendar
3. Pull sync importing event from Google Calendar
4. Webhook receiving and processing notification
5. Bulk sync processing multiple appointments

**Mock Google Calendar API**:
```typescript
// __tests__/lib/calendar/integration.test.ts

import { vi } from 'vitest';

// Mock googleapis
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => ({
        generateAuthUrl: vi.fn(() => 'https://mock-auth-url.com'),
        getToken: vi.fn(() => Promise.resolve({
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expiry_date: Date.now() + 3600000,
          },
        })),
      })),
    },
    calendar: vi.fn(() => ({
      events: {
        insert: vi.fn(() => Promise.resolve({
          data: { id: 'mock-event-id' },
        })),
        update: vi.fn(() => Promise.resolve({
          data: { id: 'mock-event-id' },
        })),
        delete: vi.fn(() => Promise.resolve({})),
      },
    })),
  },
}));
```

### E2E Tests (Playwright)

**Test Flow**:
1. Admin logs in
2. Navigates to calendar settings
3. Clicks "Connect Google Calendar"
4. Completes OAuth flow (mocked)
5. Verifies connection status
6. Creates appointment
7. Verifies sync status indicator shows success
8. Disconnects calendar
9. Verifies connection removed

### Test Data Generation

**Factory Functions**:
```typescript
// __tests__/factories/appointment.ts

export function createMockAppointment(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    customer_id: crypto.randomUUID(),
    pet_id: crypto.randomUUID(),
    service_id: crypto.randomUUID(),
    scheduled_at: new Date().toISOString(),
    duration_minutes: 60,
    status: 'confirmed',
    payment_status: 'pending',
    total_price: 55.00,
    booking_reference: `APT-2025-${Math.random().toString().slice(2, 8)}`,
    creation_method: 'online',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
```

---

## UI/UX Design

### Admin Settings Page

**Location**: `/admin/settings/calendar`

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│  Google Calendar Integration                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Connection Status                                  │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                    │ │
│  │  ✓ Connected to calendar@thepuppyday.com          │ │
│  │    Last synced: 2 minutes ago                     │ │
│  │                                                    │ │
│  │  [Manual Sync] [Disconnect]                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Sync Settings                                      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                    │ │
│  │  □ Auto-sync enabled                              │ │
│  │                                                    │ │
│  │  Sync appointment statuses:                       │ │
│  │  ☑ Confirmed                                      │ │
│  │  ☑ Checked In                                     │ │
│  │  □ Pending                                        │ │
│  │  □ Completed                                      │ │
│  │                                                    │ │
│  │  [Save Settings]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Import from Google Calendar                        │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                    │ │
│  │  Date Range: [2025-01-01] to [2025-01-31]        │ │
│  │                                                    │ │
│  │  [Preview Events]                                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Sync History                                       │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Date         | Action  | Status   | Details       │ │
│  │──────────────┼─────────┼──────────┼───────────────│ │
│  │ 2 min ago    | Push    | Success  | Apt #123456   │ │
│  │ 5 min ago    | Update  | Success  | Apt #123455   │ │
│  │ 10 min ago   | Import  | Success  | 5 events      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Import Wizard Modal

**Step 1: Select Date Range**

```
┌─────────────────────────────────────────────────┐
│  Import from Google Calendar            [X]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Step 1 of 3: Select Date Range                │
│                                                 │
│  From: [2025-01-01]                            │
│  To:   [2025-01-31]                            │
│                                                 │
│  [Cancel] [Next]                                │
└─────────────────────────────────────────────────┘
```

**Step 2: Preview and Select Events**

```
┌──────────────────────────────────────────────────────────┐
│  Import from Google Calendar                      [X]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Step 2 of 3: Select Events to Import                   │
│                                                          │
│  Found 8 events from Jan 1 - Jan 31, 2025               │
│                                                          │
│  ☑ Jan 5, 10:00 AM - Basic Grooming - Buddy             │
│     Customer: John Doe (555-1234)                       │
│     ⚠ New customer will be created                      │
│                                                          │
│  ☑ Jan 8, 2:00 PM - Premium Grooming - Max              │
│     Customer: Jane Smith (555-5678)                     │
│     ✓ Matched existing customer                         │
│                                                          │
│  □ Jan 10, 11:00 AM - Walk-in grooming                  │
│     ⚠ Duplicate appointment already exists              │
│                                                          │
│  [Back] [Cancel] [Next (2 selected)]                    │
└──────────────────────────────────────────────────────────┘
```

**Step 3: Confirm and Import**

```
┌─────────────────────────────────────────────────┐
│  Import from Google Calendar            [X]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Step 3 of 3: Confirm Import                   │
│                                                 │
│  Ready to import 2 appointments:               │
│                                                 │
│  • 1 new customer will be created              │
│  • 1 new pet will be created                   │
│  • 2 appointments will be created              │
│                                                 │
│  [Back] [Cancel] [Import]                      │
└─────────────────────────────────────────────────┘
```

### Sync Status Indicators

**Dashboard Widget**:

```
┌──────────────────────────────────┐
│  Google Calendar Sync            │
├──────────────────────────────────┤
│                                  │
│  ✓ Connected and syncing         │
│  Last sync: 2 minutes ago        │
│                                  │
│  Recent activity:                │
│  • 5 events synced today         │
│  • 0 errors                      │
│                                  │
│  [View Details]                  │
└──────────────────────────────────┘
```

**Appointment Row Indicator** (in appointments table):

```
Appointment #123456
[Synced to Google Calendar ✓]
```

### Loading States

**During OAuth Flow**:
```
┌─────────────────────────────────────────┐
│  Connecting to Google Calendar...      │
│                                         │
│  [Spinner animation]                   │
│                                         │
│  Please complete authorization in      │
│  the popup window.                     │
└─────────────────────────────────────────┘
```

**During Bulk Sync**:
```
┌─────────────────────────────────────────┐
│  Syncing Appointments...               │
│                                         │
│  [Progress bar: 45/100]                │
│                                         │
│  45 of 100 appointments synced         │
│  2 failed                              │
│                                         │
│  [Cancel]                              │
└─────────────────────────────────────────┘
```

---

## Migration & Rollout Plan

### Database Migrations

**Migration Script** (`migrations/YYYYMMDD_calendar_integration.sql`):

```sql
-- Migration: Calendar Integration Tables
-- Date: 2025-01-15

-- 1. Create calendar_connections table
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_email TEXT NOT NULL,
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expiration TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id)
);

-- 2. Create calendar_event_mapping table
CREATE TABLE IF NOT EXISTS calendar_event_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('push', 'pull')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(appointment_id, connection_id),
  UNIQUE(google_event_id, connection_id)
);

-- 3. Create calendar_sync_log table
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('push', 'pull', 'bulk', 'webhook')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'import')),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  google_event_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  error_code TEXT,
  details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active
  ON calendar_connections(admin_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_calendar_connections_webhook_expiry
  ON calendar_connections(webhook_expiration) WHERE webhook_expiration IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_event_mapping_appointment
  ON calendar_event_mapping(appointment_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_mapping_google_event
  ON calendar_event_mapping(google_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_created_at
  ON calendar_sync_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_failed
  ON calendar_sync_log(status) WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_appointment
  ON calendar_sync_log(appointment_id) WHERE appointment_id IS NOT NULL;

-- 5. Insert default calendar sync settings
INSERT INTO settings (key, value, created_at, updated_at)
VALUES (
  'calendar_sync_settings',
  '{
    "sync_statuses": ["confirmed", "checked_in"],
    "auto_sync_enabled": true,
    "sync_past_appointments": false,
    "sync_completed_appointments": false
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- 6. Enable RLS on new tables
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Only admins can access calendar data
CREATE POLICY "Admins can view calendar connections" ON calendar_connections
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage calendar connections" ON calendar_connections
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view event mappings" ON calendar_event_mapping
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage event mappings" ON calendar_event_mapping
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view sync logs" ON calendar_sync_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

### Rollback Plan

**Rollback Script** (`migrations/YYYYMMDD_rollback_calendar_integration.sql`):

```sql
-- Rollback: Calendar Integration Tables

-- 1. Drop RLS policies
DROP POLICY IF EXISTS "Admins can view calendar connections" ON calendar_connections;
DROP POLICY IF EXISTS "Admins can manage calendar connections" ON calendar_connections;
DROP POLICY IF EXISTS "Admins can view event mappings" ON calendar_event_mapping;
DROP POLICY IF EXISTS "Admins can manage event mappings" ON calendar_event_mapping;
DROP POLICY IF EXISTS "Admins can view sync logs" ON calendar_sync_log;

-- 2. Drop tables (cascading will remove dependent data)
DROP TABLE IF EXISTS calendar_sync_log;
DROP TABLE IF EXISTS calendar_event_mapping;
DROP TABLE IF EXISTS calendar_connections;

-- 3. Remove settings entry
DELETE FROM settings WHERE key = 'calendar_sync_settings';
```

**Note**: Rollback will not delete events from Google Calendar. Admin must manually delete or disconnect calendar before rollback.

### Feature Flag Strategy

**Environment Variable**:
```bash
# .env.local
NEXT_PUBLIC_FEATURE_CALENDAR_INTEGRATION=false
```

**Feature Flag Check**:
```typescript
// lib/features.ts

export const FEATURES = {
  CALENDAR_INTEGRATION: process.env.NEXT_PUBLIC_FEATURE_CALENDAR_INTEGRATION === 'true',
};

// In UI components
import { FEATURES } from '@/lib/features';

{FEATURES.CALENDAR_INTEGRATION && (
  <CalendarIntegrationSettings />
)}
```

### Deployment Checklist

**Pre-Deployment**:
- [ ] Set up Google Cloud Console project
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs
- [ ] Generate encryption key for token storage
- [ ] Set environment variables
- [ ] Run database migrations
- [ ] Test OAuth flow in staging
- [ ] Test webhook endpoint with ngrok/staging URL

**Deployment**:
- [ ] Enable feature flag in production
- [ ] Run database migrations
- [ ] Deploy code to production
- [ ] Verify webhook endpoint is accessible (HTTPS)
- [ ] Monitor error logs
- [ ] Test connection with production Google Calendar

**Post-Deployment**:
- [ ] Document setup process for admin users
- [ ] Create video tutorial for calendar connection
- [ ] Monitor sync success rate
- [ ] Set up alerts for critical failures
- [ ] Schedule webhook renewal cron job

### Admin Onboarding

**Setup Guide** (`docs/admin/calendar-integration-setup.md`):

```markdown
# Google Calendar Integration Setup Guide

## Prerequisites

1. Admin access to The Puppy Day application
2. Google account with Google Calendar enabled
3. Access to business calendar (recommended: create dedicated business calendar)

## Setup Steps

### 1. Navigate to Calendar Settings

1. Log in to The Puppy Day admin panel
2. Go to Settings → Google Calendar

### 2. Connect Google Calendar

1. Click "Connect Google Calendar" button
2. You'll be redirected to Google sign-in
3. Select your Google account
4. Review and accept the requested permissions:
   - See, edit, share, and permanently delete all calendars
5. Click "Allow"
6. You'll be redirected back to The Puppy Day

### 3. Configure Sync Settings

1. Enable "Auto-sync enabled" checkbox
2. Select which appointment statuses to sync:
   - **Confirmed**: Recommended (sync confirmed appointments)
   - **Checked In**: Recommended (sync when customer arrives)
   - **Pending**: Optional (sync pending appointments)
   - **Completed**: Optional (keep completed appointments on calendar)
3. Click "Save Settings"

### 4. Initial Sync (Optional)

If you have existing appointments:

1. Click "Manual Sync" to sync all existing appointments
2. Or use "Import from Google Calendar" to bring in walk-in appointments

## Best Practices

- Keep your Google Calendar private (don't share publicly)
- Review calendar events regularly for accuracy
- Use Import feature for walk-in appointments entered in Google Calendar
- Monitor sync history for any errors

## Troubleshooting

**Connection Lost**
- Go to Settings → Google Calendar
- Click "Disconnect" then "Connect" again

**Appointments Not Syncing**
- Check sync settings are configured correctly
- Verify appointment status matches sync criteria
- Check sync history for errors

**Need Help?**
Contact support at support@thepuppyday.com
```

---

## TypeScript Types & Interfaces

```typescript
// src/types/calendar.ts

import type { calendar_v3 } from 'googleapis';

// ===== DATABASE TYPES =====

export interface CalendarConnection {
  id: string;
  admin_id: string;
  access_token: string; // Encrypted
  refresh_token: string; // Encrypted
  token_expiry: string; // ISO timestamp
  calendar_id: string;
  calendar_email: string;
  webhook_channel_id: string | null;
  webhook_resource_id: string | null;
  webhook_expiration: string | null; // ISO timestamp
  is_active: boolean;
  last_sync_at: string | null; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export interface CalendarEventMapping {
  id: string;
  appointment_id: string;
  connection_id: string;
  google_event_id: string;
  last_synced_at: string;
  sync_direction: 'push' | 'pull';
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncLog {
  id: string;
  connection_id: string | null;
  sync_type: 'push' | 'pull' | 'bulk' | 'webhook';
  operation: 'create' | 'update' | 'delete' | 'import';
  appointment_id: string | null;
  google_event_id: string | null;
  status: 'success' | 'failed' | 'partial';
  error_message: string | null;
  error_code: string | null;
  details: Record<string, unknown> | null;
  duration_ms: number | null;
  created_at: string;
}

// ===== SETTINGS TYPES =====

export interface CalendarSyncSettings {
  sync_statuses: Array<'confirmed' | 'pending' | 'checked_in' | 'in_progress' | 'completed'>;
  auto_sync_enabled: boolean;
  sync_past_appointments: boolean;
  sync_completed_appointments: boolean;
}

export const CalendarSyncSettingsSchema = z.object({
  sync_statuses: z.array(z.enum(['confirmed', 'pending', 'checked_in', 'in_progress', 'completed'])),
  auto_sync_enabled: z.boolean(),
  sync_past_appointments: z.boolean(),
  sync_completed_appointments: z.boolean(),
});

// ===== SYNC OPERATION TYPES =====

export interface SyncResult {
  status: 'success' | 'failed' | 'skipped';
  operation?: 'create' | 'update' | 'delete';
  eventId?: string;
  reason?: string;
  error?: string;
}

export interface BulkSyncResult {
  successful: string[]; // Appointment IDs
  failed: Array<{
    id: string;
    error: string;
  }>;
}

export interface SyncJobStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  startedAt: string;
  completedAt?: string;
  errors?: Array<{
    appointmentId: string;
    error: string;
  }>;
}

// ===== IMPORT WIZARD TYPES =====

export interface ParsedEventData {
  customerName?: string;
  petName?: string;
  phone?: string;
  email?: string;
  serviceName?: string;
}

export interface ExistingAppointment {
  id: string;
  scheduledAt: string;
  customer: string;
  pet: string;
}

export interface ImportPreview {
  googleEventId: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  parsedData: ParsedEventData;
  matches: {
    existingAppointment?: ExistingAppointment;
    suggestedCustomer?: {
      id: string;
      name: string;
    };
    suggestedPet?: {
      id: string;
      name: string;
    };
  };
  canImport: boolean;
  importWarnings: string[];
}

export interface ImportConfirmation {
  googleEventId: string;
  customerId?: string;
  customerData?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  petId?: string;
  petData?: {
    name: string;
    breedId?: string;
    size: 'small' | 'medium' | 'large' | 'xlarge';
    weight?: number;
  };
  serviceId: string;
  addonIds?: string[];
  notes?: string;
}

export interface ImportResult {
  googleEventId: string;
  success: boolean;
  appointmentId?: string;
  error?: string;
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface ManualSyncRequest {
  appointmentId: string;
  force?: boolean;
}

export interface BulkSyncRequest {
  dateFrom?: string;
  dateTo?: string;
  force?: boolean;
}

export interface BulkSyncResponse {
  jobId: string;
  totalAppointments: number;
  estimated_duration_seconds: number;
}

export interface ImportPreviewRequest {
  dateFrom: string;
  dateTo: string;
}

export interface ImportPreviewResponse {
  events: ImportPreview[];
}

export interface ImportConfirmRequest {
  imports: ImportConfirmation[];
}

export interface ImportConfirmResponse {
  results: ImportResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface ConnectionStatusResponse {
  isConnected: boolean;
  connection?: {
    calendarEmail: string;
    calendarId: string;
    connectedAt: string;
    lastSyncAt: string | null;
    webhookStatus: 'active' | 'expiring_soon' | 'expired' | 'none';
    webhookExpiresAt: string | null;
  };
}

export interface SyncHealthResponse {
  health: {
    isConnected: boolean;
    lastSyncAt: string | null;
    recentErrors: number;
    webhookStatus: 'active' | 'expired' | 'none';
  };
}

// ===== APPOINTMENT WITH RELATIONS =====

export interface AppointmentWithRelations extends Appointment {
  customer: User;
  pet: Pet;
  service: Service;
  addons: Array<{
    addon: Addon;
  }>;
}

// ===== ERROR TYPES =====

export interface SyncError extends Error {
  code?: string;
  isCritical?: boolean;
}

export interface ConflictInfo {
  type: 'both_updated' | 'deleted_locally' | 'deleted_remotely';
  appUpdatedAt?: Date;
  googleUpdatedAt?: Date;
  resolution: 'use_app' | 'use_google' | 'manual';
}
```

---

## Implementation Notes

### Google OAuth Credentials Setup

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com
   - Create new project: "The Puppy Day Calendar Integration"
   - Enable Google Calendar API

2. **Configure OAuth Consent Screen**:
   - User Type: External
   - App name: "The Puppy Day"
   - User support email: puppyday14936@gmail.com
   - Scopes: `https://www.googleapis.com/auth/calendar.events`
   - Test users: Add admin email addresses

3. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/admin/calendar/auth/callback` (development)
     - `https://thepuppyday.com/api/admin/calendar/auth/callback` (production)

4. **Store Credentials**:
```bash
# .env.local
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
CALENDAR_TOKEN_ENCRYPTION_KEY=<64-char-hex-string>
CALENDAR_WEBHOOK_SECRET=<random-secret>
```

### Dependencies to Install

```json
{
  "dependencies": {
    "googleapis": "^140.0.0"
  }
}
```

### Environment Variables Checklist

```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Calendar Integration
CALENDAR_TOKEN_ENCRYPTION_KEY=  # Generate: openssl rand -hex 32
CALENDAR_WEBHOOK_SECRET=         # Generate: openssl rand -hex 32

# App URL (for OAuth redirect and webhooks)
NEXT_PUBLIC_APP_URL=https://thepuppyday.com
```

### Webhook URL Requirements

**Important**: Google Calendar webhooks require:
- HTTPS (not HTTP)
- Publicly accessible URL
- Valid SSL certificate
- Fast response time (< 10 seconds)

**For Development**:
- Use ngrok or similar tunneling service
- Update webhook URL in Google Calendar channel
- Test with staging environment before production

### Security Considerations

1. **Token Encryption**: All OAuth tokens encrypted at rest using AES-256-GCM
2. **HTTPS Only**: All communication with Google APIs over HTTPS
3. **CSRF Protection**: OAuth state parameter validates callback
4. **Webhook Verification**: Verify channel ID and token on webhook requests
5. **Admin-Only**: All routes protected with `requireAdmin` middleware
6. **Audit Logging**: All sync operations logged for compliance

### Performance Considerations

1. **Rate Limiting**: Conservative rate limits (60 requests/minute) to avoid Google API throttling
2. **Batch Operations**: Sync up to 50 appointments per batch
3. **Caching**: Cache calendar settings and connection info (1-5 minute TTL)
4. **Webhooks**: Real-time updates instead of polling
5. **Background Jobs**: Long-running sync operations run asynchronously
6. **Database Indexes**: All foreign keys and frequently queried fields indexed

---

## Appendix: Research Sources

This design was informed by the following authoritative sources on Google Calendar API integration:

### Official Google Documentation

1. [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2) - Official OAuth 2.0 documentation showing web server application flow, token refresh, and scope management.

2. [Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server) - Detailed guide on server-side OAuth implementation with refresh tokens.

3. [Push notifications | Google Calendar](https://developers.google.com/workspace/calendar/api/guides/push) - Comprehensive guide on setting up webhook channels for real-time calendar change notifications.

4. [Events: watch | Google Calendar API](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch) - API reference for creating watch channels with required fields and parameters.

5. [Manage quotas | Google Calendar](https://developers.google.com/workspace/calendar/api/guides/quota) - Updated December 11, 2025, covering per-minute rate limiting, exponential backoff, and quota management best practices.

6. [Send batch requests | Google Calendar](https://developers.google.com/workspace/calendar/api/guides/batch) - Documentation on batch API operations with 1000 request limit and conflict handling.

7. [Handle API errors | Google Calendar](https://developers.google.com/workspace/calendar/api/guides/errors) - Error handling patterns for rate limits (403/429), authentication failures, and retry strategies.

### Implementation Guides

8. [Integrating Google Calendar with OAuth2 in Node.js - DEV Community](https://dev.to/divofred/integrating-google-calendar-with-oauth2-in-nodejs-530i) - Practical tutorial on Node.js OAuth integration with Google Calendar API (September 2025).

9. [Google Calendar Webhooks with Node.js • Stateful](https://stateful.com/blog/google-calendar-webhooks) - Implementation guide for webhook-based synchronization with notification message handling.

10. [Build and host your own Calendy-like scheduling page using Next.js and Google APIs - DEV Community](https://dev.to/timfee/build-and-host-your-own-calendy-like-scheduling-page-using-nextjs-and-google-apis-5ack) - Next.js-specific implementation patterns for calendar integration.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-26
**Author**: Feature Design Architect
**Status**: Ready for Review
