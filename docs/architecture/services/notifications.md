# Notification Service - Architecture Documentation

> **Module**: Notification System
> **Location**: `src/lib/notifications/`
> **Status**: Completed (Phase 8)
> **Channels**: Email (Resend), SMS (Twilio)
> **Last Updated**: 2026-03-06

## Overview

Comprehensive multi-channel notification system with template management, customer preferences, retry logic with exponential backoff, and detailed logging. Supports both mock and production providers via environment-based factory.

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
  triggers/
    index.ts              # Trigger module exports
    booking-confirmation.ts
    appointment-status.ts
    report-card-completion.ts
    waitlist-notification.ts

src/lib/resend/
  provider.ts             # ResendProvider (EmailProvider implementation)
  client.ts               # Resend client factory with mock support

src/lib/twilio/
  provider.ts             # TwilioProvider (SMSProvider implementation)
```

### DefaultNotificationService

**File**: `src/lib/notifications/service.ts`

**Purpose**: Main orchestrator for the entire notification workflow.

**Constructor**:
```typescript
constructor(
  supabase: SupabaseClient,
  emailProvider: EmailProvider,
  smsProvider: SMSProvider,
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

  // 5. Validate SMS length if applicable
  if (channel === 'sms') { this.validateSMSLength(rendered.text); }

  // 6. Create pending log entry
  const logId = await this.logger.create({
    customerId: message.userId,
    type, channel, recipient,
    status: 'pending',
    templateId: template.id,
    templateData: message.templateData,
    retryCount: 0,
    isTest: false,
  });

  // 7. Send via appropriate provider
  const sendResult = channel === 'email'
    ? await this.sendEmail(recipient, rendered)
    : await this.sendSMS(recipient, rendered.text);

  // 8. Update log entry with result
  await this.logger.update(logId, {
    status: sendResult.success ? 'sent' : 'failed',
    sentAt: sendResult.success ? new Date() : undefined,
    messageId: sendResult.messageId,
  });

  // 9. If failed and transient error, schedule retry via handleSendFailure
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
  supabase, emailProvider, smsProvider, templateEngine, logger, retryConfig?
): NotificationService
```

---

## Core Types

**File**: `src/lib/notifications/types.ts`

### NotificationMessage
```typescript
interface NotificationMessage {
  type: string;                    // notification_type from settings
  channel: NotificationChannel;   // 'email' | 'sms'
  recipient: string;              // Email address or phone number
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
  messageId?: string;   // Provider message ID (Resend/Twilio)
  error?: string;
  logId?: string;       // Database log entry ID
}
```

### RenderedTemplate
```typescript
interface RenderedTemplate {
  subject?: string;       // For email
  html?: string;          // For email
  text: string;           // For SMS or email plain text
  characterCount: number;
  segmentCount?: number;  // SMS segments
  warnings?: string[];
}
```

---

## Notification Types

### Transactional Notifications
**Always sent** (cannot be disabled by customer):
- `booking_confirmation` - Appointment booked
- `booking_cancellation` - Appointment cancelled
- `status_update` - Appointment status changed
- `report_card_ready` - Grooming report card available
- `waitlist_available` - Waitlist slot opened

### Marketing Notifications
**Respect customer preferences**:
- `appointment_reminder` - Reminder before appointment
- `retention_reminder` - Encourage rebooking
- `promotional` - Special offers
- `newsletter` - Monthly updates

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

## SMS Provider (Twilio)

**File**: `src/lib/twilio/provider.ts`

```typescript
export class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;  // Default: '+16572522903'
  private client: unknown;    // Dynamically imported Twilio SDK

  constructor(accountSid?: string, authToken?: string, fromPhone?: string)
  // Defaults to TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars

  async send(params: SMSParams): Promise<SMSResult>
}
```

**SMSParams** (from `types.ts`):
```typescript
interface SMSParams {
  to: string;     // Recipient phone (E.164 format)
  from?: string;  // Sender phone (optional)
  body: string;
}
```

**SMSResult**:
```typescript
interface SMSResult {
  success: boolean;
  messageId?: string;     // Twilio SID
  segmentCount?: number;
  error?: string;
}
```

**Phone Number Normalization**: Converts formats like `(657) 252-2903` to `+16572522903` (E.164).

**SMS Segment Calculation**: Single segment up to 160 chars; multi-segment at 153 chars per segment.

**Error Handling**: Transforms Twilio error codes (20003, 21211, 21212, 21408, 21610, 30007, 429) into descriptive messages.

**Factory Functions**:
```typescript
export function createTwilioProvider(accountSid?, authToken?, fromPhone?): SMSProvider
export function getTwilioProvider(): TwilioProvider  // Global singleton
export function resetTwilioProvider(): void          // For testing
```

---

## Provider Factory

**File**: `src/lib/notifications/providers/index.ts`

Environment-based provider selection with singleton caching:

```typescript
export function getEmailProvider(): EmailProvider
// Returns MockResendProvider when NEXT_PUBLIC_USE_MOCKS=true
// Returns ResendProvider (production) otherwise

export function getSMSProvider(): SMSProvider
// Returns MockTwilioProvider when NEXT_PUBLIC_USE_MOCKS=true
// Returns TwilioProvider (production) otherwise

export function getProviderMode(): 'mock' | 'production'
export function resetAllProviders(): void  // For testing
```

Production providers are dynamically `require()`-d from `src/lib/resend/provider` and `src/lib/twilio/provider`.

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
  channel: NotificationChannel;     // 'email' | 'sms'
  subject_template: string | null;  // Email subject with {{variables}}
  html_template: string | null;     // Email HTML with {{variables}}
  text_template: string;            // SMS or email plain text with {{variables}}
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
  sms_enabled: boolean;
  email_template_id: string | null;
  sms_template_id: string | null;
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
    sms: ChannelMetrics;
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

**Last Updated**: 2026-03-06 by Claude Code
**Changes**: Fixed provider class names (ResendProvider, TwilioProvider), corrected file paths to relative, fixed RetryConfig fields (maxRetries not maxAttempts, baseDelay/maxDelay/jitterFactor), corrected template fields (subject_template, html_template, text_template), documented logger camelCase fields, added notification triggers, added provider factory, accurate to source code.
