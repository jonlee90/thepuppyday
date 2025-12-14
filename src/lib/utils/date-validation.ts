/**
 * Date Validation Utility
 * Prevents SQL injection and invalid date attacks
 */

/**
 * Validate and parse date from URL parameter
 * @throws Error if date is invalid or out of acceptable range
 */
export function validateAndParseDate(dateString: string | null, paramName: string): Date {
  if (!dateString) {
    throw new Error(`${paramName} is required`);
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ${paramName} format`);
  }

  // Prevent unreasonable date ranges (e.g., year 9999)
  const minDate = new Date('2020-01-01');
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  if (date < minDate || date > maxDate) {
    throw new Error(
      `${paramName} must be between ${minDate.toISOString().split('T')[0]} and ${maxDate.toISOString().split('T')[0]}`
    );
  }

  return date;
}

/**
 * Validate date range
 * @throws Error if start date is after end date
 */
export function validateDateRange(start: Date, end: Date): void {
  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }

  // Prevent excessively large date ranges (e.g., > 2 years)
  const maxRangeDays = 730; // 2 years
  const rangeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (rangeDays > maxRangeDays) {
    throw new Error(`Date range cannot exceed ${maxRangeDays} days`);
  }
}
