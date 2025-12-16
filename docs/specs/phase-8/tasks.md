# Phase 8: Notifications & Integrations - Implementation Tasks

## Overview

This document contains the implementation checklist for Phase 8: Notifications & Integrations. Each task is designed for a code-generation LLM to implement in a test-driven manner, building incrementally on previous work.

**References:**
- Requirements: `docs/specs/phase-8/requirements.md`
- Design: `docs/specs/phase-8/design.md`

---

## 1. Foundation & Database Schema

- [ ] **1.1 Create notification database schema and migrations**
  - Create `notification_templates` table with fields: id, name, description, type, trigger_event, channel, subject_template, html_template, text_template, variables (JSONB), is_active, version, created_by, updated_by, timestamps
  - Create `notification_settings` table with fields: notification_type, email_enabled, sms_enabled, email_template_id, sms_template_id, schedule_cron, schedule_enabled, max_retries, retry_delays_seconds, last_sent_at, total_sent_count, total_failed_count
  - Create `notification_template_history` table for version tracking
  - Add columns to existing `notifications_log` table: template_id, template_data, retry_count, retry_after, is_test
  - Create all required indexes for performance
  - References: Req 1.8, Req 11.6, Req 11.8, Req 14.2, Req 15.4
  - Complexity: Medium

- [ ] **1.2 Create database functions and triggers for notification statistics**
  - Implement `update_notification_stats()` function to track sent/failed counts
  - Create trigger on notifications_log to update notification_settings statistics
  - Implement `save_template_version()` function for template versioning
  - Create trigger on notification_templates to save version history on update
  - Write unit tests for trigger behavior
  - References: Req 11.8, Req 13.7, Req 15.4
  - Complexity: Medium

- [ ] **1.3 Seed default notification settings**
  - Insert default settings for: booking_confirmation, appointment_reminder, status_checked_in, status_ready, report_card_ready, waitlist_available, retention_reminder, payment_failed, payment_reminder
  - Configure default channel enablement and retry settings
  - Write tests to verify seed data
  - References: Req 13.1, Req 13.6
  - Complexity: Small

---

## 2. Core Type Definitions & Interfaces

- [ ] **2.1 Define TypeScript interfaces for notification system**
  - Create `NotificationMessage` interface with type, channel, recipient, templateData, priority, scheduledFor
  - Create `NotificationResult` interface with success, messageId, error, logId
  - Create `NotificationService` interface with send, sendBatch, renderTemplate, processRetries, getMetrics methods
  - Create `EmailProvider` and `SMSProvider` interfaces with send methods
  - Create `EmailParams`, `EmailResult`, `SMSParams`, `SMSResult` types
  - Create `TemplateVariable`, `NotificationTemplate`, `RenderedTemplate` types
  - Create `RetryConfig`, `RetryResult`, `ClassifiedError` types
  - Place in `src/lib/notifications/types.ts`
  - References: Req 1.1, Req 1.4, Req 1.5, Req 1.8
  - Complexity: Small

- [ ] **2.2 Define database types for notification tables**
  - Extend Supabase generated types with notification_templates, notification_settings, notification_template_history
  - Create type-safe query helpers for notification tables
  - References: Req 1.8
  - Complexity: Small

---

## 3. Template Engine Implementation

- [ ] **3.1 Implement template engine with variable substitution**
  - Create `HandlebarsTemplateEngine` class implementing `TemplateEngine` interface
  - Implement `render()` method with `{{variable}}` substitution including nested objects (e.g., `{{business.phone}}`)
  - Add business context data (name, address, phone, email, hours, website) to all templates automatically
  - Implement character count and SMS segment calculation
  - Write unit tests for variable substitution, nested objects, missing variables
  - Place in `src/lib/notifications/template-engine.ts`
  - References: Req 2.3, Req 2.6, Req 3.3, Req 3.5, Req 17.1
  - Complexity: Medium

- [ ] **3.2 Implement template validation**
  - Add `validate()` method to check required variables are present in template
  - Extract variables from template content using regex
  - Validate required variables are defined in variables array
  - Return ValidationResult with errors array
  - Write unit tests for validation logic
  - References: Req 11.4, Req 11.5
  - Complexity: Small

- [ ] **3.3 Add SMS character optimization utilities**
  - Create function to calculate character count with maximum variable lengths
  - Implement segment count calculation (160 chars per segment)
  - Add warning detection for messages over 160 characters
  - Implement URL shortening placeholder for links
  - Write tests for character counting and segment calculation
  - References: Req 18.1, Req 18.2, Req 18.3, Req 18.4, Req 18.5
  - Complexity: Small

---

## 4. Mock Provider Implementations

- [ ] **4.1 Implement MockResendProvider for email**
  - Create `MockResendProvider` class implementing `EmailProvider` interface
  - Implement `send()` method with simulated network delay (100-300ms)
  - Add 5% random failure rate for testing error handling
  - Generate mock message IDs in format `mock_email_{timestamp}_{random}`
  - Store sent emails in memory array for inspection during tests
  - Add `getSentEmails()` and `clearSentEmails()` helper methods
  - Console log all email operations with `[Mock Resend]` prefix
  - Write unit tests for success and failure scenarios
  - Place in `src/mocks/resend/provider.ts`
  - References: Req 1.2, Req 2.1, Req 2.7, Req 2.8
  - Complexity: Medium

- [ ] **4.2 Implement MockTwilioProvider for SMS**
  - Create `MockTwilioProvider` class implementing `SMSProvider` interface
  - Implement `send()` method with simulated network delay (150-400ms)
  - Validate phone number format (must start with +1)
  - Add 3% random failure rate for testing error handling
  - Calculate and return segment count based on message length
  - Generate mock SIDs in format `SM{timestamp}{random}`
  - Store sent messages in memory array for inspection during tests
  - Add `getSentMessages()` and `clearSentMessages()` helper methods
  - Console log all SMS operations with `[Mock Twilio]` prefix
  - Write unit tests for success, failure, and validation scenarios
  - Place in `src/mocks/twilio/provider.ts`
  - References: Req 1.2, Req 3.1, Req 3.6, Req 3.7, Req 3.8
  - Complexity: Medium

---

## 5. Real Provider Implementations

- [ ] **5.1 Implement ResendProvider for production email**
  - Create `ResendProvider` class implementing `EmailProvider` interface
  - Initialize with API key from `RESEND_API_KEY` environment variable
  - Implement `send()` method using Resend SDK
  - Use "puppyday14936@gmail.com" as from address
  - Include both HTML and plain text versions in emails
  - Return Resend message ID on success
  - Handle and transform Resend-specific errors
  - Write integration test (disabled by default, requires API key)
  - Place in `src/lib/resend/provider.ts`
  - References: Req 2.1, Req 2.4, Req 2.7, Req 2.8, Req 17.8
  - Complexity: Medium

- [ ] **5.2 Implement TwilioProvider for production SMS**
  - Create `TwilioProvider` class implementing `SMSProvider` interface
  - Initialize with Account SID, Auth Token, and phone number from environment variables
  - Implement `send()` method using Twilio SDK
  - Use "(657) 252-2903" as from phone number (convert to E.164 format)
  - Return Twilio message SID and segment count on success
  - Handle multi-part messages automatically (messages over 160 chars)
  - Handle and transform Twilio-specific errors
  - Write integration test (disabled by default, requires credentials)
  - Place in `src/lib/twilio/provider.ts`
  - References: Req 3.1, Req 3.4, Req 3.6, Req 3.7, Req 3.8
  - Complexity: Medium

- [ ] **5.3 Create provider factory with environment-based selection**
  - Create `getEmailProvider()` function that returns MockResendProvider or ResendProvider based on `NEXT_PUBLIC_USE_MOCKS`
  - Create `getSMSProvider()` function that returns MockTwilioProvider or TwilioProvider based on `NEXT_PUBLIC_USE_MOCKS`
  - Implement singleton pattern for provider instances
  - Write tests to verify correct provider selection
  - Place in `src/lib/notifications/providers/index.ts`
  - References: Req 1.2, Req 1.3, Req 1.7
  - Complexity: Small

---

## 6. Error Handling & Retry Logic

- [ ] **6.1 Implement error classification system**
  - Create `ErrorType` enum with TRANSIENT, PERMANENT, RATE_LIMIT, VALIDATION
  - Create `ClassifiedError` interface with type, message, retryable, statusCode
  - Implement `classifyError()` function to categorize errors
  - Handle network errors (ECONNRESET, ETIMEDOUT) as transient
  - Handle HTTP status codes: 429 (rate limit), 5xx (transient), 4xx (permanent/validation)
  - Write unit tests for all error classification scenarios
  - Place in `src/lib/notifications/errors.ts`
  - References: Req 15.1, Req 15.5
  - Complexity: Small

- [ ] **6.2 Implement exponential backoff with jitter**
  - Create `RetryConfig` interface with maxRetries, baseDelay, maxDelay, jitterFactor
  - Implement `calculateRetryDelay()` function with exponential backoff formula
  - Add jitter (randomness) to prevent thundering herd
  - Create `DEFAULT_RETRY_CONFIG` constant (2 retries, 30s base, 300s max, 0.3 jitter)
  - Write unit tests for delay calculation
  - Place in `src/lib/notifications/retry.ts`
  - References: Req 15.1, Req 15.2, Req 15.8
  - Complexity: Small

- [ ] **6.3 Implement RetryManager**
  - Create `ExponentialBackoffRetryManager` class implementing `RetryManager` interface
  - Implement `processRetries()` method to find and process failed notifications
  - Query notifications_log for status='failed' with retry_after <= now and retry_count < 3
  - Process in batches of 100 with jitter between each
  - Update retry_count and schedule next retry on failure
  - Mark as permanently failed when max retries exceeded
  - Return `RetryResult` with processed, succeeded, failed, errors counts
  - Write unit tests with mock database
  - Place in `src/lib/notifications/retry-manager.ts`
  - References: Req 15.1, Req 15.2, Req 15.3, Req 15.4, Req 15.6, Req 15.7
  - Complexity: Medium

---

## 7. Core Notification Service

- [ ] **7.1 Implement NotificationLogger**
  - Create `NotificationLogger` class with create, update, get methods
  - Implement `create()` to insert pending notification log entry
  - Implement `update()` to update status, message_id, error_message, sent_at
  - Implement `get()` to retrieve log entry by ID
  - Write unit tests with mock Supabase client
  - Place in `src/lib/notifications/logger.ts`
  - References: Req 4.7, Req 5.5, Req 14.2, Req 14.3
  - Complexity: Small

- [ ] **7.2 Implement DefaultNotificationService**
  - Create `DefaultNotificationService` class implementing `NotificationService` interface
  - Inject EmailProvider, SMSProvider, TemplateEngine, NotificationLogger, Supabase client
  - Implement `send()` method with full workflow:
    1. Check if notification type is enabled in settings
    2. Check user preferences if userId provided
    3. Load template by type and channel
    4. Render template with provided data
    5. Validate SMS length if applicable
    6. Create pending log entry
    7. Send via appropriate provider
    8. Update log entry with result
    9. Handle errors and schedule retry if transient
  - Implement `isTransientError()` helper method
  - Write unit tests for success, failure, disabled, opted-out scenarios
  - Place in `src/lib/notifications/service.ts`
  - References: Req 1.1, Req 1.4, Req 1.5, Req 1.6, Req 1.7
  - Complexity: Large

- [ ] **7.3 Implement batch notification sending**
  - Add `sendBatch()` method to DefaultNotificationService
  - Process messages in chunks of 10 with brief pauses (100ms) between chunks
  - Return array of NotificationResult for each message
  - Handle partial failures gracefully (continue on individual failures)
  - Write unit tests for batch processing
  - References: Req 18.8
  - Complexity: Small

- [ ] **7.4 Create notification service factory**
  - Create `getNotificationService()` function that returns singleton instance
  - Assemble service with correct providers based on environment
  - Export convenience function `sendNotification()` for simple use cases
  - Write integration test for full notification flow with mocks
  - Place in `src/lib/notifications/index.ts`
  - References: Req 1.7
  - Complexity: Small

---

## 8. Default Notification Templates

- [ ] **8.1 Create booking confirmation templates**
  - Create email template with subject, HTML, and plain text versions
  - Include variables: customer_name, pet_name, appointment_date, appointment_time, service_name, total_price
  - Include business context (address, phone, cancellation policy)
  - Create SMS template (concise, under 160 chars when possible)
  - Insert templates into database via migration or seed
  - Write tests to verify template rendering with sample data
  - References: Req 4.2, Req 4.3, Req 4.4, Req 4.5
  - Complexity: Medium

- [ ] **8.2 Create appointment reminder templates**
  - Create SMS template with pet_name, appointment_time, business address
  - Include message asking to notify if cancellation needed
  - Keep under 160 characters
  - Insert template into database
  - Write tests for template rendering
  - References: Req 5.2, Req 5.3
  - Complexity: Small

- [ ] **8.3 Create appointment status templates**
  - Create "Checked In" SMS template: "We've got {pet_name}!"
  - Create "Ready for Pickup" SMS template: "{pet_name} is ready for pickup!"
  - Include business address in both
  - Keep under 160 characters each
  - Insert templates into database
  - Write tests for template rendering
  - References: Req 6.1, Req 6.2, Req 6.3
  - Complexity: Small

- [ ] **8.4 Create report card notification templates**
  - Create email template with pet_name, report card link, before/after images placeholder
  - Include message encouraging customer to leave a review
  - Create concise SMS template with link
  - Insert templates into database
  - Write tests for template rendering
  - References: Req 7.2, Req 7.3, Req 7.4, Req 7.5
  - Complexity: Small

- [ ] **8.5 Create waitlist notification template**
  - Create SMS template with available date/time
  - Include instructions to claim spot (e.g., "Reply YES or click link")
  - Include expiration time (2 hours)
  - Keep under 160 characters
  - Insert template into database
  - Write tests for template rendering
  - References: Req 8.2, Req 8.3, Req 8.4
  - Complexity: Small

- [ ] **8.6 Create retention reminder templates**
  - Create email template with pet_name, weeks_since_last, breed_name, booking_url
  - Include engaging message about time for grooming
  - Create concise SMS template with booking link
  - Insert templates into database
  - Write tests for template rendering
  - References: Req 9.3, Req 9.4
  - Complexity: Small

- [ ] **8.7 Create payment notification templates**
  - Create payment failed email with failure_reason, amount_due, retry_link
  - Create payment reminder email with charge_date, amount, payment_method
  - Create payment success confirmation email
  - Create final notice email for 3rd failure with suspension warning
  - Include customer service contact in all
  - Insert templates into database
  - Write tests for template rendering
  - References: Req 10.1, Req 10.2, Req 10.3, Req 10.4, Req 10.5, Req 10.6, Req 10.8
  - Complexity: Medium

---

## 9. Email HTML Formatting

- [ ] **9.1 Create responsive email base template**
  - Create HTML email wrapper with responsive design (works on mobile)
  - Include Puppy Day logo in header
  - Use brand colors: #434E54 (primary), #F8EEE5 (background)
  - Style buttons consistently with brand design system
  - Include footer with business address, phone, and unsubscribe link
  - Test rendering in multiple email clients (use email preview tools)
  - Place in `src/lib/notifications/templates/email-base.html`
  - References: Req 17.1, Req 17.2, Req 17.3, Req 17.4, Req 17.5, Req 17.6
  - Complexity: Medium

- [ ] **9.2 Update email templates to use base template**
  - Refactor all email templates to extend base template
  - Ensure content sections are properly formatted
  - Support basic formatting: bold, italic, links, lists
  - Generate both HTML and plain text versions
  - Write visual regression tests or manual test checklist
  - References: Req 17.7, Req 17.8
  - Complexity: Medium

---

## 10. Notification Triggers

- [ ] **10.1 Implement booking confirmation trigger**
  - Create function to send booking confirmation after appointment creation
  - Send both email and SMS notifications
  - Log both sends to notifications_log
  - Handle partial failures (send through successful channel, log failure)
  - Integrate into existing booking API route
  - Write integration test with mock providers
  - References: Req 4.1, Req 4.6, Req 4.7
  - Complexity: Medium

- [ ] **10.2 Implement appointment status change triggers**
  - Create function to send status notification on "Checked In"
  - Create function to send status notification on "Ready"
  - Do NOT send notification on "Completed" (report card handles this)
  - Implement retry once after 30 seconds on failure
  - Support manual trigger from admin (bypass automatic rules)
  - Integrate into appointment status update API
  - Write integration tests for each status change
  - References: Req 6.1, Req 6.2, Req 6.3, Req 6.4, Req 6.5, Req 6.6, Req 6.7
  - Complexity: Medium

- [ ] **10.3 Implement report card completion trigger**
  - Create function to send report card notification when marked complete
  - Generate unique link to view report card
  - Send both email and SMS
  - Include thumbnail images in email if available
  - Log both sends to notifications_log
  - Integrate into report card completion API
  - Write integration test
  - References: Req 7.1, Req 7.2, Req 7.3, Req 7.4, Req 7.7
  - Complexity: Medium

- [ ] **10.4 Implement waitlist notification trigger**
  - Create function to notify waitlisted customers when slot opens
  - Process waitlist in FIFO order based on entry timestamp
  - Stop notifying if spot is claimed
  - Record notifications in notifications_log
  - Handle expiration (notify next customer if no response in 2 hours)
  - Integrate into appointment cancellation flow
  - Write integration test
  - References: Req 8.1, Req 8.5, Req 8.6, Req 8.7, Req 8.8
  - Complexity: Medium

---

## 11. Scheduled Jobs (Cron)

- [ ] **11.1 Create Vercel cron configuration**
  - Add cron configuration to vercel.json for:
    - `/api/cron/notifications/reminders` - hourly (0 * * * *)
    - `/api/cron/notifications/retention` - daily at 9 AM (0 9 * * *)
    - `/api/cron/notifications/retry` - every 5 minutes (*/5 * * * *)
  - Add CRON_SECRET environment variable to .env.example
  - Document cron setup in README
  - References: Req 16.1, Req 16.2, Req 16.3, Req 16.7
  - Complexity: Small

- [ ] **11.2 Implement appointment reminder cron job**
  - Create `/api/cron/notifications/reminders/route.ts`
  - Verify CRON_SECRET authorization header
  - Query appointments 24 hours in the future (within 1-hour window)
  - Filter to pending/confirmed appointments only
  - Check notifications_log to prevent duplicate reminders
  - Send SMS reminder using notification service
  - Log job execution (start time, end time, processed count)
  - Prevent concurrent execution
  - Return JSON with processed, sent, failed counts
  - Write unit tests with mock data
  - References: Req 5.1, Req 5.4, Req 5.5, Req 5.6, Req 5.7, Req 16.4, Req 16.5, Req 16.6
  - Complexity: Medium

- [ ] **11.3 Implement retention reminder cron job**
  - Create `/api/cron/notifications/retention/route.ts`
  - Verify CRON_SECRET authorization header
  - Query pets with last appointment + breed grooming interval passed
  - Check customer marketing preferences (skip if opted out)
  - Check notifications_log to prevent recent duplicate reminders (within 7 days)
  - Send both email and SMS using notification service
  - Include booking link in notifications
  - Reset reminder schedule when customer books
  - Log job execution
  - Return JSON with processed, sent, failed, skipped counts
  - Write unit tests with mock data
  - References: Req 9.1, Req 9.2, Req 9.5, Req 9.6, Req 9.7, Req 9.8
  - Complexity: Medium

- [ ] **11.4 Implement retry processing cron job**
  - Create `/api/cron/notifications/retry/route.ts`
  - Verify CRON_SECRET authorization header
  - Call RetryManager.processRetries()
  - Log job execution and results
  - Return JSON with processed, succeeded, failed counts
  - Write unit tests
  - References: Req 15.1, Req 15.2, Req 15.3, Req 15.6, Req 15.7
  - Complexity: Small

- [ ] **11.5 Create manual job trigger endpoints (development)**
  - Create POST `/api/admin/notifications/jobs/reminders/trigger`
  - Create POST `/api/admin/notifications/jobs/retention/trigger`
  - Require admin authentication
  - Only enable in development mode
  - Return same response format as cron jobs
  - Write integration tests
  - References: Req 16.8
  - Complexity: Small

---

## 12. Customer Notification Preferences

- [ ] **12.1 Add notification preferences to user profile**
  - Define preferences JSON structure in user.preferences column
  - Include: marketing_enabled, email_appointment_reminders, sms_appointment_reminders, email_retention_reminders, sms_retention_reminders
  - Create type definition for notification preferences
  - Write helper functions to get/set preferences
  - References: Req 19.1, Req 19.6
  - Complexity: Small

- [ ] **12.2 Create customer notification preferences API**
  - Create GET `/api/customer/preferences/notifications` endpoint
  - Create PUT `/api/customer/preferences/notifications` endpoint
  - Validate preference values
  - Require customer authentication
  - Write unit tests
  - References: Req 19.1
  - Complexity: Small

- [ ] **12.3 Implement unsubscribe functionality**
  - Create GET `/api/unsubscribe` endpoint with token parameter
  - Generate secure unsubscribe tokens for email footers
  - Update customer preferences when unsubscribe link clicked
  - Show confirmation page after unsubscribe
  - Log preference changes
  - Write integration test
  - References: Req 19.4, Req 19.5
  - Complexity: Medium

- [ ] **12.4 Integrate preference checks into notification service**
  - Update NotificationService.send() to check user preferences
  - Allow transactional notifications regardless of preferences (confirmations, status updates)
  - Block marketing notifications if opted out (retention reminders)
  - Log skipped notifications with reason "customer preference"
  - Write unit tests for preference filtering
  - References: Req 19.2, Req 19.3, Req 19.7, Req 19.8
  - Complexity: Small

---

## 13. Admin Template Management APIs

- [ ] **13.1 Create template list API**
  - Create GET `/api/admin/notifications/templates`
  - Support query params: type, trigger_event, active_only
  - Return template list with id, name, description, type, trigger_event, channel, is_active, version, variables, timestamps
  - Require admin authentication
  - Write unit tests
  - References: Req 11.1
  - Complexity: Small

- [ ] **13.2 Create template detail API**
  - Create GET `/api/admin/notifications/templates/:id`
  - Return full template including subject_template, html_template, text_template
  - Include variables with descriptions
  - Require admin authentication
  - Write unit tests
  - References: Req 11.2
  - Complexity: Small

- [ ] **13.3 Create template update API**
  - Create PUT `/api/admin/notifications/templates/:id`
  - Accept subject_template, html_template, text_template, variables, is_active, change_reason
  - Validate all required variables are present in template
  - Return error if invalid variables detected
  - Update updated_by and updated_at
  - Version history is saved automatically via trigger
  - Require admin authentication
  - Write unit tests for success and validation failure
  - References: Req 11.3, Req 11.4, Req 11.5, Req 11.6, Req 11.8, Req 13.8
  - Complexity: Medium

- [ ] **13.4 Create template preview API**
  - Create POST `/api/admin/notifications/templates/:id/preview`
  - Accept sample_data object with variable values
  - Render template using template engine
  - Return rendered subject, html, text
  - Include character_count and segment_count for SMS
  - Require admin authentication
  - Write unit tests
  - References: Req 11.7
  - Complexity: Small

- [ ] **13.5 Create test notification API**
  - Create POST `/api/admin/notifications/templates/:id/test`
  - Accept recipient_email (for email) or recipient_phone (for SMS) and sample_data
  - Render template with sample data
  - Add "[TEST]" prefix to email subject
  - Send via appropriate provider
  - Mark log entry with is_test=true
  - Return success/failure status, message_id, and log_entry_id
  - Display full error message on failure
  - Require admin authentication
  - Write integration test with mock providers
  - References: Req 12.1, Req 12.2, Req 12.3, Req 12.4, Req 12.5, Req 12.6, Req 12.7, Req 12.8
  - Complexity: Medium

- [ ] **13.6 Create template history API**
  - Create GET `/api/admin/notifications/templates/:id/history`
  - Return list of versions with version number, changed_by user info, change_reason, timestamp
  - Order by version descending
  - Require admin authentication
  - Write unit tests
  - References: Req 11.8
  - Complexity: Small

- [ ] **13.7 Create template rollback API**
  - Create POST `/api/admin/notifications/templates/:id/rollback`
  - Accept version number and reason
  - Load historical version from notification_template_history
  - Update current template with historical content
  - Automatically creates new version via trigger
  - Require admin authentication
  - Write unit tests
  - References: Req 11.8
  - Complexity: Small

---

## 14. Admin Notification Settings APIs

- [ ] **14.1 Create notification settings list API**
  - Create GET `/api/admin/notifications/settings`
  - Return all notification settings with type, email_enabled, sms_enabled, schedule_enabled, schedule_cron, last_sent_at, total_sent_count, total_failed_count
  - Require admin authentication
  - Write unit tests
  - References: Req 13.1, Req 13.7
  - Complexity: Small

- [ ] **14.2 Create notification settings update API**
  - Create PUT `/api/admin/notifications/settings/:notification_type`
  - Accept email_enabled, sms_enabled, schedule_enabled, max_retries, retry_delays_seconds
  - Save changes immediately to database
  - Require admin authentication
  - Write unit tests
  - References: Req 13.2, Req 13.3, Req 13.4, Req 13.5, Req 13.8
  - Complexity: Small

---

## 15. Admin Notification Log APIs

- [ ] **15.1 Create notification log list API**
  - Create GET `/api/admin/notifications/log`
  - Support pagination (page, limit with default 50)
  - Support filters: type, channel, status, customer_id, start_date, end_date
  - Support search by recipient email/phone
  - Join with users table to include customer_name
  - Return logs in reverse chronological order
  - Return pagination metadata (total, total_pages)
  - Require admin authentication
  - Write unit tests with various filter combinations
  - References: Req 14.1, Req 14.4, Req 14.5, Req 14.6, Req 14.7
  - Complexity: Medium

- [ ] **15.2 Create notification log detail API**
  - Create GET `/api/admin/notifications/log/:id`
  - Return full log entry including customer info, content, template_data
  - Include provider response data
  - Require admin authentication
  - Write unit tests
  - References: Req 14.8
  - Complexity: Small

- [ ] **15.3 Create notification resend API**
  - Create POST `/api/admin/notifications/log/:id/resend`
  - Load failed notification from log
  - Create new notification with same parameters
  - Send via notification service
  - Return success/failure and new_log_id
  - Require admin authentication
  - Write integration test
  - References: Req 14.8
  - Complexity: Small

---

## 16. Admin Dashboard Analytics API

- [ ] **16.1 Create notification dashboard API**
  - Create GET `/api/admin/notifications/dashboard`
  - Support query params: start_date, end_date, period (7d, 30d, 90d)
  - Calculate summary metrics: total_sent, total_delivered, total_failed, delivery_rate, click_rate
  - Calculate by_channel breakdown for email and SMS
  - Calculate by_type breakdown with success rates
  - Generate timeline data for charts (daily aggregations)
  - Group failure_reasons with counts and percentages
  - Compare to previous period for trend indicators
  - Require admin authentication
  - Write unit tests with sample data
  - References: Req 20.1, Req 20.2, Req 20.3, Req 20.4, Req 20.5, Req 20.6, Req 20.7, Req 20.8
  - Complexity: Large

---

## 17. Admin UI - Dashboard

- [ ] **17.1 Create notifications dashboard page**
  - Create `/admin/notifications/page.tsx`
  - Display overview cards: Total Sent (30d), Delivery Rate, Failed Count, SMS Cost
  - Show comparison to previous period (e.g., "15% increase")
  - Highlight unusual failure rates requiring attention
  - Use DaisyUI card components with brand styling
  - Add loading states and error handling
  - Write component tests
  - References: Req 20.1, Req 20.2, Req 20.7, Req 20.8
  - Complexity: Medium

- [ ] **17.2 Create notifications timeline chart**
  - Add line chart showing notifications sent over time
  - Support period selection (7d, 30d, 90d)
  - Show sent, delivered, failed lines
  - Use Recharts or similar chart library
  - Make chart responsive
  - Write component tests
  - References: Req 20.4
  - Complexity: Medium

- [ ] **17.3 Create channel and type breakdowns**
  - Add channel breakdown section (Email vs SMS)
  - Show sent, delivered, failed for each channel
  - Add notification type breakdown table with sparklines
  - Show success rate per type
  - Use DaisyUI table component
  - Write component tests
  - References: Req 20.2, Req 20.3
  - Complexity: Small

- [ ] **17.4 Create recent failures section**
  - Display last 10 failed notifications
  - Show notification type, channel, error message, timestamp
  - Group failures by error type
  - Add link to full log for each failure
  - Add link to resend failed notifications
  - Write component tests
  - References: Req 20.3, Req 20.8
  - Complexity: Small

---

## 18. Admin UI - Template Management

- [ ] **18.1 Create template list page**
  - Create `/admin/notifications/templates/page.tsx`
  - Display template cards with name, trigger event, channel, last updated, version
  - Add search by name or trigger event
  - Add filters: channel (email/SMS), status (active/inactive)
  - Add quick actions: Edit, Test, Duplicate, Deactivate
  - Use DaisyUI card grid layout
  - Write component tests
  - References: Req 11.1
  - Complexity: Medium

- [ ] **18.2 Create template editor page**
  - Create `/admin/notifications/templates/[id]/edit/page.tsx`
  - Split layout: Editor on left, live preview on right
  - Show template name and metadata at top
  - Add subject field for email templates
  - Add rich text editor for HTML templates (or code editor)
  - Add plain text editor for SMS templates
  - Display available variables with descriptions
  - Add "Insert Variable" dropdown to easily insert variables
  - Show validation errors inline
  - Write component tests
  - References: Req 11.2, Req 11.3, Req 11.4, Req 11.5, Req 11.7
  - Complexity: Large

- [ ] **18.3 Create SMS character counter**
  - Add character counter to SMS template editor
  - Calculate using maximum variable lengths
  - Show warning when over 160 characters
  - Show segment count (number of 160-char parts)
  - Require confirmation for templates over 320 characters
  - Show recommended character limits
  - Write component tests
  - References: Req 18.1, Req 18.2, Req 18.3, Req 18.5, Req 18.6, Req 18.7
  - Complexity: Small

- [ ] **18.4 Create template live preview**
  - Add preview pane that updates as user types
  - Use sample data to populate variables
  - Allow editing sample data values
  - Show rendered subject for email
  - Show rendered HTML (in iframe) and plain text
  - Write component tests
  - References: Req 11.7
  - Complexity: Medium

- [ ] **18.5 Create test notification modal**
  - Add "Send Test" button to template editor
  - Show modal to enter test recipient (email or phone)
  - Allow editing sample data before sending
  - Display success/failure result
  - Show full error message on failure
  - Show message ID on success
  - Write component tests
  - References: Req 12.1, Req 12.2, Req 12.5, Req 12.7
  - Complexity: Small

- [ ] **18.6 Create template version history sidebar**
  - Add collapsible sidebar showing version history
  - Display version number, changed by, date, reason
  - Add "Rollback" button for each historical version
  - Show confirmation dialog before rollback
  - Write component tests
  - References: Req 11.8
  - Complexity: Small

---

## 19. Admin UI - Settings

- [ ] **19.1 Create notification settings page**
  - Create `/admin/notifications/settings/page.tsx`
  - Display each notification type as a card
  - Show toggle switches for email and SMS channels
  - Show schedule information for automated notifications
  - Display statistics: last sent, total sent (30d), failure rate
  - Use DaisyUI toggle and card components
  - Write component tests
  - References: Req 13.1, Req 13.2, Req 13.4, Req 13.7
  - Complexity: Medium

- [ ] **19.2 Implement settings toggle functionality**
  - Toggle notification type on/off with immediate save
  - Toggle individual channels (email/SMS) on/off
  - Show loading state during save
  - Show success/error toast notification
  - Update UI optimistically with rollback on error
  - Write component tests
  - References: Req 13.2, Req 13.3, Req 13.4, Req 13.5
  - Complexity: Small

---

## 20. Admin UI - Log Viewer

- [ ] **20.1 Create notification log page**
  - Create `/admin/notifications/log/page.tsx`
  - Display table with columns: Date, Type, Channel, Recipient, Status
  - Add pagination (50 per page)
  - Add expandable rows showing full content and template data
  - Use DaisyUI table component with hover states
  - Write component tests
  - References: Req 14.1, Req 14.7, Req 14.8
  - Complexity: Medium

- [ ] **20.2 Add log filtering controls**
  - Add search input for recipient email/phone
  - Add dropdown filters: Type, Channel, Status
  - Add date range picker
  - Apply filters with debounced API calls
  - Show active filters as chips with clear buttons
  - Write component tests
  - References: Req 14.4, Req 14.5, Req 14.6
  - Complexity: Medium

- [ ] **20.3 Add log export functionality**
  - Add "Export CSV" button
  - Export filtered results (respect current filters)
  - Include all log fields in export
  - Generate filename with date range
  - Write component tests
  - References: Req 14.1
  - Complexity: Small

- [ ] **20.4 Add resend functionality to log viewer**
  - Add "Resend" button for failed notifications
  - Show confirmation dialog before resend
  - Display result (success/failure) in toast
  - Refresh log after successful resend
  - Write component tests
  - References: Req 14.8
  - Complexity: Small

---

## 21. Admin Navigation Integration

- [ ] **21.1 Add notifications section to admin navigation**
  - Add "Notifications" section to admin sidebar
  - Include sub-items: Dashboard, Templates, Settings, Log
  - Add notification icon (bell) to navigation item
  - Highlight active section
  - Update existing admin layout if needed
  - Write component tests
  - Complexity: Small

---

## 22. Testing & Integration

- [ ] **22.1 Write unit tests for template engine**
  - Test variable substitution with various data types
  - Test nested object access (e.g., business.phone)
  - Test missing required variable error
  - Test optional variable defaults
  - Test character counting
  - Test SMS segment calculation
  - Aim for >90% code coverage
  - Complexity: Medium

- [ ] **22.2 Write unit tests for notification service**
  - Test successful email send
  - Test successful SMS send
  - Test notification disabled scenario
  - Test user opted-out scenario
  - Test transient error with retry scheduling
  - Test permanent error without retry
  - Test batch sending
  - Aim for >90% code coverage
  - Complexity: Medium

- [ ] **22.3 Write unit tests for retry manager**
  - Test retry delay calculation with jitter
  - Test successful retry processing
  - Test max retries exceeded
  - Test error classification
  - Test batch processing
  - Aim for >90% code coverage
  - Complexity: Small

- [ ] **22.4 Write integration tests for notification flow**
  - Test booking confirmation end-to-end (mock providers)
  - Test appointment reminder job
  - Test retention reminder job
  - Test retry processing job
  - Test admin template editing flow
  - Test admin test notification flow
  - Complexity: Medium

- [ ] **22.5 Write E2E tests for admin notification UI**
  - Test template list page loads
  - Test template editing and saving
  - Test sending test notification
  - Test notification settings toggle
  - Test log viewer with filters
  - Use Playwright or Cypress
  - Complexity: Medium

---

## Summary

Total tasks: 74
- Foundation: 5 tasks
- Type Definitions: 2 tasks
- Template Engine: 3 tasks
- Mock Providers: 2 tasks
- Real Providers: 3 tasks
- Error Handling: 3 tasks
- Core Service: 4 tasks
- Default Templates: 7 tasks
- Email Formatting: 2 tasks
- Notification Triggers: 4 tasks
- Scheduled Jobs: 5 tasks
- Customer Preferences: 4 tasks
- Admin Template APIs: 7 tasks
- Admin Settings APIs: 2 tasks
- Admin Log APIs: 3 tasks
- Dashboard API: 1 task
- Admin UI Dashboard: 4 tasks
- Admin UI Templates: 6 tasks
- Admin UI Settings: 2 tasks
- Admin UI Log: 4 tasks
- Navigation: 1 task
- Testing: 5 tasks

Estimated complexity distribution:
- Small: 35 tasks
- Medium: 33 tasks
- Large: 6 tasks
