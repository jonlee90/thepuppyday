/**
 * Test Selectors Constants
 * Task 0272: Create E2E test fixtures and utilities
 *
 * Centralized selectors for E2E tests
 */

export const SELECTORS = {
  // Auth
  LOGIN_FORM: '[data-testid="login-form"]',
  EMAIL_INPUT: 'input[name="email"]',
  PASSWORD_INPUT: 'input[name="password"]',
  SUBMIT_BUTTON: 'button[type="submit"]',
  USER_MENU: '[data-testid="user-menu"]',
  LOGOUT_BUTTON: '[data-testid="logout-button"]',

  // Booking
  BOOKING_MODAL: '[data-testid="booking-modal"]',
  SERVICE_SELECT: '[data-testid="service-select"]',
  DATE_PICKER: '[data-testid="date-picker"]',
  TIME_SLOT: '[data-testid="time-slot"]',
  NEXT_STEP_BUTTON: '[data-testid="next-step"]',
  PREVIOUS_STEP_BUTTON: '[data-testid="previous-step"]',
  CONFIRM_BOOKING_BUTTON: '[data-testid="confirm-booking"]',

  // Pet Management
  PET_CARD: '[data-testid="pet-card"]',
  ADD_PET_BUTTON: '[data-testid="add-pet"]',
  PET_NAME_INPUT: 'input[name="petName"]',
  PET_SIZE_SELECT: 'select[name="petSize"]',
  SAVE_PET_BUTTON: '[data-testid="save-pet"]',

  // Appointments
  APPOINTMENT_CARD: '[data-testid="appointment-card"]',
  CANCEL_APPOINTMENT_BUTTON: '[data-testid="cancel-appointment"]',
  APPOINTMENT_STATUS_BADGE: '[data-testid="appointment-status"]',

  // Admin
  ADMIN_SIDEBAR: '[data-testid="admin-sidebar"]',
  APPOINTMENT_TABLE: '[data-testid="appointment-table"]',
  STATUS_UPDATE_SELECT: '[data-testid="status-update"]',
  REPORT_CARD_FORM: '[data-testid="report-card-form"]',

  // Common
  ERROR_MESSAGE: '[data-testid="error-message"]',
  SUCCESS_MESSAGE: '[data-testid="success-message"]',
  LOADING_SPINNER: '[data-testid="loading-spinner"]',
  MODAL_CLOSE_BUTTON: '[data-testid="modal-close"]',
  CONFIRM_DIALOG: '[data-testid="confirm-dialog"]',
} as const;

/**
 * Helper to get selector by key
 */
export function getSelector(key: keyof typeof SELECTORS): string {
  return SELECTORS[key];
}
