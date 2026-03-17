# Notification Service - Architecture Documentation

> **Module**: Notification System
> **Location**: `src/lib/notifications/`
> **Status**: Completed (Phase 8 + NT Redesign)
> **Channels**: Email (Resend)
> **Last Updated**: 2026-03-16

## Overview

Email notification system with template management, customer preferences, retry logic with exponential backoff, and detailed logging. Supports both mock and production providers via environment-based factory.

---

## Architecture

### File Structure

```
src/lib/notifications/
  service.ts              # DefaultNotificationService - main orchestrator
  types.ts                # All TypeScript interfaces and types
  database-types.ts       # Database table row/insert/update types
  errors.ts               # Error classification and retry timestamp calculation
  retry-manager.ts        # Retry processing logic
  logger.ts               # Notification logger implementation
  preferences.ts          # Customer preference checking
  unsubscribe.ts          # Unsubscribe token generation/validation
  template-engine.ts      # Template rendering engine
  template-helpers.ts     # Template utility functions
  email-base.ts           # Base HTML email layout
  email-templates.ts      # Email template definitions
  query-helpers.ts        # Supabase query helpers for notifications
  index.ts                # Module exports
  providers/
    index.ts              # Provider factory (mock vs production)
  templates/
    email-base.html       # Base HTML email layout with mood banner placeholder
  triggers/
    index.ts              # Trigger module exports
    booking-confirmation.ts
    appointment-status.ts
    report-card-completion.ts
    waitlist-notification.ts
    appointment-reminder.ts
    appointment-cancelled.ts
    appointment-rescheduled.ts
    review-request.ts
    waitlist-added.ts

src/lib/resend/
  provider.ts             # ResendProvider (EmailProvider implementation)
  client.ts               # Resend client factory with mock support
```

### DefaultNotificationService

**File**: `src/lib/notifications/service.ts`

**Purpose**: Main orchestrator for the entire notification workflow.

**Constructor**:
```typescript
constructor(
  supabase: SupabaseClient,
  emailProvider: EmailProvider,
  templateEngine: TemplateEngine,
  logger: NotificationLogger,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
)
```

**Send Flow** (9 steps):
```typescript
async send(message: NotificationMessage): Promise<NotificationResult> {
  // 1. Check if notification type is enabled in settings
  const isEnabled = await this.isNotificationEnabled(type, channel);

  // 2. Check user preferences (if userId provided)
  const allowedCheck = await checkNotificationAllowed(supabase, userId, type, channel);

  // 3. Load template by type and channel
  const template = await queries.templates.getByTypeAndChannel(type, channel);

  // 4. Render template with provided data
  const rendered = this.renderTemplateFromObject(template, message.templateData);

  // 5. Create pending log entry
  const logId = await this.logger.create({
    customerId: message.userId,
    type, channel, recipient,
    status: 'pending',
    templateId: template.id,
    templateData: message.templateData,
    retryCount: 0,
    isTest: false,
  });

  // 6. Send via email provider
  const sendResult = await this.sendEmail(recipient, rendered);

  // 7. Update log entry with result
  await this.logger.update(logId, {
    status: sendResult.success ? 'sent' : 'failed',
    sentAt: sendResult.success ? new Date() : undefined,
    messageId: sendResult.messageId,
  });

  // 8. If failed and transient error, schedule retry via handleSendFailure
  if (!sendResult.success) {
    await this.handleSendFailure(logId, errorMessage, 0);
  }

  return { success, messageId, logId };
}
```

**Batch Sending**: `sendBatch(messages)` processes notifications in chunks of 10 with 100ms delay between chunks.

**Factory Function**:
```typescript
export function createNotificationService(
  supabase, emailProvider, templateEngine, logger, retryConfig?
): NotificationService
```

---

## Core Types

**File**: `src/lib/notifications/types.ts`

### NotificationMessage
```typescript
interface NotificationMessage {
  type: string;                    // notification_type from settings
  channel: NotificationChannel;   // 'email'
  recipient: string;              // Email address
  templateData: Record<string, unknown>;
  userId?: string;                // Optional customer ID for tracking
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}
```

### NotificationResult
```typescript
interface NotificationResult {
  success: boolean;
  messageId?: string;   // Provider message ID (Resend)
  error?: string;
  logId?: string;       // Database log entry ID
}
```

### RenderedTemplate
```typescript
interface RenderedTemplate {
  subject?: string;       // For email
  html?: string;          // For email
  text: string;           // Email plain text
  characterCount: number;
  warnings?: string[];
}
```

---

## Notification Types

### Active Notification Types

| Type | Email | Category |
|------|-------|----------|
| `booking_confirmation` | Yes | Transactional |
| `appointment_reminder` | Yes | Marketing |
| `appointment_cancelled` | Yes | Transactional |
| `appointment_rescheduled` | Yes | Transactional |
| `review_request` | Yes | Marketing |
| `waitlist_added` | Yes | Transactional |
| `waitlist_available` | Yes | Transactional |
| `report_card_ready` | Yes | Transactional |
| `retention_reminder` | Yes | Marketing |
| `payment_failed` | Yes | Transactional |
| `payment_reminder` | Yes | Transactional |
| `payment_success` | Yes | Transactional |
| `payment_final_notice` | Yes | Transactional |

**Transactional** notifications are always sent (cannot be disabled by customer).
**Marketing** notifications respect customer preferences.

---

## Notification Triggers

**Location**: `src/lib/notifications/triggers/`

Trigger modules are event-based functions that compose `NotificationMessage` objects and send them via the notification service.

### Booking Confirmation (`booking-confirmation.ts`)
```typescript
export async function triggerBookingConfirmation(data: BookingConfirmationTriggerData): Promise<BookingConfirmationTriggerResult>
export function validateBookingConfirmationData(data: unknown): boolean
```

### Appointment Status (`appointment-status.ts`)
```typescript
export async function triggerAppointmentStatus(data: AppointmentStatusTriggerData): Promise<AppointmentStatusTriggerResult>
export function validateAppointmentStatusData(data: unknown): boolean
export function shouldSendStatusNotification(oldStatus: string, newStatus: string): boolean
```

### Report Card Completion (`report-card-completion.ts`)
```typescript
export async function triggerReportCardCompletion(data: ReportCardCompletionTriggerData): Promise<ReportCardCompletionTriggerResult>
export function validateReportCardCompletionData(data: unknown): boolean
export function shouldSendReportCardNotification(reportCard: unknown): boolean
```

### Waitlist Notification (`waitlist-notification.ts`)
```typescript
export async function triggerWaitlistNotification(data: WaitlistNotificationTriggerData): Promise<WaitlistNotificationTriggerResult>
export async function triggerWaitlistNotificationBatch(data: WaitlistNotificationTriggerData[]): Promise<WaitlistBatchNotificationResult>
export function validateWaitlistNotificationData(data: unknown): boolean
export async function handleWaitlistExpiration(data: unknown): Promise<void>
```

### Appointment Reminder (`appointment-reminder.ts`)
```typescript
export async function triggerAppointmentReminder(data: AppointmentReminderTriggerData): Promise<NotificationTriggerResult>
```

### Appointment Cancelled (`appointment-cancelled.ts`)
```typescript
export async function triggerAppointmentCancelled(data: AppointmentCancelledTriggerData): Promise<NotificationTriggerResult>
```

### Appointment Rescheduled (`appointment-rescheduled.ts`)
```typescript
export async function triggerAppointmentRescheduled(data: AppointmentRescheduledTriggerData): Promise<NotificationTriggerResult>
```

### Review Request (`review-request.ts`)
```typescript
export async function triggerReviewRequest(data: ReviewRequestTriggerData): Promise<NotificationTriggerResult>
```

### Waitlist Added (`waitlist-added.ts`)
```typescript
export async function triggerWaitlistAdded(data: WaitlistAddedTriggerData): Promise<NotificationTriggerResult>
```

---

## Email Mood System

**File**: `src/lib/notifications/email-base.ts`

The mood system adds contextual colored banners to emails based on notification intent.

### Mood Types

```typescript
type EmailMood = 'celebration' | 'reminder' | 'urgent' | 'info' | 'warning' | 'success';
```

| Mood | Background | Emoji | Use Case |
|------|-----------|-------|----------|
| `celebration` | Green | 🎉 | Booking confirmations, report cards, review requests |
| `reminder` | Blue | ⏰ | Appointment reminders, retention |
| `urgent` | Red | 🚨 | Waitlist available (time-sensitive) |
| `info` | Blue | ℹ️ | Cancelled, rescheduled, waitlist added |
| `warning` | Amber | ⚠️ | Payment failed, final notice |
| `success` | Green | ✅ | Payment success |

### Reusable Component Functions

```typescript
createPetHero(petName, context?)      // Dog emoji + pet name hero section
createPrimaryCTA(text, url)           // Gold pill button (#D4A574) with VML fallback
createSecondaryCTA(text, url)         // Outlined gold pill button
createDangerCTA(text, url)            // Red pill button (#DC2626)
createTimeComparison(oldDate, oldTime, newDate, newTime)  // Rescheduled appointment layout
createDivider()                       // Gold gradient horizontal rule
createTip(text)                       // Cream callout with paw emoji
```

### Base Email Template

**File**: `src/lib/notifications/templates/email-base.html`

- Charcoal header (#434E54) with paw print emoji and "The Puppy Day" in Georgia serif
- Gold gradient accent strip
- `{{MOOD_BANNER}}` placeholder for mood-specific banner injection
- `{{CONTENT}}` placeholder for email body
- Footer with gold gradient divider and unsubscribe link

### Usage

```typescript
import { wrapEmailContent } from '@/lib/notifications/email-base';

const html = wrapEmailContent(bodyHtml, {
  mood: 'celebration',
  moodTitle: 'Appointment Confirmed!'
});
```

---

## Email Provider (Resend)

**File**: `src/lib/resend/provider.ts`

```typescript
export class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;  // Default: 'The Puppy Day <noreply@thepuppyday.com>'
  private resend: unknown;    // Dynamically imported Resend SDK

  constructor(apiKey?: string, fromEmail?: string)
  // apiKey defaults to process.env.RESEND_API_KEY
  // fromEmail defaults to DEFAULT_FROM_EMAIL

  async send(params: EmailParams): Promise<EmailResult>
}
```

**EmailParams** (from `types.ts`):
```typescript
interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}
```

**Error Handling**: Transforms Resend-specific errors (invalid API key, rate limit, invalid email, invalid from address) into user-friendly messages.

**Factory Functions**:
```typescript
export function createResendProvider(apiKey?, fromEmail?): EmailProvider
export function getResendProvider(): ResendProvider  // Global singleton
export function resetResendProvider(): void          // For testing
```

### Resend Client Utility

**File**: `src/lib/resend/client.ts`

Lower-level email client factory used for direct email sending outside the notification service:

```typescript
export function getResendClient(): AnyResendClient   // Mock-aware singleton
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}): Promise<{ id: string; error: Error | null }>
```

Uses `config.useMocks` to switch between `createMockResendClient()` and real Resend SDK.

---

## Provider Factory

**File**: `src/lib/notifications/providers/index.ts`

Environment-based provider selection with singleton caching:

```typescript
export function getEmailProvider(): EmailProvider
// Returns MockResendProvider when NEXT_PUBLIC_USE_MOCKS=true
// Returns ResendProvider (production) otherwise

export function getProviderMode(): 'mock' | 'production'
export function resetAllProviders(): void  // For testing
```

Production provider is dynamically `require()`-d from `src/lib/resend/provider`.

---

## Template System

### Database Template Structure

**File**: `src/lib/notifications/database-types.ts`

```typescript
interface NotificationTemplateRow {
  id: string;
  name: string;
  description: string | null;
  type: string;                     // notification_type
  trigger_event: string;
  channel: NotificationChannel;     // 'email'
  subject_template: string | null;  // Email subject with {{variables}}
  html_template: string | null;     // Email HTML with {{variables}}
  text_template: string;            // Email plain text with {{variables}}
  variables: TemplateVariable[];    // JSONB array of variable definitions
  is_active: boolean;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
```

### Template Engine

**File**: `src/lib/notifications/template-engine.ts`

```typescript
interface TemplateEngine {
  render(template: string, data: Record<string, unknown>, businessContext?: BusinessContext): string;
  validate(template: string, requiredVariables: TemplateVariable[]): TemplateValidationResult;
  calculateCharacterCount(template: string, variables: TemplateVariable[]): number;
  calculateSegmentCount(text: string): number;
}
```

### Template Rendering in Service

The `renderTemplateFromObject` method processes template fields:
```typescript
private renderTemplateFromObject(
  template: {
    subject_template: string | null;
    html_template: string | null;
    text_template: string;
  },
  data: Record<string, unknown>
): RenderedTemplate
```

### Common Template Variables
```typescript
interface CommonTemplateData {
  customer_name?: string;
  pet_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  service_name?: string;
  total_price?: string | number;
  business?: BusinessContext;
}
```

---

## Error Handling & Retry

### Error Classification

**File**: `src/lib/notifications/errors.ts`

```typescript
enum ErrorType {
  TRANSIENT = 'transient',     // Temporary error, should retry
  PERMANENT = 'permanent',     // Permanent error, don't retry
  RATE_LIMIT = 'rate_limit',   // Rate limit, retry with delay
  VALIDATION = 'validation',   // Validation error, don't retry
}

interface ClassifiedError {
  type: ErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number;
  originalError?: unknown;
}

function classifyError(error: string): ClassifiedError
function calculateRetryTimestamp(attempt: number, config: RetryConfig): Date
```

### Retry Configuration
```typescript
interface RetryConfig {
  maxRetries: number;       // Maximum retry attempts
  baseDelay: number;        // Base delay in seconds
  maxDelay: number;         // Maximum delay in seconds
  jitterFactor: number;     // Randomness factor (e.g., 0.3 = +/-30%)
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 30,      // 30 seconds
  maxDelay: 300,       // 5 minutes
  jitterFactor: 0.3,   // +/-30%
};
```

### Failure Handling in Service

When a send fails:
1. Error is classified via `classifyError()`
2. If retryable and `currentRetryCount < maxRetries`, retry is scheduled with exponential backoff
3. Log entry updated with error message, `retryCount`, and `retryAfter` timestamp
4. If non-retryable or max retries exceeded, marked as permanently failed

---

## Notification Logging

### Logger Interface
```typescript
interface NotificationLogger {
  create(entry: Partial<NotificationLogEntry>): Promise<string>;
  update(id: string, updates: Partial<NotificationLogEntry>): Promise<void>;
  get(id: string): Promise<NotificationLogEntry | null>;
  query(filters: NotificationLogQueryFilters): Promise<NotificationLogEntry[]>;
}
```

### Log Entry Fields (camelCase)
```typescript
interface NotificationLogEntry {
  id: string;
  customerId?: string;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  content: string;
  status: NotificationStatus;    // 'pending' | 'sent' | 'failed'
  errorMessage?: string;
  sentAt?: Date;
  templateId?: string;
  templateData?: Record<string, unknown>;
  retryCount: number;
  retryAfter?: Date;
  isTest: boolean;
  messageId?: string;            // Provider message ID
  campaignId?: string;
  trackingId?: string;
  clickedAt?: Date;
  deliveredAt?: Date;
  costCents?: number;
  createdAt: Date;
}
```

### Database Row (snake_case)

**File**: `src/lib/notifications/database-types.ts`

```typescript
interface NotificationLogRow {
  id: string;
  customer_id: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  template_id: string | null;
  template_data: Record<string, unknown> | null;
  retry_count: number;
  retry_after: string | null;
  is_test: boolean;
  message_id: string | null;
  campaign_id: string | null;
  campaign_send_id: string | null;
  tracking_id: string | null;
  clicked_at: string | null;
  delivered_at: string | null;
  cost_cents: number | null;
  created_at: string;
}
```

---

## Notification Settings

### Database Structure
```typescript
interface NotificationSettingsRow {
  notification_type: string;       // Primary key
  email_enabled: boolean;

  email_template_id: string | null;
  schedule_cron: string | null;
  schedule_enabled: boolean;
  max_retries: number;
  retry_delays_seconds: number[];
  last_sent_at: string | null;
  total_sent_count: number;
  total_failed_count: number;
  created_at: string;
  updated_at: string;
}
```

---

## Template History

Versioned history of template changes:
```typescript
interface NotificationTemplateHistoryRow {
  id: string;
  template_id: string;
  version: number;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string;
  channel: NotificationChannel;
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
  variables: TemplateVariable[] | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}
```

---

## Customer Preferences

**File**: `src/lib/notifications/preferences.ts`

```typescript
async function checkNotificationAllowed(
  supabase: SupabaseClient,
  userId: string,
  notificationType: string,
  channel: NotificationChannel
): Promise<{ allowed: boolean; reason?: string }>
```

- Transactional notifications are always allowed
- Marketing notifications check customer's `marketing_enabled` preference
- Specific channel/type combinations check individual preferences

---

## Unsubscribe System

**File**: `src/lib/notifications/unsubscribe.ts`

- HMAC-signed tokens with 30-day expiry
- Constant-time signature verification
- Supports per-type and marketing-wide unsubscribe

---

## API Endpoints

### Customer Preferences
- `GET /api/customer/preferences/notifications` - Get preferences
- `PUT /api/customer/preferences/notifications` - Update preferences

### Admin
- `GET /api/admin/notifications/templates` - List templates
- `POST /api/admin/notifications/templates` - Create template
- `PUT /api/admin/notifications/templates/[id]` - Update template
- `DELETE /api/admin/notifications/templates/[id]` - Delete template
- `GET /api/admin/notifications/log` - View notification log
- `POST /api/admin/notifications/test` - Send test notification

### Public
- `GET /api/unsubscribe?token=xxx` - Process unsubscribe

---

## Metrics

```typescript
interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalClicked: number;
  deliveryRate: number;
  clickRate: number;
  byChannel: {
    email: ChannelMetrics;
  };
  byType: Record<string, TypeMetrics>;
  timeline: TimelineData[];
  failureReasons: Array<{ reason: string; count: number; percentage: number }>;
}
```

Retrieved via `service.getMetrics(startDate, endDate)`.

---

## Related Documentation

- [Database Schema](../ARCHITECTURE.md#database-schema) - `notifications_log`, `notification_templates`, `notification_settings`, `notification_template_history` tables
- [Supabase Integration](../services/supabase.md)

---

**Last Updated**: 2026-03-16 by Claude Code
**Changes**: Marked NT redesign as complete. All 13 email templates redesigned with mood banners and pet hero sections. New triggers: grooming complete (with Yelp review link), admin new booking, admin cancellation, admin no-show. Double-wrapping prevention in email base. Email mood system fully implemented with 6 mood types and 7 reusable component functions.
