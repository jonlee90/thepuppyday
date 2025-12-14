/**
 * Campaign Validation Library
 * Validates campaign creation and editing forms step-by-step
 */

import type { CampaignChannel, SegmentCriteria, MessageContent, ABTestConfig } from '@/types/marketing';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate campaign type selection (Step 1)
 */
export function validateCampaignType(type: string | null): ValidationResult {
  const errors: ValidationError[] = [];

  if (!type) {
    errors.push({
      field: 'type',
      message: 'Please select a campaign type',
    });
  }

  if (type && !['one_time', 'recurring'].includes(type)) {
    errors.push({
      field: 'type',
      message: 'Invalid campaign type',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate segment criteria (Step 2)
 */
export function validateSegmentCriteria(criteria: SegmentCriteria): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if at least one filter is set
  const hasAnyFilter =
    criteria.last_visit_days !== undefined ||
    criteria.min_visits !== undefined ||
    criteria.max_visits !== undefined ||
    criteria.has_membership !== undefined ||
    criteria.loyalty_eligible !== undefined ||
    (criteria.pet_size && criteria.pet_size.length > 0) ||
    (criteria.service_ids && criteria.service_ids.length > 0) ||
    (criteria.breed_ids && criteria.breed_ids.length > 0) ||
    criteria.min_appointments !== undefined ||
    criteria.max_appointments !== undefined ||
    criteria.min_total_spend !== undefined ||
    criteria.not_visited_since !== undefined ||
    criteria.has_upcoming_appointment !== undefined ||
    (criteria.tags && criteria.tags.length > 0);

  if (!hasAnyFilter) {
    errors.push({
      field: 'segment_criteria',
      message: 'Please select at least one audience filter',
    });
  }

  // Validate numeric ranges
  if (
    criteria.min_visits !== undefined &&
    criteria.max_visits !== undefined &&
    criteria.min_visits > criteria.max_visits
  ) {
    errors.push({
      field: 'visits',
      message: 'Minimum visits cannot be greater than maximum visits',
    });
  }

  if (
    criteria.min_appointments !== undefined &&
    criteria.max_appointments !== undefined &&
    criteria.min_appointments > criteria.max_appointments
  ) {
    errors.push({
      field: 'appointments',
      message: 'Minimum appointments cannot be greater than maximum appointments',
    });
  }

  // Validate positive numbers
  if (criteria.last_visit_days !== undefined && criteria.last_visit_days < 0) {
    errors.push({
      field: 'last_visit_days',
      message: 'Last visit days must be a positive number',
    });
  }

  if (criteria.min_total_spend !== undefined && criteria.min_total_spend < 0) {
    errors.push({
      field: 'min_total_spend',
      message: 'Minimum spend must be a positive number',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate message content (Step 3)
 */
export function validateMessageContent(
  channel: CampaignChannel,
  content: MessageContent
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate based on selected channel
  if (channel === 'sms' || channel === 'both') {
    if (!content.sms_body || content.sms_body.trim().length === 0) {
      errors.push({
        field: 'sms_body',
        message: 'SMS message is required',
      });
    }

    if (content.sms_body && content.sms_body.length > 160) {
      errors.push({
        field: 'sms_body',
        message: 'SMS message must be 160 characters or less',
      });
    }
  }

  if (channel === 'email' || channel === 'both') {
    if (!content.email_subject || content.email_subject.trim().length === 0) {
      errors.push({
        field: 'email_subject',
        message: 'Email subject is required',
      });
    }

    if (content.email_subject && content.email_subject.length > 100) {
      errors.push({
        field: 'email_subject',
        message: 'Email subject must be 100 characters or less',
      });
    }

    if (!content.email_body || content.email_body.trim().length === 0) {
      errors.push({
        field: 'email_body',
        message: 'Email body is required',
      });
    }

    if (content.email_body && content.email_body.length > 5000) {
      errors.push({
        field: 'email_body',
        message: 'Email body must be 5000 characters or less',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate A/B test configuration
 */
export function validateABTestConfig(config: ABTestConfig | null, channel: CampaignChannel): ValidationResult {
  const errors: ValidationError[] = [];

  if (!config || !config.enabled) {
    return { isValid: true, errors: [] };
  }

  // Validate split percentage
  if (config.split_percentage < 0 || config.split_percentage > 100) {
    errors.push({
      field: 'split_percentage',
      message: 'Split percentage must be between 0 and 100',
    });
  }

  // Validate variant A
  const variantAValidation = validateMessageContent(channel, config.variant_a);
  if (!variantAValidation.isValid) {
    errors.push({
      field: 'variant_a',
      message: 'Variant A has validation errors',
    });
  }

  // Validate variant B
  const variantBValidation = validateMessageContent(channel, config.variant_b);
  if (!variantBValidation.isValid) {
    errors.push({
      field: 'variant_b',
      message: 'Variant B has validation errors',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate scheduling configuration (Step 4)
 */
export function validateScheduling(
  sendNow: boolean,
  scheduledAt: string | null,
  isRecurring: boolean,
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  }
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!sendNow) {
    if (!scheduledAt) {
      errors.push({
        field: 'scheduled_at',
        message: 'Please select a date and time for scheduled send',
      });
    }

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        errors.push({
          field: 'scheduled_at',
          message: 'Scheduled time must be in the future',
        });
      }

      // Don't allow scheduling more than 1 year in advance
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      if (scheduledDate > oneYearFromNow) {
        errors.push({
          field: 'scheduled_at',
          message: 'Cannot schedule more than 1 year in advance',
        });
      }
    }
  }

  // Validate recurring configuration
  if (isRecurring && recurringConfig) {
    if (!recurringConfig.frequency) {
      errors.push({
        field: 'recurring_frequency',
        message: 'Please select a recurrence frequency',
      });
    }

    if (recurringConfig.frequency === 'weekly' && recurringConfig.dayOfWeek === undefined) {
      errors.push({
        field: 'recurring_day_of_week',
        message: 'Please select a day of the week',
      });
    }

    if (recurringConfig.frequency === 'monthly' && recurringConfig.dayOfMonth === undefined) {
      errors.push({
        field: 'recurring_day_of_month',
        message: 'Please select a day of the month',
      });
    }

    if (!recurringConfig.time) {
      errors.push({
        field: 'recurring_time',
        message: 'Please select a time for recurring sends',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete campaign data before submission
 */
export function validateCompleteCampaign(data: {
  name: string;
  type: string;
  channel: CampaignChannel;
  segment_criteria: SegmentCriteria;
  message_content: MessageContent;
  ab_test_config: ABTestConfig | null;
  send_now: boolean;
  scheduled_at: string | null;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Campaign name is required',
    });
  }

  if (data.name && data.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Campaign name must be 100 characters or less',
    });
  }

  // Validate type
  const typeValidation = validateCampaignType(data.type);
  errors.push(...typeValidation.errors);

  // Validate segment
  const segmentValidation = validateSegmentCriteria(data.segment_criteria);
  errors.push(...segmentValidation.errors);

  // Validate message content
  const contentValidation = validateMessageContent(data.channel, data.message_content);
  errors.push(...contentValidation.errors);

  // Validate A/B test if enabled
  const abTestValidation = validateABTestConfig(data.ab_test_config, data.channel);
  errors.push(...abTestValidation.errors);

  // Validate scheduling
  const schedulingValidation = validateScheduling(
    data.send_now,
    data.scheduled_at,
    data.type === 'recurring'
  );
  errors.push(...schedulingValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
