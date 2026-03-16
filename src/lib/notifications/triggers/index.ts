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

// Task 0049: Appointment Reminder
export {
  triggerAppointmentReminder,
  validateAppointmentReminderData,
  type AppointmentReminderTriggerData,
  type AppointmentReminderTriggerResult,
} from './appointment-reminder';

// Task 0050: Appointment Cancelled
export {
  triggerAppointmentCancelled,
  validateAppointmentCancelledData,
  type AppointmentCancelledTriggerData,
  type AppointmentCancelledTriggerResult,
} from './appointment-cancelled';

// Task 0051: Appointment Rescheduled
export {
  triggerAppointmentRescheduled,
  validateAppointmentRescheduledData,
  type AppointmentRescheduledTriggerData,
  type AppointmentRescheduledTriggerResult,
} from './appointment-rescheduled';

// Task 0052: Review Request
export {
  triggerReviewRequest,
  validateReviewRequestData,
  type ReviewRequestTriggerData,
  type ReviewRequestTriggerResult,
} from './review-request';

// Task 0053: Waitlist Added
export {
  triggerWaitlistAdded,
  validateWaitlistAddedData,
  type WaitlistAddedTriggerData,
  type WaitlistAddedTriggerResult,
} from './waitlist-added';

// Grooming Complete
export {
  triggerGroomingComplete,
  validateGroomingCompleteData,
  type GroomingCompleteTriggerData,
  type GroomingCompleteTriggerResult,
} from './grooming-complete';

// Admin Notification Triggers
export {
  triggerAdminNewBooking,
  validateAdminNewBookingData,
  type AdminNewBookingTriggerData,
  type AdminNewBookingTriggerResult,
} from './admin-new-booking';

export {
  triggerAdminCancellation,
  validateAdminCancellationData,
  type AdminCancellationTriggerData,
  type AdminCancellationTriggerResult,
} from './admin-cancellation';

export {
  triggerAdminNoShow,
  validateAdminNoShowData,
  type AdminNoShowTriggerData,
  type AdminNoShowTriggerResult,
} from './admin-no-show';
