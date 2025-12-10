/**
 * API types for request/response handling
 */

// Common API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Error codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  session: {
    access_token: string;
    expires_at: number;
  };
}

export interface ResetPasswordRequest {
  email: string;
}

// Booking types
export interface BookingRequest {
  pet_id?: string;
  pet_data?: {
    name: string;
    size: string;
    breed_id?: string;
    breed_custom?: string;
    notes?: string;
  };
  service_id: string;
  addon_ids: string[];
  scheduled_at: string;
  customer_data?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  notes?: string;
  create_account?: boolean;
}

export interface BookingResponse {
  appointment_id: string;
  confirmation_number: string;
  scheduled_at: string;
  total_price: number;
}

// Availability types
export interface AvailabilityRequest {
  date: string;
  service_id: string;
  duration_minutes: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

// Waitlist types
export interface WaitlistRequest {
  pet_id: string;
  service_id: string;
  requested_date: string;
  time_preference: 'morning' | 'afternoon' | 'any';
}

// Payment types
export interface CreatePaymentIntentRequest {
  appointment_id: string;
  amount: number;
  tip_amount?: number;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

// Report card types
export interface SubmitReviewRequest {
  report_card_id: string;
  rating: number;
  feedback?: string;
}

// Notification types
export interface SendNotificationRequest {
  customer_id: string;
  type: string;
  channel: 'email' | 'sms';
  template_data: Record<string, unknown>;
}
