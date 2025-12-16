# Phase 8: Notifications & Integrations - Requirements Document

## Introduction

Phase 8 focuses on implementing a comprehensive notification system for The Puppy Day dog grooming SaaS application. This phase will establish a robust notification abstraction layer supporting both email (via Resend) and SMS (via Twilio) channels, create a complete set of notification templates for various business events, and provide admin controls for managing notification settings and templates.

The notification system will enhance customer communication throughout the booking lifecycle, from initial confirmation through post-service follow-up, while also supporting business operations like waitlist management and payment processing. All notifications will be tracked in the existing `notifications_log` table for auditing and troubleshooting purposes.

## Requirements

### Requirement 1: Notification Abstraction Layer

**User Story:** As a developer, I want a unified notification service interface, so that I can easily send notifications through different channels without coupling to specific provider implementations.

#### Acceptance Criteria

1. WHEN the notification service is initialized THEN the system SHALL provide a unified interface supporting both email and SMS channels
2. IF the environment is set to mock mode (NEXT_PUBLIC_USE_MOCKS=true) THEN the system SHALL use mock implementations for Resend and Twilio
3. IF the environment is set to production mode THEN the system SHALL use actual Resend and Twilio implementations
4. WHEN a notification is sent THEN the system SHALL accept parameters for recipient, template identifier, and template data
5. WHEN a notification send operation completes THEN the system SHALL return a promise with success/failure status and message ID
6. IF a notification send operation fails THEN the system SHALL throw a descriptive error with provider-specific details
7. WHEN the notification service is called THEN the system SHALL support switching between provider implementations without changing calling code
8. WHEN the notification abstraction layer is implemented THEN the system SHALL include TypeScript interfaces for NotificationService, EmailProvider, and SMSProvider

### Requirement 2: Email Notification Implementation

**User Story:** As a business owner, I want to send professional email notifications to customers, so that they receive important information about their appointments and pets in their inbox.

#### Acceptance Criteria

1. WHEN the Resend provider is initialized THEN the system SHALL configure it with the API key from environment variables
2. WHEN an email notification is sent THEN the system SHALL use templates stored in the database or file system
3. WHEN an email is sent THEN the system SHALL populate the template with provided data variables
4. WHEN an email is sent THEN the system SHALL use "puppyday14936@gmail.com" as the from address
5. WHEN an email is sent THEN the system SHALL include appropriate subject lines based on the template type
6. WHEN an email template includes variables THEN the system SHALL replace placeholders like {pet_name}, {date}, {time}, {customer_name} with actual values
7. IF an email send fails THEN the system SHALL log the error with Resend-specific error details
8. WHEN an email is successfully sent THEN the system SHALL return the Resend message ID for tracking

### Requirement 3: SMS Notification Implementation

**User Story:** As a business owner, I want to send timely SMS notifications to customers, so that they receive immediate updates about their appointments and can respond quickly to time-sensitive information.

#### Acceptance Criteria

1. WHEN the Twilio provider is initialized THEN the system SHALL configure it with Account SID, Auth Token, and phone number from environment variables
2. WHEN an SMS notification is sent THEN the system SHALL use templates stored in the database or file system
3. WHEN an SMS is sent THEN the system SHALL populate the template with provided data variables
4. WHEN an SMS is sent THEN the system SHALL use "(657) 252-2903" as the from phone number
5. WHEN an SMS template includes variables THEN the system SHALL replace placeholders with actual values
6. WHEN an SMS message exceeds 160 characters THEN the system SHALL send it as a multi-part message
7. IF an SMS send fails THEN the system SHALL log the error with Twilio-specific error details
8. WHEN an SMS is successfully sent THEN the system SHALL return the Twilio message SID for tracking

### Requirement 4: Booking Confirmation Notifications

**User Story:** As a customer, I want to receive confirmation when I book an appointment, so that I have a record of my booking details and feel confident my appointment is scheduled.

#### Acceptance Criteria

1. WHEN a customer completes a booking THEN the system SHALL send both email and SMS confirmation notifications
2. WHEN a confirmation notification is sent THEN the system SHALL include appointment date, time, pet name, service type, and location
3. WHEN a confirmation email is sent THEN the system SHALL include a formatted summary with business contact information
4. WHEN a confirmation SMS is sent THEN the system SHALL include essential details in a concise format (under 160 characters when possible)
5. WHEN a confirmation notification is sent THEN the system SHALL include cancellation policy information
6. IF either notification channel fails THEN the system SHALL still send through the successful channel and log the failure
7. WHEN confirmation notifications are sent THEN the system SHALL record both sends in the notifications_log table

### Requirement 5: Appointment Reminder Notifications

**User Story:** As a customer, I want to receive a reminder before my appointment, so that I don't forget and can plan accordingly.

#### Acceptance Criteria

1. WHEN an appointment is 24 hours away THEN the system SHALL send an SMS reminder notification
2. WHEN a reminder is sent THEN the system SHALL include appointment time, pet name, and location
3. WHEN a reminder is sent THEN the system SHALL include a message asking customer to notify if they need to cancel
4. WHEN the reminder system runs THEN the system SHALL check for upcoming appointments in a scheduled job
5. WHEN a reminder is successfully sent THEN the system SHALL mark it in the notifications_log to prevent duplicate sends
6. IF a reminder has already been sent for an appointment THEN the system SHALL NOT send another reminder
7. WHEN the reminder job completes THEN the system SHALL log the number of reminders sent and any failures

### Requirement 6: Appointment Status Notifications

**User Story:** As a customer, I want to receive updates when my pet's appointment status changes, so that I know when to pick up my pet and can track the grooming progress.

#### Acceptance Criteria

1. WHEN an appointment status changes to "Checked In" THEN the system SHALL send an SMS notification with message "We've got [pet_name]!"
2. WHEN an appointment status changes to "Ready" THEN the system SHALL send an SMS notification with message "[pet_name] is ready for pickup!"
3. WHEN a status notification is sent THEN the system SHALL include the business address for pickup
4. WHEN a status changes to "Completed" THEN the system SHALL NOT send a status notification (report card notification will be sent instead)
5. WHEN a status notification is sent THEN the system SHALL record it in the notifications_log table
6. IF a status notification fails THEN the system SHALL retry once after 30 seconds
7. WHEN an admin manually triggers a status notification THEN the system SHALL send it immediately regardless of automatic rules

### Requirement 7: Report Card Notifications

**User Story:** As a customer, I want to be notified when my pet's report card is ready, so that I can view photos and grooming notes from the appointment.

#### Acceptance Criteria

1. WHEN a report card is marked as complete THEN the system SHALL send both email and SMS notifications
2. WHEN a report card notification is sent THEN the system SHALL include a unique link to view the report card
3. WHEN a report card email is sent THEN the system SHALL include thumbnail images if available
4. WHEN a report card SMS is sent THEN the system SHALL include a short message with the link
5. WHEN a report card notification is sent THEN the system SHALL include a message encouraging the customer to leave a review
6. WHEN the report card link is clicked THEN the system SHALL track the open in analytics (if implemented)
7. WHEN report card notifications are sent THEN the system SHALL record both sends in the notifications_log table

### Requirement 8: Waitlist Notifications

**User Story:** As a customer on the waitlist, I want to be notified when a spot opens up, so that I can quickly book the newly available appointment time.

#### Acceptance Criteria

1. WHEN an appointment slot becomes available AND waitlist entries exist for that date THEN the system SHALL send SMS notifications to waitlisted customers in order
2. WHEN a waitlist notification is sent THEN the system SHALL include the available date and time
3. WHEN a waitlist SMS is sent THEN the system SHALL include instructions to claim the spot (e.g., "Reply YES to book or click link")
4. WHEN a waitlist notification is sent THEN the system SHALL include an expiration time (e.g., "Reserve within 2 hours")
5. WHEN multiple waitlist spots are available THEN the system SHALL notify customers in FIFO order based on waitlist entry timestamp
6. IF a waitlist spot is claimed THEN the system SHALL NOT notify additional waitlist customers for that specific slot
7. WHEN a waitlist notification is sent THEN the system SHALL record it in the notifications_log table
8. WHEN a waitlist notification expires without response THEN the system SHALL move to the next customer on the waitlist

### Requirement 9: Retention Reminder Notifications

**User Story:** As a business owner, I want to send grooming reminders to customers whose pets are due for service, so that I can maintain regular appointments and improve customer retention.

#### Acceptance Criteria

1. WHEN a pet's last appointment date plus breed grooming interval has passed THEN the system SHALL identify the pet as due for grooming
2. WHEN a retention reminder is due THEN the system SHALL send both email and SMS notifications to the pet owner
3. WHEN a retention reminder is sent THEN the system SHALL include the pet name, recommended service, and time since last visit
4. WHEN a retention reminder is sent THEN the system SHALL include a direct link to the booking widget
5. WHEN a retention reminder campaign runs THEN the system SHALL batch process all due reminders
6. WHEN a customer books after receiving a retention reminder THEN the system SHALL reset their reminder schedule
7. WHEN a retention reminder is sent THEN the system SHALL record it in the notifications_log table with reminder type
8. IF a customer has opted out of marketing communications THEN the system SHALL NOT send retention reminders

### Requirement 10: Payment Notification System

**User Story:** As a business owner, I want to notify customers when payments fail or are due, so that I can maintain healthy cash flow and give customers opportunity to resolve payment issues.

#### Acceptance Criteria

1. WHEN a payment attempt fails THEN the system SHALL send an email notification to the customer
2. WHEN a failed payment email is sent THEN the system SHALL include the failure reason, amount due, and payment retry link
3. WHEN a membership payment is due in 3 days THEN the system SHALL send a reminder email
4. WHEN a payment reminder is sent THEN the system SHALL include the charge date, amount, and payment method on file
5. WHEN a payment is successfully processed after a failure THEN the system SHALL send a confirmation email
6. IF a payment fails 3 times THEN the system SHALL send a final notice email with account suspension warning
7. WHEN payment notifications are sent THEN the system SHALL record them in the notifications_log table with payment reference
8. WHEN a dunning email is sent THEN the system SHALL include customer service contact information

### Requirement 11: Notification Template Management

**User Story:** As an admin, I want to create and edit notification templates, so that I can customize messaging without requiring code changes.

#### Acceptance Criteria

1. WHEN an admin accesses notification settings THEN the system SHALL display a list of all available notification templates
2. WHEN an admin selects a template THEN the system SHALL display the template content with available variables highlighted
3. WHEN an admin edits a template THEN the system SHALL provide a rich text editor for email templates and plain text for SMS
4. WHEN an admin saves a template THEN the system SHALL validate that all required variables are present
5. WHEN a template includes invalid variables THEN the system SHALL display an error and prevent saving
6. WHEN an admin saves a template THEN the system SHALL store it in the database and update the last_modified timestamp
7. WHEN an admin views a template THEN the system SHALL display available variables with descriptions (e.g., {pet_name}, {appointment_date})
8. WHEN a template is edited THEN the system SHALL maintain version history for rollback capability
9. WHEN an admin creates a new template THEN the system SHALL require template name, type (email/SMS), trigger event, and content

### Requirement 12: Test Notification Functionality

**User Story:** As an admin, I want to send test notifications, so that I can verify templates and delivery before sending to customers.

#### Acceptance Criteria

1. WHEN an admin selects a notification template THEN the system SHALL provide a "Send Test" button
2. WHEN an admin clicks "Send Test" THEN the system SHALL display a form to enter test recipient details
3. WHEN test data is submitted THEN the system SHALL populate template variables with sample or provided data
4. WHEN a test notification is sent THEN the system SHALL send to the specified test email/phone number
5. WHEN a test notification completes THEN the system SHALL display success/failure status and message ID
6. WHEN a test notification is sent THEN the system SHALL mark it as a test in the notifications_log table
7. IF a test notification fails THEN the system SHALL display the full error message for debugging
8. WHEN an admin sends a test email THEN the system SHALL include a visible "[TEST]" indicator in the subject line

### Requirement 13: Notification Settings & Toggles

**User Story:** As an admin, I want to enable or disable specific notification types, so that I can control which automated notifications are active without modifying code.

#### Acceptance Criteria

1. WHEN an admin accesses notification settings THEN the system SHALL display toggle switches for each notification type
2. WHEN an admin toggles a notification type off THEN the system SHALL prevent those notifications from being sent
3. WHEN a notification is attempted while disabled THEN the system SHALL log the attempt but not send
4. WHEN an admin toggles a notification type on THEN the system SHALL resume sending those notifications
5. WHEN notification settings are changed THEN the system SHALL save the changes immediately to the database settings table
6. WHEN the application starts THEN the system SHALL load notification toggles from the settings table
7. WHEN an admin views notification settings THEN the system SHALL display the last sent count and timestamp for each type
8. WHEN notification toggles are changed THEN the system SHALL require admin role authorization

### Requirement 14: Notification Log & Tracking

**User Story:** As an admin, I want to view a log of all sent notifications, so that I can troubleshoot delivery issues and track customer communication history.

#### Acceptance Criteria

1. WHEN an admin accesses the notifications log THEN the system SHALL display all logged notifications in reverse chronological order
2. WHEN a notification is sent THEN the system SHALL log recipient, channel (email/SMS), template type, status, timestamp, and message ID
3. WHEN a notification send fails THEN the system SHALL log the error message and failure reason
4. WHEN an admin filters the log THEN the system SHALL support filtering by date range, notification type, channel, status, and customer
5. WHEN an admin views a log entry THEN the system SHALL display the full sent content and template variables used
6. WHEN an admin searches the log THEN the system SHALL support searching by customer name, email, or phone number
7. WHEN the log displays results THEN the system SHALL paginate with 50 entries per page
8. WHEN a log entry is clicked THEN the system SHALL expand to show full details including provider response data

### Requirement 15: Notification Retry Logic

**User Story:** As a system administrator, I want failed notifications to be automatically retried, so that transient errors don't result in missed customer communications.

#### Acceptance Criteria

1. WHEN a notification send fails with a transient error THEN the system SHALL automatically retry after 30 seconds
2. WHEN a notification fails after first retry THEN the system SHALL retry again after 5 minutes
3. WHEN a notification fails after second retry THEN the system SHALL mark it as permanently failed
4. WHEN a notification is retried THEN the system SHALL log each attempt in the notifications_log table
5. IF a notification fails with a permanent error (invalid recipient, etc.) THEN the system SHALL NOT retry
6. WHEN a notification succeeds on retry THEN the system SHALL update the log entry with success status
7. WHEN maximum retries are exceeded THEN the system SHALL create an admin alert/notification
8. WHEN retry logic is processing THEN the system SHALL use exponential backoff for rate limiting

### Requirement 16: Notification Scheduling System

**User Story:** As a system administrator, I want notifications to be processed on a reliable schedule, so that time-sensitive notifications are sent promptly and automatically.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL initialize scheduled jobs for notification processing
2. WHEN the reminder job runs THEN the system SHALL check for appointments 24 hours in advance every hour
3. WHEN the retention job runs THEN the system SHALL check for due grooming reminders daily at 9 AM
4. WHEN a scheduled job executes THEN the system SHALL log the start time, end time, and number of notifications processed
5. IF a scheduled job fails THEN the system SHALL log the error and continue with the next scheduled run
6. WHEN a scheduled job is running THEN the system SHALL prevent concurrent executions of the same job
7. WHEN scheduled jobs are configured THEN the system SHALL use environment variables for timing configuration
8. WHEN the application is in development mode THEN the system SHALL provide manual trigger endpoints for testing scheduled jobs

### Requirement 17: Email Template HTML Formatting

**User Story:** As a customer, I want to receive well-formatted professional email notifications, so that the communication reflects the quality of the business and is easy to read.

#### Acceptance Criteria

1. WHEN an email notification is generated THEN the system SHALL use responsive HTML templates
2. WHEN an email is viewed on mobile THEN the system SHALL display properly formatted content without horizontal scrolling
3. WHEN an email is sent THEN the system SHALL include the Puppy Day logo in the header
4. WHEN an email template is rendered THEN the system SHALL use brand colors (#434E54 for primary, #F8EEE5 for background)
5. WHEN an email includes buttons THEN the system SHALL style them consistently with the brand design system
6. WHEN an email is sent THEN the system SHALL include footer with business address, phone, and unsubscribe link
7. WHEN an email template is created THEN the system SHALL support basic formatting (bold, italic, links, lists)
8. WHEN emails are sent THEN the system SHALL include both HTML and plain text versions for email client compatibility

### Requirement 18: SMS Character Optimization

**User Story:** As a business owner, I want SMS messages to be concise and cost-effective, so that I minimize SMS costs while still delivering clear information to customers.

#### Acceptance Criteria

1. WHEN an SMS template is created THEN the system SHALL display a character counter
2. WHEN an SMS exceeds 160 characters THEN the system SHALL display a warning about multi-part message costs
3. WHEN an SMS template uses variables THEN the system SHALL calculate character count using maximum variable lengths
4. WHEN an SMS includes a link THEN the system SHALL use a URL shortener to minimize character usage
5. WHEN an SMS is sent THEN the system SHALL log the segment count (number of 160-character parts)
6. WHEN SMS templates are displayed THEN the system SHALL show recommended character limits for each template type
7. WHEN an admin saves an SMS template over 320 characters THEN the system SHALL require confirmation
8. WHEN SMS messages are sent in bulk THEN the system SHALL batch them according to Twilio rate limits

### Requirement 19: Notification Preferences & Opt-out

**User Story:** As a customer, I want to control which notifications I receive, so that I only get communications that are valuable to me and comply with my preferences.

#### Acceptance Criteria

1. WHEN a customer accesses their profile THEN the system SHALL display notification preference toggles
2. WHEN a customer opts out of marketing communications THEN the system SHALL stop sending retention reminders
3. WHEN a customer opts out of notifications THEN the system SHALL still send transactional notifications (booking confirmations, status updates)
4. WHEN an email is sent THEN the system SHALL include an unsubscribe link in the footer
5. WHEN a customer clicks unsubscribe THEN the system SHALL update their preferences and confirm the change
6. WHEN notification preferences are saved THEN the system SHALL respect them for all future notifications
7. WHEN the system checks whether to send a notification THEN the system SHALL verify customer preferences before sending
8. WHEN a customer is opted out THEN the system SHALL log skipped notifications with reason "customer preference"

### Requirement 20: Admin Notification Dashboard

**User Story:** As an admin, I want to view notification metrics and analytics, so that I can understand notification performance and customer engagement.

#### Acceptance Criteria

1. WHEN an admin accesses the notification dashboard THEN the system SHALL display total notifications sent by type in the last 30 days
2. WHEN the dashboard loads THEN the system SHALL display delivery success rates for email and SMS channels
3. WHEN the dashboard displays metrics THEN the system SHALL show failure reasons grouped by error type
4. WHEN an admin views the dashboard THEN the system SHALL display a chart of notifications sent over time
5. WHEN the dashboard shows notification types THEN the system SHALL display click-through rates for emails with links
6. WHEN an admin filters the dashboard THEN the system SHALL support date range selection
7. WHEN metrics are displayed THEN the system SHALL show comparison to previous period (e.g., "15% increase")
8. WHEN the dashboard is viewed THEN the system SHALL highlight any notifications with unusual failure rates requiring attention
