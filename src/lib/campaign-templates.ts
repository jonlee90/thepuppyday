/**
 * Campaign Template Library
 * Pre-defined marketing campaign templates for common use cases
 */

import type { CampaignChannel, MessageContent, SegmentCriteria } from '@/types/marketing';

export interface CampaignTemplatePreset {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'retention' | 'winback' | 'promotional' | 'lifecycle';
  channel: CampaignChannel;
  message_content: MessageContent;
  suggested_criteria: SegmentCriteria;
  icon: string;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplatePreset[] = [
  {
    id: 'welcome-new-customers',
    name: 'Welcome New Customers',
    description: 'Send a warm welcome to customers who just signed up',
    category: 'onboarding',
    channel: 'both',
    icon: 'wave',
    message_content: {
      sms_body: 'Welcome to Puppy Day, {customer_name}! We\'re excited to pamper {pet_name}. Book your first grooming: {booking_link}',
      email_subject: 'Welcome to Puppy Day - Your Pup\'s New Favorite Place!',
      email_body: `Hi {customer_name},

Welcome to the Puppy Day family! We're thrilled that you've chosen us to care for {pet_name}.

Our team of professional groomers is ready to make {pet_name} look and feel amazing. From basic grooming to premium styling, we've got everything your furry friend needs.

Ready to book your first appointment? Click here: {booking_link}

Looking forward to meeting {pet_name}!

Best regards,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903`,
    },
    suggested_criteria: {
      min_appointments: 0,
      max_appointments: 0,
      last_visit_days: 7,
    },
  },
  {
    id: 'winback-inactive',
    name: 'Win Back Inactive Customers',
    description: 'Re-engage customers who haven\'t visited in 60+ days',
    category: 'winback',
    channel: 'both',
    icon: 'return',
    message_content: {
      sms_body: 'We miss {pet_name}! It\'s been a while since your last grooming. Book now and get 15% off: {booking_link}',
      email_subject: 'We Miss {pet_name}! Come Back for 15% Off',
      email_body: `Hi {customer_name},

We noticed it's been a while since {pet_name} visited us for grooming. We miss seeing that adorable face!

Your furry friend deserves to look and feel their best. To welcome you back, we're offering 15% off your next grooming appointment.

Book now to claim your discount: {booking_link}

This offer expires in 7 days, so don't wait!

Can't wait to see {pet_name} again!

Best regards,
The Puppy Day Team`,
    },
    suggested_criteria: {
      not_visited_since: '60',
      min_appointments: 1,
    },
  },
  {
    id: 'birthday-anniversary',
    name: 'Birthday & Anniversary Wishes',
    description: 'Celebrate customer milestones with a special offer',
    category: 'lifecycle',
    channel: 'both',
    icon: 'cake',
    message_content: {
      sms_body: 'Happy Birthday {pet_name}! Celebrate with a complimentary teeth brushing on your next visit. Book today: {booking_link}',
      email_subject: 'Happy Birthday {pet_name}! Here\'s a Special Gift',
      email_body: `Hi {customer_name},

Happy Birthday to {pet_name}! We hope this special day is filled with treats, belly rubs, and tail wags.

To celebrate, we'd like to offer a complimentary teeth brushing add-on with your next grooming appointment (a $10 value).

Book your birthday grooming session: {booking_link}

This gift is valid for 30 days from {pet_name}'s birthday.

Wishing {pet_name} the happiest of birthdays!

Best regards,
The Puppy Day Team`,
    },
    suggested_criteria: {
      // This would typically be filtered by pet birthday in actual implementation
      has_membership: false,
    },
  },
  {
    id: 'seasonal-promotion',
    name: 'Seasonal Promotion',
    description: 'Drive bookings with limited-time seasonal offers',
    category: 'promotional',
    channel: 'both',
    icon: 'tag',
    message_content: {
      sms_body: 'Spring Special! Get {pet_name} groomed & ready for the season. 20% off all services this week: {booking_link}',
      email_subject: 'Spring Into Savings - 20% Off All Grooming Services!',
      email_body: `Hi {customer_name},

Spring is here, and it's the perfect time to freshen up {pet_name}'s look!

For a limited time, we're offering 20% off ALL grooming services - from basic baths to premium styling.

Why spring grooming is important:
- Remove winter undercoat
- Prevent matting and tangles
- Keep your pup cool and comfortable
- Look great for spring photos!

Book your appointment now: {booking_link}

This offer is valid through [end date]. Slots are filling up fast, so don't wait!

Best regards,
The Puppy Day Team`,
    },
    suggested_criteria: {
      // Target all customers for promotional campaigns
      loyalty_eligible: true,
    },
  },
  {
    id: 'membership-renewal',
    name: 'Membership Renewal Reminder',
    description: 'Remind customers about upcoming membership renewals',
    category: 'retention',
    channel: 'email',
    icon: 'refresh',
    message_content: {
      email_subject: 'Your Puppy Day Membership Renews Soon',
      email_body: `Hi {customer_name},

Your Puppy Day membership is set to renew on [renewal_date]. We wanted to give you a heads up!

Your membership benefits:
- Priority booking for {pet_name}
- Exclusive discounts on grooming services
- Special members-only promotions
- Loyalty points on every visit

Your membership will automatically renew. If you have any questions or need to make changes, please contact us at (657) 252-2903.

Thank you for being a valued member!

Best regards,
The Puppy Day Team`,
    },
    suggested_criteria: {
      has_membership: true,
      // Would typically filter by renewal date in actual implementation
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CampaignTemplatePreset | undefined {
  return CAMPAIGN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: CampaignTemplatePreset['category']): CampaignTemplatePreset[] {
  return CAMPAIGN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): CampaignTemplatePreset['category'][] {
  return ['onboarding', 'retention', 'winback', 'promotional', 'lifecycle'];
}
