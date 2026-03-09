# Notification Audit - Phase A: Critical Functional Fixes

## Overview

Phase A addresses the two most critical issues found in the notification audit: resend endpoints that do not actually send notifications (Issue 1), and admin appointment creation that has a TODO placeholder instead of actual notification integration (Issue 2). These are broken features that must be fixed first.

**Progress**: 4/4 tasks complete (100%)

**Document References**:
- Design: `docs/specs/notification-audit/design.md`
- Design Sections: Issue 1 (Resend Endpoints), Issue 2 (Admin Appointment Notification)

---

## Section A.1: Fix Resend Endpoints

### Task 0100: Fix Single Notification Resend to Use NotificationService
- [x] Import `getNotificationService` from `@/lib/notifications` and `createServiceRoleClient` from `@/lib/supabase/server`
- [x] Replace the mock-mode code block (setTimeout simulation) with a call through `notificationService.send()` -- the provider factory already handles mock vs production switching internally
- [x] Replace the production-mode manual insert-then-update pattern with `notificationService.send()` using the original notification's `type`, `channel`, `recipient`, `template_data`, and `customer_id`
- [x] Use `createServiceRoleClient()` for fetching the original notification from `notifications_log` (also addresses Issue 3 for this route)
- [x] Return `{ success: true, notificationId: result.logId }` on success, or appropriate error status (404 if not found, 500 if send fails)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Resending a single notification via `/api/admin/notifications/[id]/resend` calls `notificationService.send()` and creates a proper log entry. No separate mock-mode code path exists. The route uses the service role client for database queries.
- **References**: Design Section "Issue 1: Resend Endpoints Must Call NotificationService", subsection 1a
- **Files**: `src/app/api/admin/notifications/[id]/resend/route.ts`

### Task 0101: Fix Bulk Resend to Use NotificationService
- [x] Import `getNotificationService` from `@/lib/notifications` and `createServiceRoleClient` from `@/lib/supabase/server`
- [x] Replace the mock-mode code block with calls through `notificationService.send()` for each notification
- [x] Replace the production-mode manual insert-then-update loop with sequential `notificationService.send()` calls (sequential to avoid rate limiting)
- [x] Use `createServiceRoleClient()` for fetching notifications to resend (also addresses Issue 3 for this route)
- [x] Track `totalResent` and `totalFailed` counters; collect error messages in an `errors` array for partial failure reporting
- [x] Wrap each individual send in try/catch so one failure does not abort the entire batch
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Bulk resend via `/api/admin/notifications/bulk-resend` calls `notificationService.send()` for each notification sequentially. Partial failures are reported with accurate counts. No separate mock-mode code path exists.
- **References**: Design Section "Issue 1: Resend Endpoints Must Call NotificationService", subsection 1b
- **Files**: `src/app/api/admin/notifications/bulk-resend/route.ts`

---

## Section A.2: Admin Appointment Notification Integration

### Task 0102: Wire Up triggerBookingConfirmation in Admin Appointment Creation
- [x] Locate the TODO block in `src/app/api/admin/appointments/route.ts` (approximately lines 710-713) where `send_notification` is checked
- [x] Replace the `console.log` placeholder with a dynamic import of `triggerBookingConfirmation` from `@/lib/notifications/triggers/booking-confirmation`
- [x] Call `triggerBookingConfirmation(supabase, { ... })` with `appointmentId`, `customerId`, `customerName`, `customerEmail`, `customerPhone`, `petName`, `serviceName`, `scheduledAt`, and `totalPrice` gathered from existing variables in the POST handler scope
- [x] Wrap the entire notification trigger in try/catch so notification failure does NOT roll back or fail the appointment creation
- [x] Log notification errors with `console.error` for debugging but do not expose them in the API response
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: When an admin creates an appointment with `send_notification: true` and the customer status is `active`, `triggerBookingConfirmation()` is called with correct appointment data. Appointment creation succeeds even if the notification trigger throws.
- **References**: Design Section "Issue 2: Admin Appointment Creation Notification Integration"
- **Files**: `src/app/api/admin/appointments/route.ts`

### Task 0103: Verify triggerBookingConfirmation Function Signature Compatibility
- [x] Read `src/lib/notifications/triggers/booking-confirmation.ts` and verify the function signature matches the call site created in Task 0102
- [x] Confirm the expected parameter object shape (`appointmentId`, `customerId`, `customerName`, `customerEmail`, `customerPhone`, `petName`, `serviceName`, `scheduledAt`, `totalPrice`) is accepted by the trigger function
- [x] If there is a mismatch, update either the call site or document the required adapter; create a TypeScript interface if one does not exist
- [x] Verify the trigger function correctly calls `notificationService.send()` internally (it should not have the same manual-insert bug)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: The `triggerBookingConfirmation` function signature is compatible with the admin appointment creation call site. No type errors at build time.
- **References**: Design Section "Issue 2: Admin Appointment Creation Notification Integration"
- **Files**: `src/lib/notifications/triggers/booking-confirmation.ts`, `src/app/api/admin/appointments/route.ts`
