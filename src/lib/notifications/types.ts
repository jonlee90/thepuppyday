/**
 * Phase 8: Notification System Type Definitions
 * Comprehensive types for notification services, providers, templates, and messages
 */

import type { NotificationChannel, NotificationStatus } from '../../types/database';

// ============================================================================
// CORE NOTIFICATION TYPES
// ============================================================================

/**
 * Notification message to be sent
 */
export interface NotificationMessage {
  type: string; // notification_type from settings
  channel: NotificationChannel;
  recipient: string; // Email address or phone number
  templateData: Record<string, unknown>; // Variable values for template rendering
  userId?: string; // Optional customer ID for tracking
  priority?: 'low' | 'normal' | 'high'; // Priority for queuing
  scheduledFor?: Date; // Optional scheduled send time
}

/**
 * Result of sending a notification
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string; // Provider message ID (Resend/Twilio)
  error?: string; // Error message if failed
  logId?: string; // Database log entry ID
}

// ============================================================================
// NOTIFICATION SERVICE INTERFACE
// ============================================================================

/**
 * Main notification service interface
 */
export interface NotificationService {
  /**
   * Send a single notification
   */
  send(message: NotificationMessage): Promise<NotificationResult>;

  /**
   * Send multiple notifications in batch
   */
  sendBatch(messages: NotificationMessage[]): Promise<NotificationResult[]>;

  /**
   * Render a template with data
   */
  renderTemplate(
    templateId: string,
    data: Record<string, unknown>
  ): Promise<RenderedTemplate>;

  /**
   * Process pending retries
   */
  processRetries(): Promise<RetryResult>;

  /**
   * Get notification metrics
   */
  getMetrics(startDate: Date, endDate: Date): Promise<NotificationMetrics>;
}

// ============================================================================
// PROVIDER INTERFACES
// ============================================================================

/**
 * Email provider parameters
 */
export interface EmailParams {
  to: string; // Recipient email address
  from?: string; // Sender email (optional, uses default)
  subject: string;
  html: string; // HTML content
  text: string; // Plain text content
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Email send result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string; // Provider message ID
  error?: string;
}

/**
 * Email provider interface
 */
export interface EmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
}

/**
 * SMS provider parameters
 */
export interface SMSParams {
  to: string; // Recipient phone number (E.164 format)
  from?: string; // Sender phone number (optional, uses default)
  body: string; // Message content
}

/**
 * SMS send result
 */
export interface SMSResult {
  success: boolean;
  messageId?: string; // Provider SID/message ID
  segmentCount?: number; // Number of SMS segments
  error?: string;
}

/**
 * SMS provider interface
 */
export interface SMSProvider {
  send(params: SMSParams): Promise<SMSResult>;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string; // Variable name (e.g., "customer_name")
  description: string; // Human-readable description
  required: boolean; // Is this variable required?
  maxLength?: number; // Maximum length for character counting (SMS)
  defaultValue?: string; // Default value if not provided
}

/**
 * Notification template from database
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: string; // notification_type
  triggerEvent: string;
  channel: NotificationChannel;
  subjectTemplate?: string; // For email only
  htmlTemplate?: string; // For email only
  textTemplate: string; // For SMS or email plain text
  variables: TemplateVariable[];
  isActive: boolean;
  version: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rendered template ready to send
 */
export interface RenderedTemplate {
  subject?: string; // For email
  html?: string; // For email
  text: string; // For SMS or email plain text
  characterCount: number; // For SMS length validation
  segmentCount?: number; // SMS segments (160 chars each)
  warnings?: string[]; // Any warnings (e.g., "Over 160 characters")
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[]; // Missing required variables, invalid syntax, etc.
  warnings: string[]; // SMS too long, etc.
}

// ============================================================================
// RETRY & ERROR HANDLING TYPES
// ============================================================================

/**
 * Error classification types
 */
export enum ErrorType {
  TRANSIENT = 'transient', // Temporary error, should retry
  PERMANENT = 'permanent', // Permanent error, don't retry
  RATE_LIMIT = 'rate_limit', // Rate limit, should retry with delay
  VALIDATION = 'validation', // Validation error, don't retry
}

/**
 * Classified error with retry recommendation
 */
export interface ClassifiedError {
  type: ErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number; // HTTP status code if applicable
  originalError?: unknown;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number; // Maximum number of retry attempts
  baseDelay: number; // Base delay in seconds (e.g., 30)
  maxDelay: number; // Maximum delay in seconds (e.g., 300 = 5min)
  jitterFactor: number; // Randomness factor (e.g., 0.3 = ±30%)
}

/**
 * Retry processing result
 */
export interface RetryResult {
  processed: number; // Total notifications processed
  succeeded: number; // Successfully sent
  failed: number; // Failed after retry
  errors: Array<{
    logId: string;
    error: string;
  }>;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 30, // 30 seconds
  maxDelay: 300, // 5 minutes
  jitterFactor: 0.3, // ±30%
};

// ============================================================================
// NOTIFICATION SETTINGS TYPES
// ============================================================================

/**
 * Notification settings from database
 */
export interface NotificationSettings {
  notificationType: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailTemplateId?: string;
  smsTemplateId?: string;
  scheduleCron?: string; // Cron expression
  scheduleEnabled: boolean;
  maxRetries: number;
  retryDelaysSeconds: number[]; // Array of retry delays
  lastSentAt?: Date;
  totalSentCount: number;
  totalFailedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATION LOG TYPES
// ============================================================================

/**
 * Notification log entry
 */
export interface NotificationLogEntry {
  id: string;
  customerId?: string;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  content: string;
  status: NotificationStatus;
  errorMessage?: string;
  sentAt?: Date;
  templateId?: string;
  templateData?: Record<string, unknown>;
  retryCount: number;
  retryAfter?: Date;
  isTest: boolean;
  messageId?: string; // Provider message ID
  campaignId?: string;
  campaignSendId?: string;
  trackingId?: string;
  clickedAt?: Date;
  deliveredAt?: Date;
  costCents?: number;
  createdAt: Date;
}

// ============================================================================
// METRICS & ANALYTICS TYPES
// ============================================================================

/**
 * Notification metrics
 */
export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalClicked: number;
  deliveryRate: number; // Percentage
  clickRate: number; // Percentage
  byChannel: {
    email: ChannelMetrics;
    sms: ChannelMetrics;
  };
  byType: Record<string, TypeMetrics>;
  timeline: TimelineData[];
  failureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Channel-specific metrics
 */
export interface ChannelMetrics {
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
  deliveryRate: number;
  clickRate: number;
  costDollars?: number; // For SMS
}

/**
 * Type-specific metrics
 */
export interface TypeMetrics {
  sent: number;
  delivered: number;
  failed: number;
  successRate: number;
  avgDeliveryTimeMs?: number;
}

/**
 * Timeline data point
 */
export interface TimelineData {
  date: string; // ISO date
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
}

// ============================================================================
// TEMPLATE ENGINE INTERFACE
// ============================================================================

/**
 * Template engine interface
 */
export interface TemplateEngine {
  /**
   * Render a template with variables
   */
  render(
    template: string,
    data: Record<string, unknown>,
    businessContext?: BusinessContext
  ): string;

  /**
   * Validate template syntax and required variables
   */
  validate(
    template: string,
    requiredVariables: TemplateVariable[]
  ): TemplateValidationResult;

  /**
   * Calculate character count with max variable lengths
   */
  calculateCharacterCount(
    template: string,
    variables: TemplateVariable[]
  ): number;

  /**
   * Calculate SMS segment count
   */
  calculateSegmentCount(text: string): number;
}

/**
 * Business context data automatically added to all templates
 */
export interface BusinessContext {
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  website?: string;
}

// ============================================================================
// NOTIFICATION LOGGER INTERFACE
// ============================================================================

/**
 * Notification logger interface
 */
export interface NotificationLogger {
  /**
   * Create a new log entry
   */
  create(entry: Partial<NotificationLogEntry>): Promise<string>;

  /**
   * Update a log entry
   */
  update(
    id: string,
    updates: Partial<NotificationLogEntry>
  ): Promise<void>;

  /**
   * Get a log entry by ID
   */
  get(id: string): Promise<NotificationLogEntry | null>;

  /**
   * Query log entries
   */
  query(filters: NotificationLogQueryFilters): Promise<NotificationLogEntry[]>;
}

/**
 * Filters for querying notification logs from the logger interface
 */
export interface NotificationLogQueryFilters {
  type?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  isTest?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Template data with type safety for common variables
 */
export interface CommonTemplateData {
  customer_name?: string;
  pet_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  service_name?: string;
  total_price?: string | number;
  business?: BusinessContext;
  [key: string]: unknown; // Allow additional custom variables
}

/**
 * Send notification helper function type
 */
export type SendNotificationFn = (
  message: NotificationMessage
) => Promise<NotificationResult>;
