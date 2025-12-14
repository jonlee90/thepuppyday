/**
 * Report Card Validation Utilities
 * Validation logic for report card form submissions
 */

import type { ReportCardFormState } from '@/types/report-card';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates report card form state before submission
 */
export function validateReportCard(
  formState: ReportCardFormState,
  isDraft: boolean = false
): ValidationResult {
  const errors: Record<string, string> = {};

  // If submitting as final (not draft), apply strict validation
  if (!isDraft) {
    // After photo is required
    if (!formState.after_photo_url || formState.after_photo_url.trim() === '') {
      errors.after_photo = 'After photo is required to submit the report card';
    }

    // At least one assessment field required
    const hasAssessment =
      formState.mood !== null ||
      formState.coat_condition !== null ||
      formState.behavior !== null;

    if (!hasAssessment) {
      errors.assessment = 'At least one assessment field (mood, coat condition, or behavior) is required';
    }
  }

  // Groomer notes length validation (if provided)
  if (formState.groomer_notes && formState.groomer_notes.length > 500) {
    errors.groomer_notes = 'Groomer notes must be 500 characters or less';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if report card can be edited (within 24 hours of creation)
 */
export function canEditReportCard(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  return hoursSinceCreation < 24;
}

/**
 * Sanitize groomer notes to prevent XSS
 */
export function sanitizeGroomerNotes(notes: string): string {
  // Remove HTML tags
  const withoutHtml = notes.replace(/<[^>]*>/g, '');
  // Trim whitespace
  return withoutHtml.trim();
}
