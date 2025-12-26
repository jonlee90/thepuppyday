/**
 * Calendar Integration Types for The Puppy Day
 * Google Calendar bidirectional sync - Admin-only feature
 */

import { z } from 'zod';

// ===========================
// Enums and Constants
// ===========================

/**
 * Sync direction for calendar events
 */
export const SyncDirection = {
  PUSH: 'push',
  PULL: 'pull',
} as const;

export type SyncDirectionType = (typeof SyncDirection)[keyof typeof SyncDirection];

/**
 * Sync type for logging operations
 */
export const SyncType = {
  PUSH: 'push',
  PULL: 'pull',
  BULK: 'bulk',
  WEBHOOK: 'webhook',
} as const;

export type SyncTypeType = (typeof SyncType)[keyof typeof SyncType];

/**
 * Sync operation type
 */
export const SyncOperation = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  IMPORT: 'import',
} as const;

export type SyncOperationType = (typeof SyncOperation)[keyof typeof SyncOperation];

/**
 * Sync status
 */
export const SyncStatus = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export type SyncStatusType = (typeof SyncStatus)[keyof typeof SyncStatus];

/**
 * Appointment statuses that can trigger sync
 */
export const AppointmentStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatusType = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

// ===========================
// Database Entity Types
// ===========================

/**
 * Calendar connection entity
 * Stores OAuth tokens and Google Calendar metadata
 */
export interface CalendarConnection {
  id: string;
  admin_id: string;

  // OAuth tokens (encrypted at rest)
  access_token: string;
  refresh_token: string;
  token_expiry: string; // ISO timestamp

  // Google Calendar metadata
  calendar_id: string;
  calendar_email: string;

  // Webhook channel info
  webhook_channel_id: string | null;
  webhook_resource_id: string | null;
  webhook_expiration: string | null; // ISO timestamp

  // Connection status
  is_active: boolean;
  last_sync_at: string | null; // ISO timestamp

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Calendar event mapping entity
 * Maps appointments to Google Calendar event IDs
 */
export interface CalendarEventMapping {
  id: string;
  appointment_id: string;
  connection_id: string;
  google_event_id: string;

  // Sync metadata
  last_synced_at: string; // ISO timestamp
  sync_direction: SyncDirectionType;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Calendar sync log entry
 * Audit trail for all sync operations
 */
export interface CalendarSyncLog {
  id: string;
  connection_id: string | null;

  // Sync details
  sync_type: SyncTypeType;
  operation: SyncOperationType;
  appointment_id: string | null;
  google_event_id: string | null;

  // Status
  status: SyncStatusType;
  error_message: string | null;
  error_code: string | null;

  // Metadata
  details: Record<string, unknown> | null;
  duration_ms: number | null;

  // Timestamp
  created_at: string;
}

/**
 * Calendar sync settings
 * Stored in settings table as JSON
 */
export interface CalendarSyncSettings {
  sync_statuses: AppointmentStatusType[];
  auto_sync_enabled: boolean;
  sync_past_appointments: boolean;
  sync_completed_appointments: boolean;
  notification_preferences?: {
    send_success_notifications: boolean;
    send_failure_notifications: boolean;
  };
}

// ===========================
// API Request/Response Types
// ===========================

/**
 * OAuth token response from Google
 */
export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number; // Unix timestamp in milliseconds
  token_type: string;
  scope: string;
}

/**
 * Google Calendar metadata
 */
export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  primary?: boolean;
}

/**
 * Google Calendar event data
 */
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status?: string;
  created?: string;
  updated?: string;
}

/**
 * Calendar connection status
 */
export interface CalendarConnectionStatus {
  connected: boolean;
  connection?: {
    id: string;
    calendar_email: string;
    calendar_id: string;
    last_sync_at: string | null;
    is_active: boolean;
  };
  sync_stats?: {
    total_synced: number;
    last_24h: number;
    failed_last_24h: number;
  };
}

/**
 * Manual sync request
 */
export interface ManualSyncRequest {
  appointmentId: string;
  force?: boolean;
}

/**
 * Manual sync response
 */
export interface ManualSyncResponse {
  success: boolean;
  eventId?: string;
  operation: 'created' | 'updated' | 'deleted' | 'skipped';
  message: string;
}

/**
 * Bulk sync request
 */
export interface BulkSyncRequest {
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  force?: boolean;
}

/**
 * Bulk sync response
 */
export interface BulkSyncResponse {
  jobId: string;
  totalAppointments: number;
  estimatedDurationSeconds: number;
}

/**
 * Sync status response
 */
export interface SyncStatusResponse {
  jobId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: {
    processed: number;
    total: number;
    percentage: number;
  };
  results?: {
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: Array<{
    appointmentId: string;
    error: string;
  }>;
}

/**
 * Import preview request
 */
export interface ImportPreviewRequest {
  dateFrom: string; // ISO date
  dateTo: string; // ISO date
  calendarId?: string;
}

/**
 * Import event preview
 */
export interface ImportEventPreview {
  event_id: string;
  title: string;
  description?: string;
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  duration_minutes: number;
  location?: string;
  // Parsed data (if available)
  parsed?: {
    customer_name?: string;
    pet_name?: string;
    service_name?: string;
  };
  // Potential duplicates
  potential_duplicates?: Array<{
    appointment_id: string;
    customer_name: string;
    pet_name: string;
    scheduled_at: string;
    match_score: number;
  }>;
}

/**
 * Import preview response
 */
export interface ImportPreviewResponse {
  events: ImportEventPreview[];
  total: number;
  dateRange: {
    from: string;
    to: string;
  };
}

/**
 * Import confirm request
 */
export interface ImportConfirmRequest {
  imports: Array<{
    event_id: string;
    customer_id: string;
    pet_id: string;
    service_id: string;
    addon_ids?: string[];
    notes?: string;
    skip_duplicate_check?: boolean;
  }>;
}

/**
 * Import confirm response
 */
export interface ImportConfirmResponse {
  success: boolean;
  imported: number;
  failed: number;
  results: Array<{
    event_id: string;
    success: boolean;
    appointment_id?: string;
    error?: string;
  }>;
}

/**
 * Sync result for internal use
 */
export interface SyncResult {
  success: boolean;
  operation: SyncOperationType;
  appointment_id: string;
  google_event_id?: string;
  error?: {
    code: string;
    message: string;
  };
  duration_ms: number;
  details?: Record<string, unknown>;
}

// ===========================
// Zod Validation Schemas
// ===========================

/**
 * Zod schema for sync direction
 */
export const syncDirectionSchema = z.enum(['push', 'pull']);

/**
 * Zod schema for sync type
 */
export const syncTypeSchema = z.enum(['push', 'pull', 'bulk', 'webhook']);

/**
 * Zod schema for sync operation
 */
export const syncOperationSchema = z.enum(['create', 'update', 'delete', 'import']);

/**
 * Zod schema for sync status
 */
export const syncStatusSchema = z.enum(['success', 'failed', 'partial']);

/**
 * Zod schema for appointment status
 */
export const appointmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

/**
 * Zod schema for calendar sync settings
 */
export const calendarSyncSettingsSchema = z.object({
  sync_statuses: z.array(appointmentStatusSchema),
  auto_sync_enabled: z.boolean(),
  sync_past_appointments: z.boolean(),
  sync_completed_appointments: z.boolean(),
  notification_preferences: z.object({
    send_success_notifications: z.boolean(),
    send_failure_notifications: z.boolean(),
  }).optional(),
});

/**
 * Zod schema for manual sync request
 */
export const manualSyncRequestSchema = z.object({
  appointmentId: z.string().uuid(),
  force: z.boolean().optional(),
});

/**
 * Zod schema for bulk sync request
 */
export const bulkSyncRequestSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  force: z.boolean().optional(),
});

/**
 * Zod schema for import preview request
 */
export const importPreviewRequestSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  calendarId: z.string().optional(),
});

/**
 * Zod schema for import confirm request
 */
export const importConfirmRequestSchema = z.object({
  imports: z.array(
    z.object({
      event_id: z.string(),
      customer_id: z.string().uuid(),
      pet_id: z.string().uuid(),
      service_id: z.string().uuid(),
      addon_ids: z.array(z.string().uuid()).optional(),
      notes: z.string().optional(),
      skip_duplicate_check: z.boolean().optional(),
    })
  ),
});

/**
 * Zod schema for Google OAuth tokens
 */
export const googleOAuthTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expiry_date: z.number(),
  token_type: z.string(),
  scope: z.string(),
});

/**
 * Zod schema for calendar connection status
 */
export const calendarConnectionStatusSchema = z.object({
  connected: z.boolean(),
  connection: z.object({
    id: z.string().uuid(),
    calendar_email: z.string().email(),
    calendar_id: z.string(),
    last_sync_at: z.string().nullable(),
    is_active: z.boolean(),
  }).optional(),
  sync_stats: z.object({
    total_synced: z.number(),
    last_24h: z.number(),
    failed_last_24h: z.number(),
  }).optional(),
});

// ===========================
// Utility Types
// ===========================

/**
 * Input for creating a calendar connection
 */
export type CreateCalendarConnectionInput = Omit<
  CalendarConnection,
  'id' | 'created_at' | 'updated_at' | 'is_active' | 'last_sync_at'
>;

/**
 * Input for updating calendar connection metadata
 */
export type UpdateCalendarConnectionInput = Partial<
  Pick<
    CalendarConnection,
    'calendar_id' | 'calendar_email' | 'webhook_channel_id' | 'webhook_resource_id' | 'webhook_expiration' | 'last_sync_at'
  >
>;

/**
 * Input for creating a calendar event mapping
 */
export type CreateCalendarEventMappingInput = Omit<
  CalendarEventMapping,
  'id' | 'created_at' | 'updated_at' | 'last_synced_at'
>;

/**
 * Input for creating a sync log entry
 */
export type CreateCalendarSyncLogInput = Omit<CalendarSyncLog, 'id' | 'created_at'>;

/**
 * Appointment data for calendar event mapping
 */
export interface AppointmentForSync {
  id: string;
  customer_id: string;
  pet_id: string;
  service_id: string;
  scheduled_at: string;
  status: AppointmentStatusType;
  notes: string | null;
  // Joined data
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  pet: {
    name: string;
    size: string;
  };
  service: {
    name: string;
    duration_minutes: number;
  };
  addons?: Array<{
    addon_id: string;
    addon_name: string;
    duration_minutes: number;
  }>;
}
