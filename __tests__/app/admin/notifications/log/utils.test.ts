/**
 * Tests for Notification Log Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  formatFullTimestamp,
  getStatusBadgeClass,
  getStatusText,
  getChannelIcon,
  generateCSV,
  generateCSVFilename,
  buildQueryString,
  formatTemplateData,
  truncate,
} from '@/app/admin/notifications/log/utils';
import type {
  NotificationLogListItem,
  NotificationLogFilters,
} from '@/types/notification-log';

describe('Log Utilities', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats recent time as "just now"', () => {
      const date = new Date('2024-01-20T11:59:30Z').toISOString();
      expect(formatRelativeTime(date)).toBe('just now');
    });

    it('formats minutes ago', () => {
      const date = new Date('2024-01-20T11:45:00Z').toISOString();
      expect(formatRelativeTime(date)).toBe('15 minutes ago');
    });

    it('formats hours ago', () => {
      const date = new Date('2024-01-20T10:00:00Z').toISOString();
      expect(formatRelativeTime(date)).toBe('2 hours ago');
    });

    it('formats days ago', () => {
      const date = new Date('2024-01-18T12:00:00Z').toISOString();
      expect(formatRelativeTime(date)).toBe('2 days ago');
    });

    it('formats older dates as date string', () => {
      const date = new Date('2024-01-01T12:00:00Z').toISOString();
      const result = formatRelativeTime(date);
      expect(result).toContain('Jan');
    });
  });

  describe('formatFullTimestamp', () => {
    it('formats full timestamp correctly', () => {
      const date = '2024-01-20T15:30:00Z';
      const result = formatFullTimestamp(date);
      expect(result).toContain('Jan');
      expect(result).toContain('20');
      expect(result).toContain('2024');
    });
  });

  describe('getStatusBadgeClass', () => {
    it('returns success class for sent status', () => {
      expect(getStatusBadgeClass('sent')).toBe('badge-success');
    });

    it('returns error class for failed status', () => {
      expect(getStatusBadgeClass('failed')).toBe('badge-error');
    });

    it('returns warning class for pending status', () => {
      expect(getStatusBadgeClass('pending')).toBe('badge-warning');
    });
  });

  describe('getStatusText', () => {
    it('returns "Delivered" for sent status', () => {
      expect(getStatusText('sent')).toBe('Delivered');
    });

    it('returns "Failed" for failed status', () => {
      expect(getStatusText('failed')).toBe('Failed');
    });

    it('returns "Pending" for pending status', () => {
      expect(getStatusText('pending')).toBe('Pending');
    });
  });

  describe('getChannelIcon', () => {
    it('returns email icon for email channel', () => {
      expect(getChannelIcon('email')).toBe('📧');
    });

    it('returns SMS icon for sms channel', () => {
      expect(getChannelIcon('sms')).toBe('📱');
    });
  });

  describe('generateCSV', () => {
    it('generates CSV from log items', () => {
      const logs: NotificationLogListItem[] = [
        {
          id: '1',
          customer_id: 'cust-1',
          customer_name: 'John Doe',
          type: 'appointment_reminder',
          channel: 'email',
          recipient: 'john@example.com',
          subject: 'Your appointment',
          status: 'sent',
          error_message: null,
          sent_at: '2024-01-20T10:00:00Z',
          created_at: '2024-01-20T09:00:00Z',
          is_test: false,
        },
      ];

      const csv = generateCSV(logs);
      expect(csv).toContain('Date');
      expect(csv).toContain('Type');
      expect(csv).toContain('Channel');
      expect(csv).toContain('john@example.com');
      expect(csv).toContain('John Doe');
    });

    it('handles empty logs array', () => {
      const csv = generateCSV([]);
      expect(csv).toBe('');
    });

    it('escapes CSV fields with commas', () => {
      const logs: NotificationLogListItem[] = [
        {
          id: '1',
          customer_id: null,
          customer_name: 'Doe, John',
          type: 'appointment_reminder',
          channel: 'email',
          recipient: 'john@example.com',
          subject: 'Your appointment, tomorrow',
          status: 'sent',
          error_message: null,
          sent_at: '2024-01-20T10:00:00Z',
          created_at: '2024-01-20T09:00:00Z',
          is_test: false,
        },
      ];

      const csv = generateCSV(logs);
      expect(csv).toContain('"Doe, John"');
      expect(csv).toContain('"Your appointment, tomorrow"');
    });
  });

  describe('generateCSVFilename', () => {
    it('generates default filename with current date', () => {
      const filters: NotificationLogFilters = {};
      const filename = generateCSVFilename(filters);
      expect(filename).toMatch(/notification-logs-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('generates filename with date range', () => {
      const filters: NotificationLogFilters = {
        start_date: '2024-01-01T00:00:00',
        end_date: '2024-01-31T23:59:59',
      };
      const filename = generateCSVFilename(filters);
      expect(filename).toBe('notification-logs-2024-01-01-to-2024-01-31.csv');
    });

    it('generates filename with start date only', () => {
      const filters: NotificationLogFilters = {
        start_date: '2024-01-01T00:00:00',
      };
      const filename = generateCSVFilename(filters);
      expect(filename).toBe('notification-logs-from-2024-01-01.csv');
    });

    it('generates filename with end date only', () => {
      const filters: NotificationLogFilters = {
        end_date: '2024-01-31T23:59:59',
      };
      const filename = generateCSVFilename(filters);
      expect(filename).toBe('notification-logs-until-2024-01-31.csv');
    });
  });

  describe('buildQueryString', () => {
    it('builds query string with page and limit', () => {
      const filters: NotificationLogFilters = {};
      const query = buildQueryString(filters, 1, 50);
      expect(query).toBe('page=1&limit=50');
    });

    it('includes all filters in query string', () => {
      const filters: NotificationLogFilters = {
        search: 'test@example.com',
        type: 'appointment_reminder',
        channel: 'email',
        status: 'sent',
        start_date: '2024-01-01T00:00:00',
        end_date: '2024-01-31T23:59:59',
      };
      const query = buildQueryString(filters, 2, 25);
      expect(query).toContain('page=2');
      expect(query).toContain('limit=25');
      expect(query).toContain('search=test%40example.com');
      expect(query).toContain('type=appointment_reminder');
      expect(query).toContain('channel=email');
      expect(query).toContain('status=sent');
      expect(query).toContain('start_date=2024-01-01T00%3A00%3A00');
      expect(query).toContain('end_date=2024-01-31T23%3A59%3A59');
    });

    it('excludes "all" filters', () => {
      const filters: NotificationLogFilters = {
        channel: 'all',
        status: 'all',
      };
      const query = buildQueryString(filters, 1, 50);
      expect(query).not.toContain('channel=all');
      expect(query).not.toContain('status=all');
    });
  });

  describe('formatTemplateData', () => {
    it('formats template data as JSON', () => {
      const data = { name: 'John', appointment_date: '2024-01-20' };
      const result = formatTemplateData(data);
      expect(result).toContain('"name": "John"');
      expect(result).toContain('"appointment_date": "2024-01-20"');
    });

    it('returns message for null data', () => {
      expect(formatTemplateData(null)).toBe('No template data');
    });

    it('returns message for empty data', () => {
      expect(formatTemplateData({})).toBe('No template data');
    });
  });

  describe('truncate', () => {
    it('truncates long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncate(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('does not truncate short text', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      expect(result).toBe('Short text');
    });
  });
});
