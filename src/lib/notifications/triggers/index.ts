/**
 * Phase 8: Notification Triggers Export
 * Tasks 0107-0110: Event-based notification triggers
 */

// Task 0107: Booking Confirmation
export {
  triggerBookingConfirmation,
  validateBookingConfirmationData,
  type BookingConfirmationTriggerData,
  type BookingConfirmationTriggerResult,
} from './booking-confirmation';

// Task 0108: Appointment Status Changes
export {
  triggerAppointmentStatus,
  validateAppointmentStatusData,
  shouldSendStatusNotification,
  type AppointmentStatusTriggerData,
  type AppointmentStatusTriggerResult,
} from './appointment-status';

// Task 0109: Report Card Completion
export {
  triggerReportCardCompletion,
  validateReportCardCompletionData,
  shouldSendReportCardNotification,
  type ReportCardCompletionTriggerData,
  type ReportCardCompletionTriggerResult,
} from './report-card-completion';

// Task 0110: Waitlist Notifications
export {
  triggerWaitlistNotification,
  triggerWaitlistNotificationBatch,
  validateWaitlistNotificationData,
  handleWaitlistExpiration,
  type WaitlistNotificationTriggerData,
  type WaitlistNotificationTriggerResult,
  type WaitlistBatchNotificationResult,
} from './waitlist-notification';
