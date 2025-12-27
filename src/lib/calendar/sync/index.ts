/**
 * Calendar Sync Utilities
 * Exports all sync-related modules
 */

// Retry Queue
export {
  queueForRetry,
  processRetryQueue,
  removeFromQueue,
  getQueueStats,
  getRetryBackoffTime,
  type RetryQueueEntry,
  type RetryQueueStats,
  type RetryProcessingStats,
} from './retry-queue';

// Error Classification
export {
  isTransientError,
  classifyError,
  type ErrorType,
  type ClassifiedError,
} from './error-classifier';

// Pause Management
export {
  trackSyncFailure,
  trackSyncSuccess,
  pauseAutoSync,
  resumeAutoSync,
  checkPauseStatus,
  getPausedConnections,
  type ConnectionPauseStatus,
} from './pause-manager';

// Push Sync
export {
  pushAppointmentToCalendar,
  pushAppointmentsToCalendar,
  canSyncAppointment,
} from './push';

// Auto Sync Trigger
export { triggerAutoSync } from './auto-sync-trigger';

// Delete Handler
export { deleteAppointmentFromCalendar } from './delete-handler';

// Bulk Sync
export {
  startBulkSync,
  getBulkSyncStatus,
  cancelBulkSync,
} from './bulk-sync-job';
