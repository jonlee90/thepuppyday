/**
 * Appointment notification utilities
 * Handles email notifications for appointment status changes
 */

import type { AppointmentStatus, NotificationLog, User } from '@/types/database';
import type { AppSupabaseClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export interface NotificationOptions {
  sendEmail?: boolean;
}

export interface AppointmentNotificationData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  cancellationReason?: string;
}

/**
 * Send notification based on appointment status change
 */
export async function sendAppointmentNotification(
  supabase: AppSupabaseClient,
  data: AppointmentNotificationData,
  options: NotificationOptions = { sendEmail: true }
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate customer email for email notifications
  if (options.sendEmail && !isValidEmail(data.customerEmail)) {
    errors.push('Invalid customer email address');
    return { success: false, errors };
  }

  try {
    // Send email notification
    if (options.sendEmail) {
      const emailResult = await sendEmailNotification(supabase, data);
      if (!emailResult.success) {
        errors.push(emailResult.error || 'Email notification failed');
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('[Notifications] Error sending notifications:', error);
    errors.push('Failed to send notifications');
    return { success: false, errors };
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  supabase: AppSupabaseClient,
  data: AppointmentNotificationData
): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = getEmailContent(data);

  try {
    // Log notification attempt
    const logEntry: Partial<NotificationLog> = {
      customer_id: data.customerId,
      type: `appointment_${data.status}`,
      channel: 'email',
      recipient: data.customerEmail,
      subject,
      content,
      status: 'pending',
      error_message: null,
      sent_at: null,
    };

    // In mock mode, we just log to the database
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      // Type assertion for mock client
      const mockResult = await (supabase as any)
        .from('notifications_log')
        .insert(logEntry)
        .select()
        .single();

      if (mockResult.error) {
        throw mockResult.error;
      }

      // Update log entry as sent
      await (supabase as any)
        .from('notifications_log')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', mockResult.data.id);

      return { success: true };
    }

    // In production, use Resend
    // TODO: Implement actual email sending with Resend
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email failed',
    };
  }
}

/**
 * Get email content based on appointment status
 */
function getEmailContent(data: AppointmentNotificationData): {
  subject: string;
  content: string;
} {
  const formattedDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(data.scheduledAt), 'h:mm a');

  switch (data.status) {
    case 'confirmed':
      return {
        subject: 'Appointment Confirmed - The Puppy Day',
        content: `Hi ${data.customerName},

Your grooming appointment for ${data.petName} has been confirmed!

Service: ${data.serviceName}
Date: ${formattedDate}
Time: ${formattedTime}

We look forward to seeing ${data.petName}!

If you need to make any changes, please contact us at (657) 252-2903.

Best regards,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638`,
      };

    case 'cancelled':
      return {
        subject: 'Appointment Cancelled - The Puppy Day',
        content: `Hi ${data.customerName},

Your grooming appointment for ${data.petName} has been cancelled.

Original appointment:
Service: ${data.serviceName}
Date: ${formattedDate}
Time: ${formattedTime}

${data.cancellationReason ? `Reason: ${data.cancellationReason}` : ''}

If you'd like to reschedule, please call us at (657) 252-2903 or book online.

Best regards,
The Puppy Day Team`,
      };

    case 'completed':
      return {
        subject: 'Thank You! - The Puppy Day',
        content: `Hi ${data.customerName},

Thank you for bringing ${data.petName} to The Puppy Day!

We hope ${data.petName} enjoyed the grooming experience. We'd love to hear about your visit!

[Review Link] - Share your experience and help other pet parents

We look forward to seeing ${data.petName} again soon!

Best regards,
The Puppy Day Team
(657) 252-2903`,
      };

    default:
      return {
        subject: 'Appointment Update - The Puppy Day',
        content: `Hi ${data.customerName},

Your appointment for ${data.petName} has been updated.

Service: ${data.serviceName}
Date: ${formattedDate}
Time: ${formattedTime}

If you have any questions, please contact us at (657) 252-2903.

Best regards,
The Puppy Day Team`,
      };
  }
}

/**
 * Validate email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if customer has email notifications enabled
 */
export function hasEmailNotificationsEnabled(user: User): boolean {
  const prefs = user.preferences as any;
  return prefs?.email_appointment_reminders !== false;
}

