/**
 * Tests for notification settings utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseCronExpression,
  formatRelativeTime,
  calculateFailureRate,
  getFailureRateColor,
  formatFailureRate,
  getNotificationTypeLabel,
  formatCount,
} from '@/app/admin/notifications/settings/utils';

describe('parseCronExpression', () => {
  it('should parse daily cron expressions', () => {
    expect(parseCronExpression('0 9 * * *')).toBe('Daily at 9:00 AM');
    expect(parseCronExpression('0 14 * * *')).toBe('Daily at 2:00 PM');
    expect(parseCronExpression('30 9 * * *')).toBe('Custom: 30 9 * * *');
  });

  it('should parse hourly cron expressions', () => {
    expect(parseCronExpression('0 */2 * * *')).toBe('Every 2 hours');
    expect(parseCronExpression('0 */4 * * *')).toBe('Every 4 hours');
  });

  it('should parse weekly cron expressions', () => {
    expect(parseCronExpression('0 9 * * 1')).toBe('Weekly on Monday at 9:00 AM');
    expect(parseCronExpression('0 14 * * 5')).toBe('Weekly on Friday at 2:00 PM');
  });

  it('should parse monthly cron expressions', () => {
    expect(parseCronExpression('0 9 1 * *')).toBe('Monthly on the 1st at 9:00 AM');
    expect(parseCronExpression('0 14 15 * *')).toBe('Monthly on the 15th at 2:00 PM');
  });

  it('should return "Manual" for null or empty cron', () => {
    expect(parseCronExpression(null)).toBe('Manual');
    expect(parseCronExpression('')).toBe('Manual');
  });

  it('should return custom for complex cron expressions', () => {
    expect(parseCronExpression('0 9 * * 1,3,5')).toBe('Custom: 0 9 * * 1,3,5');
  });
});

describe('formatRelativeTime', () => {
  it('should return "Never" for null', () => {
    expect(formatRelativeTime(null)).toBe('Never');
  });

  it('should format recent times correctly', () => {
    const now = new Date();

    // Just now
    expect(formatRelativeTime(now.toISOString())).toBe('Just now');

    // 30 minutes ago
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    expect(formatRelativeTime(thirtyMinutesAgo.toISOString())).toBe('30 minutes ago');

    // 2 hours ago
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo.toISOString())).toBe('2 hours ago');

    // 3 days ago
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3 days ago');
  });

  it('should handle singular forms', () => {
    const now = new Date();

    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
    expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');

    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(formatRelativeTime(oneHourAgo.toISOString())).toBe('1 hour ago');

    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(oneDayAgo.toISOString())).toBe('1 day ago');
  });
});

describe('calculateFailureRate', () => {
  it('should calculate failure rate correctly', () => {
    expect(calculateFailureRate(100, 5)).toBe(5);
    expect(calculateFailureRate(1000, 50)).toBe(5);
    expect(calculateFailureRate(100, 15)).toBe(15);
  });

  it('should return null when no messages sent', () => {
    expect(calculateFailureRate(0, 0)).toBe(null);
    expect(calculateFailureRate(0, 5)).toBe(null);
  });

  it('should handle 0% failure rate', () => {
    expect(calculateFailureRate(100, 0)).toBe(0);
  });
});

describe('getFailureRateColor', () => {
  it('should return green for rates below 5%', () => {
    expect(getFailureRateColor(0)).toBe('text-green-600');
    expect(getFailureRateColor(4.9)).toBe('text-green-600');
  });

  it('should return amber for rates between 5-10%', () => {
    expect(getFailureRateColor(5)).toBe('text-amber-600');
    expect(getFailureRateColor(7.5)).toBe('text-amber-600');
    expect(getFailureRateColor(9.9)).toBe('text-amber-600');
  });

  it('should return red for rates above 10%', () => {
    expect(getFailureRateColor(10)).toBe('text-red-600');
    expect(getFailureRateColor(15)).toBe('text-red-600');
  });

  it('should return gray for null rate', () => {
    expect(getFailureRateColor(null)).toBe('text-gray-500');
  });
});

describe('formatFailureRate', () => {
  it('should format failure rate with 1 decimal place', () => {
    expect(formatFailureRate(5.5)).toBe('5.5%');
    expect(formatFailureRate(10.123)).toBe('10.1%');
  });

  it('should return "N/A" for null', () => {
    expect(formatFailureRate(null)).toBe('N/A');
  });
});

describe('getNotificationTypeLabel', () => {
  it('should return correct labels for known types', () => {
    expect(getNotificationTypeLabel('appointment_reminder')).toBe('Appointment Reminder');
    expect(getNotificationTypeLabel('report_card_sent')).toBe('Report Card');
    expect(getNotificationTypeLabel('breed_reminder')).toBe('Grooming Reminder');
  });

  it('should format unknown types as title case', () => {
    expect(getNotificationTypeLabel('custom_notification')).toBe('Custom Notification');
    expect(getNotificationTypeLabel('test_type')).toBe('Test Type');
  });
});

describe('formatCount', () => {
  it('should format numbers with thousands separator', () => {
    expect(formatCount(1000)).toBe('1,000');
    expect(formatCount(1500)).toBe('1,500');
    expect(formatCount(1000000)).toBe('1,000,000');
  });

  it('should handle small numbers', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
  });
});
