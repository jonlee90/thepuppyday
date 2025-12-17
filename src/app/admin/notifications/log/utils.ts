/**
 * Notification Log Viewer Utilities
 * Task 0145-0148: Helper functions for log viewer
 */

import type {
  NotificationLogListItem,
  NotificationLogCSVRow,
  NotificationLogFilters,
} from '@/types/notification-log';
import { getNotificationTypeLabel } from '@/types/notifications';

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffDay > 365 ? 'numeric' : undefined,
    });
  }
}

/**
 * Format full timestamp (for hover tooltips)
 */
export function formatFullTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get status badge color class
 */
export function getStatusBadgeClass(status: 'sent' | 'failed' | 'pending'): string {
  switch (status) {
    case 'sent':
      return 'badge-success';
    case 'failed':
      return 'badge-error';
    case 'pending':
      return 'badge-warning';
    default:
      return 'badge-ghost';
  }
}

/**
 * Get status text
 */
export function getStatusText(status: 'sent' | 'failed' | 'pending'): string {
  switch (status) {
    case 'sent':
      return 'Delivered';
    case 'failed':
      return 'Failed';
    case 'pending':
      return 'Pending';
    default:
      return status;
  }
}

/**
 * Get channel icon
 */
export function getChannelIcon(channel: 'email' | 'sms'): string {
  return channel === 'email' ? '📧' : '📱';
}

/**
 * Generate CSV content from notification logs
 */
export function generateCSV(logs: NotificationLogListItem[]): string {
  if (logs.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers: (keyof NotificationLogCSVRow)[] = [
    'Date',
    'Type',
    'Channel',
    'Recipient',
    'Customer',
    'Status',
    'Subject',
    'Sent At',
    'Error Message',
    'Is Test',
  ];

  // Convert logs to CSV rows
  const rows: NotificationLogCSVRow[] = logs.map((log) => ({
    Date: formatFullTimestamp(log.created_at),
    Type: getNotificationTypeLabel(log.type),
    Channel: log.channel.toUpperCase(),
    Recipient: log.recipient,
    Customer: log.customer_name || 'N/A',
    Status: getStatusText(log.status),
    Subject: log.subject || 'N/A',
    'Sent At': log.sent_at ? formatFullTimestamp(log.sent_at) : 'N/A',
    'Error Message': log.error_message || '',
    'Is Test': log.is_test ? 'Yes' : 'No',
  }));

  // Build CSV string
  const headerRow = headers.map(escapeCSVField).join(',');
  const dataRows = rows.map((row) =>
    headers.map((header) => escapeCSVField(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(value: string): string {
  if (!value) return '""';

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generate CSV filename with date range
 */
export function generateCSVFilename(filters: NotificationLogFilters): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD

  let filename = `notification-logs-${timestamp}`;

  if (filters.start_date && filters.end_date) {
    const start = filters.start_date.split('T')[0];
    const end = filters.end_date.split('T')[0];
    filename = `notification-logs-${start}-to-${end}`;
  } else if (filters.start_date) {
    const start = filters.start_date.split('T')[0];
    filename = `notification-logs-from-${start}`;
  } else if (filters.end_date) {
    const end = filters.end_date.split('T')[0];
    filename = `notification-logs-until-${end}`;
  }

  return `${filename}.csv`;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Build query string from filters
 */
export function buildQueryString(
  filters: NotificationLogFilters,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('limit', String(limit));

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.type) {
    params.append('type', filters.type);
  }

  if (filters.channel && filters.channel !== 'all') {
    params.append('channel', filters.channel);
  }

  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  if (filters.start_date) {
    params.append('start_date', filters.start_date);
  }

  if (filters.end_date) {
    params.append('end_date', filters.end_date);
  }

  return params.toString();
}

/**
 * Format template data for display
 */
export function formatTemplateData(data: Record<string, unknown> | null): string {
  if (!data || Object.keys(data).length === 0) {
    return 'No template data';
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
