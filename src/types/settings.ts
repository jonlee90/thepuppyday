/**
 * Settings types for The Puppy Day
 */

// ===== BUSINESS HOURS =====
export interface DaySchedule {
  is_open: boolean;
  open: string;
  close: string;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// ===== PHASE 6 SETTINGS =====

// Report Card Settings
export interface ReportCardSettings {
  auto_send_delay_minutes: number;
  expiration_days: number;
  google_review_url: string;
}

// Waitlist Settings
export interface WaitlistSettings {
  response_window_hours: number;
  default_discount_percent: number;
}

// Marketing Settings
export interface MarketingSettings {
  retention_reminder_advance_days: number;
}

// Combined Phase 6 Settings
export interface Phase6Settings {
  report_card: ReportCardSettings;
  waitlist: WaitlistSettings;
  marketing: MarketingSettings;
}

// Default Phase 6 Settings
export const DEFAULT_PHASE6_SETTINGS: Phase6Settings = {
  report_card: {
    auto_send_delay_minutes: 15,
    expiration_days: 90,
    google_review_url: 'https://www.google.com/maps/place/Puppy+Day/@33.9176,-118.0086,17z',
  },
  waitlist: {
    response_window_hours: 2,
    default_discount_percent: 10,
  },
  marketing: {
    retention_reminder_advance_days: 7,
  },
};

// ===== NOTIFICATION TEMPLATES =====

export type NotificationTemplateType =
  | 'report_card'
  | 'waitlist_offer'
  | 'breed_reminder'
  | 'appointment_confirmation'
  | 'appointment_reminder';

export interface NotificationTemplate {
  type: NotificationTemplateType;
  name: string;
  description: string;
  sms_content: string;
  email_subject: string;
  email_body: string;
  available_variables: string[];
}

export interface NotificationTemplates {
  report_card: NotificationTemplate;
  waitlist_offer: NotificationTemplate;
  breed_reminder: NotificationTemplate;
  appointment_confirmation: NotificationTemplate;
  appointment_reminder: NotificationTemplate;
}

// Default Templates with proper variable placeholders
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplates = {
  report_card: {
    type: 'report_card',
    name: 'Report Card Notification',
    description: 'Sent when a grooming report card is ready',
    sms_content:
      'Hi {customer_name}! {pet_name}\'s grooming report card is ready! View it here: {report_card_url} - Puppy Day',
    email_subject: '{pet_name}\'s Grooming Report Card from Puppy Day',
    email_body: `Hi {customer_name},

{pet_name} had a great grooming session today! We've prepared a detailed report card with photos and notes.

View the full report card: {report_card_url}

We'd love to hear about your experience! Please share your feedback:
{review_url}

Thank you for trusting us with {pet_name}!

Best,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{report_card_url}',
      '{review_url}',
      '{groomer_name}',
      '{date}',
    ],
  },

  waitlist_offer: {
    type: 'waitlist_offer',
    name: 'Waitlist Offer',
    description: 'Sent when a time slot becomes available for waitlisted customer',
    sms_content:
      'Good news {customer_name}! A slot opened for {date} at {time}. Book now with {discount}% off: {booking_url} (Expires in {expiry_hours}h) - Puppy Day',
    email_subject: 'Good News! Time Slot Available for {pet_name} - {discount}% Off',
    email_body: `Hi {customer_name},

Great news! A grooming appointment slot has opened up for {pet_name}.

Date: {date}
Time: {time}
Special Waitlist Discount: {discount}% off

Click here to claim your spot: {booking_url}

This offer expires in {expiry_hours} hours, so book soon!

We look forward to pampering {pet_name}!

Best,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{date}',
      '{time}',
      '{discount}',
      '{booking_url}',
      '{expiry_hours}',
    ],
  },

  breed_reminder: {
    type: 'breed_reminder',
    name: 'Breed-Based Grooming Reminder',
    description: 'Sent based on breed grooming frequency recommendations',
    sms_content:
      'Hi {customer_name}! It\'s been {weeks_since} weeks since {pet_name}\'s last groom. Time to book? {booking_url} - Puppy Day',
    email_subject: 'Time for {pet_name}\'s Grooming Appointment',
    email_body: `Hi {customer_name},

We hope {pet_name} is doing great!

It's been {weeks_since} weeks since their last grooming appointment. For {breed_name} breeds, we recommend grooming every {recommended_frequency} weeks to keep their coat healthy and beautiful.

Ready to schedule? Book online: {booking_url}

Or give us a call: (657) 252-2903

We can't wait to see {pet_name} again!

Best,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{breed_name}',
      '{weeks_since}',
      '{recommended_frequency}',
      '{booking_url}',
      '{last_appointment_date}',
    ],
  },

  appointment_confirmation: {
    type: 'appointment_confirmation',
    name: 'Appointment Confirmation',
    description: 'Sent immediately after booking confirmation',
    sms_content:
      'Hi {customer_name}! {pet_name}\'s grooming is confirmed for {date} at {time}. See you soon! - Puppy Day',
    email_subject: 'Appointment Confirmed for {pet_name} - {date}',
    email_body: `Hi {customer_name},

Your grooming appointment has been confirmed!

Pet: {pet_name}
Service: {service_name}
Date: {date}
Time: {time}
Total: {total}

Location:
Puppy Day
14936 Leffingwell Rd
La Mirada, CA 90638

Need to make changes? Contact us at (657) 252-2903 or reply to this email.

We look forward to pampering {pet_name}!

Best,
The Puppy Day Team`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{service_name}',
      '{date}',
      '{time}',
      '{total}',
      '{addons}',
      '{special_requests}',
    ],
  },

  appointment_reminder: {
    type: 'appointment_reminder',
    name: 'Appointment Reminder',
    description: 'Sent 24 hours before appointment',
    sms_content:
      'Reminder: {pet_name}\'s grooming appointment is tomorrow at {time}. See you then! - Puppy Day',
    email_subject: 'Reminder: {pet_name}\'s Appointment Tomorrow at {time}',
    email_body: `Hi {customer_name},

This is a friendly reminder about {pet_name}'s grooming appointment tomorrow.

Date: {date}
Time: {time}
Service: {service_name}

Please arrive a few minutes early. If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Location:
Puppy Day
14936 Leffingwell Rd
La Mirada, CA 90638
(657) 252-2903

See you soon!

Best,
The Puppy Day Team`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{service_name}',
      '{date}',
      '{time}',
      '{groomer_name}',
      '{special_requests}',
    ],
  },
};

// ===== API TYPES =====

export interface UpdatePhase6SettingsRequest {
  report_card?: Partial<ReportCardSettings>;
  waitlist?: Partial<WaitlistSettings>;
  marketing?: Partial<MarketingSettings>;
}

export interface UpdateTemplatesRequest {
  templates: Partial<NotificationTemplates>;
}

export interface ResetTemplatesRequest {
  types?: NotificationTemplateType[];
}
