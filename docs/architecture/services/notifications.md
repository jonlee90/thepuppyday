# Notification Service - Architecture Documentation

> **Module**: Notification System
> **Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\`
> **Status**: 🚧 Phase 8 In Progress (Tasks 0116-0119 completed)
> **Channels**: Email (Resend), SMS (Twilio)

## Overview

Comprehensive multi-channel notification system with template management, customer preferences, retry logic, and detailed logging.

---

## Architecture

### DefaultNotificationService

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\service.ts`

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

**Send Flow** (10 steps):
```typescript
async send(message: NotificationMessage): Promise<NotificationResult> {
  // 1. Check if notification type enabled in settings
  const isEnabled = await this.isNotificationEnabled(type, channel);
  if (!isEnabled) return { success: false, error: 'Type disabled' };

  // 2. Check user preferences (if userId provided)
  const allowed = await checkNotificationAllowed(supabase, userId, type, channel);
  if (!allowed.allowed) return { success: false, error: allowed.reason };

  // 3. Load template by type and channel
  const template = await queries.getTemplateByTypeAndChannel(type, channel);

  // 4. Render template with provided data
  const rendered = await this.templateEngine.render(template, data);

  // 5. Validate SMS length if applicable
  if (channel === 'sms' && rendered.message.length > MAX_SMS_LENGTH) {
    console.warn('SMS message truncated');
  }

  // 6. Create pending log entry
  const logId = await this.logger.create({
    customer_id: userId,
    type, channel, recipient,
    status: 'pending',
  });

  // 7. Send via appropriate provider
  const providerResult = channel === 'email'
    ? await this.emailProvider.send(rendered)
    : await this.smsProvider.send(rendered);

  // 8. Update log entry with result
  await this.logger.update(logId, {
    status: providerResult.success ? 'sent' : 'failed',
    error_message: providerResult.error,
    sent_at: providerResult.success ? new Date() : null,
  });

  // 9. If failed and transient error, schedule retry
  if (!providerResult.success) {
    const errorType = classifyError(providerResult.error);
    if (errorType.retryable) {
      await this.retryManager.scheduleRetry(logId, attempt);
    }
  }

  // 10. Return result
  return providerResult;
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
- `appointment_reminder` - Reminder before appointment (24h, 1h)
- `retention_reminder` - Encourage rebooking after X weeks
- `promotional` - Special offers and promotions
- `newsletter` - Monthly updates

---

## Customer Preferences

### Preference Structure
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\types\preferences.ts`

```typescript
interface NotificationPreferences {
  marketing_enabled: boolean;              // Master switch for marketing
  email_appointment_reminders: boolean;    // Email reminders
  sms_appointment_reminders: boolean;      // SMS reminders
  email_retention_reminders: boolean;      // Email retention
  sms_retention_reminders: boolean;        // SMS retention
}

const DEFAULT_NOTIFICATION_PREFERENCES = {
  marketing_enabled: true,
  email_appointment_reminders: true,
  sms_appointment_reminders: true,
  email_retention_reminders: true,
  sms_retention_reminders: true,
};
```

### Preference Helpers
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\preferences.ts`

```typescript
// Get user preferences with defaults fallback
async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  // Merge with defaults to ensure all keys exist
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.preferences };
}

// Check if notification allowed for user
async function checkNotificationAllowed(
  supabase: SupabaseClient,
  userId: string,
  notificationType: string,
  channel: NotificationChannel
): Promise<{ allowed: boolean; reason?: string }> {
  // Transactional notifications always allowed
  if (isTransactionalNotification(notificationType)) {
    return { allowed: true };
  }

  // Check marketing master switch
  const prefs = await getNotificationPreferences(supabase, userId);
  if (!prefs.marketing_enabled) {
    return { allowed: false, reason: 'Marketing disabled' };
  }

  // Check specific channel/type combination
  if (notificationType === 'appointment_reminder' && channel === 'email') {
    if (!prefs.email_appointment_reminders) {
      return { allowed: false, reason: 'Email reminders disabled' };
    }
  }

  return { allowed: true };
}

// Disable all marketing communications
async function disableMarketing(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from('users')
    .update({
      preferences: {
        marketing_enabled: false,
        email_appointment_reminders: false,
        sms_appointment_reminders: false,
        email_retention_reminders: false,
        sms_retention_reminders: false,
      }
    })
    .eq('id', userId);
}
```

---

## Unsubscribe System

### Token Generation
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\unsubscribe.ts`

```typescript
function generateUnsubscribeToken(payload: UnsubscribePayload): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;

  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const signature = hmac.digest('base64url');

  // Format: base64url(payload).base64url(signature)
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${signature}`;
}
```

### Token Validation
```typescript
function validateUnsubscribeToken(token: string): UnsubscribePayload | null {
  try {
    const [payloadB64, signatureB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Verify signature using constant-time comparison
    const expectedSignature = /* regenerate signature */;
    if (!crypto.timingSafeEqual(
      Buffer.from(signatureB64, 'base64url'),
      Buffer.from(expectedSignature, 'base64url')
    )) {
      return null; // Invalid signature
    }

    // Check expiration (30 days)
    if (payload.expiresAt < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
```

### Unsubscribe URL Generation
```typescript
function generateUnsubscribeUrl(
  userId: string,
  notificationType: string,
  channel: NotificationChannel
): string {
  const payload = {
    userId,
    notificationType,
    channel,
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  };

  const token = generateUnsubscribeToken(payload);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/unsubscribe?token=${token}`;
}

// For general marketing unsubscribe
function generateMarketingUnsubscribeUrl(userId: string): string {
  const payload = { userId, notificationType: 'marketing', expiresAt: ... };
  const token = generateUnsubscribeToken(payload);
  return `${baseUrl}/api/unsubscribe?token=${token}`;
}
```

---

## Template System

### Template Structure
```typescript
interface NotificationTemplate {
  id: string;
  type: string;              // 'appointment_reminder', 'booking_confirmation', etc.
  channel: NotificationChannel; // 'email' or 'sms'
  subject: string | null;    // Email subject (null for SMS)
  body: string;              // Template body with {{variables}}
  variables: string[];       // ['customerName', 'appointmentDate', ...]
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Template Variables
```typescript
const TEMPLATE_VARIABLES = {
  // Customer
  customerName: 'Customer full name',
  customerEmail: 'Customer email address',
  customerPhone: 'Customer phone number',

  // Pet
  petName: 'Pet name',
  petBreed: 'Pet breed',
  petSize: 'Pet size (small, medium, large, xlarge)',

  // Appointment
  appointmentDate: 'Appointment date (formatted)',
  appointmentTime: 'Appointment time',
  appointmentId: 'Appointment ID',
  serviceName: 'Service name',
  totalPrice: 'Total price (formatted)',

  // Business
  businessName: 'The Puppy Day',
  businessPhone: '(657) 252-2903',
  businessAddress: '14936 Leffingwell Rd, La Mirada, CA 90638',

  // Unsubscribe
  unsubscribeUrl: 'Generated unsubscribe URL',
};
```

### Template Rendering
```typescript
class DefaultTemplateEngine implements TemplateEngine {
  async render(
    template: NotificationTemplate,
    data: Record<string, unknown>
  ): Promise<RenderedTemplate> {
    let renderedSubject = template.subject || '';
    let renderedBody = template.body;

    // Replace all {{variable}} placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), String(value));
      renderedBody = renderedBody.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return {
      subject: renderedSubject,
      message: renderedBody,
    };
  }
}
```

### Example Templates

**Email: Appointment Reminder (24h)**:
```
Subject: Appointment Reminder - {{petName}} at The Puppy Day

Hi {{customerName}},

This is a reminder that {{petName}} has an appointment for {{serviceName}} tomorrow at {{appointmentTime}}.

📅 Date: {{appointmentDate}}
⏰ Time: {{appointmentTime}}
🐕 Pet: {{petName}}
✂️ Service: {{serviceName}}

Please arrive 5 minutes early. If you need to reschedule, call us at {{businessPhone}}.

See you soon!
The Puppy Day Team

---
{{unsubscribeUrl}}
```

**SMS: Appointment Ready**:
```
{{petName}} is ready for pickup at The Puppy Day! 🎉
Call when you arrive: {{businessPhone}}
```

---

## Email Provider (Resend)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\providers\email.ts`

```typescript
class ResendEmailProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(rendered: RenderedTemplate): Promise<ProviderResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: 'The Puppy Day <noreply@thepuppyday.com>',
        to: rendered.recipient,
        subject: rendered.subject,
        html: this.convertToHTML(rendered.message),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private convertToHTML(text: string): string {
    // Convert plain text to HTML with basic formatting
    return text
      .split('\n')
      .map(line => line ? `<p>${line}</p>` : '<br>')
      .join('');
  }
}
```

---

## SMS Provider (Twilio)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\providers\sms.ts`

```typescript
class TwilioSMSProvider implements SMSProvider {
  private client: Twilio;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async send(rendered: RenderedTemplate): Promise<ProviderResult> {
    try {
      // Truncate if exceeds SMS length
      const message = rendered.message.substring(0, MAX_SMS_LENGTH);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: rendered.recipient,
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'twilio',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

---

## Error Handling & Retry

### Error Classification
```typescript
interface ErrorClassification {
  type: 'transient' | 'permanent' | 'configuration';
  retryable: boolean;
  description: string;
}

function classifyError(error: string): ErrorClassification {
  // Transient errors (retry)
  if (error.includes('rate limit') || error.includes('timeout')) {
    return { type: 'transient', retryable: true, description: 'Temporary issue' };
  }

  // Permanent errors (don't retry)
  if (error.includes('invalid email') || error.includes('unsubscribed')) {
    return { type: 'permanent', retryable: false, description: 'Invalid recipient' };
  }

  // Configuration errors (don't retry)
  if (error.includes('API key') || error.includes('authentication')) {
    return { type: 'configuration', retryable: false, description: 'Config issue' };
  }

  // Default: retry
  return { type: 'transient', retryable: true, description: 'Unknown error' };
}
```

### Retry Configuration
```typescript
interface RetryConfig {
  maxAttempts: number;          // Maximum retry attempts
  initialDelay: number;         // Initial retry delay (ms)
  maxDelay: number;             // Maximum retry delay (ms)
  backoffMultiplier: number;    // Exponential backoff multiplier
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 60000,          // 1 minute
  maxDelay: 3600000,            // 1 hour
  backoffMultiplier: 2,         // Double delay each retry
};
```

### Retry Scheduling
```typescript
function calculateRetryTimestamp(
  attempt: number,
  config: RetryConfig
): Date {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );

  return new Date(Date.now() + delay);
}

// Retry attempts: 1min, 2min, 4min (capped at 1hr max)
```

---

## Notification Logging

**Table**: `notifications_log`

```typescript
interface NotificationLog {
  id: string;
  customer_id: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;           // Email or phone
  subject: string | null;      // Email subject
  message: string;             // Sent message
  status: NotificationStatus;  // 'pending', 'sent', 'failed'
  error_message: string | null;
  sent_at: string | null;
  is_test: boolean;
  created_at: string;
}
```

**Logger Implementation**:
```typescript
class DefaultNotificationLogger implements NotificationLogger {
  async create(entry: CreateNotificationLogEntry): Promise<string> {
    const { data } = await this.supabase
      .from('notifications_log')
      .insert(entry)
      .select('id')
      .single();

    return data.id;
  }

  async update(id: string, updates: Partial<NotificationLog>): Promise<void> {
    await this.supabase
      .from('notifications_log')
      .update(updates)
      .eq('id', id);
  }

  async getFailedLogs(limit: number): Promise<NotificationLog[]> {
    const { data } = await this.supabase
      .from('notifications_log')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data;
  }
}
```

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

## Related Documentation

- [Unsubscribe Pages](../routes/unsubscribe.md)
- [Cron Jobs](../services/cron.md)
- [Email Templates](../templates/email.md)

---

**Last Updated**: 2025-12-20
