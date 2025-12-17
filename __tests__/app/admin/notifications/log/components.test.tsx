/**
 * Tests for Notification Log Viewer Components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogFilters } from '@/app/admin/notifications/log/components/LogFilters';
import { LogTable } from '@/app/admin/notifications/log/components/LogTable';
import { ExportButton } from '@/app/admin/notifications/log/components/ExportButton';
import { ResendModal } from '@/app/admin/notifications/log/components/ResendModal';
import type {
  NotificationLogListItem,
  NotificationLogDetail,
  NotificationLogFilters,
} from '@/types/notification-log';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('LogFilters Component', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnApplyFilters = vi.fn();

  const defaultFilters: NotificationLogFilters = {
    search: undefined,
    type: undefined,
    channel: 'all',
    status: 'all',
    start_date: undefined,
    end_date: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter controls', () => {
    render(
      <LogFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    expect(screen.getByPlaceholderText(/search by email or phone/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /channel/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('debounces search input', async () => {
    vi.useFakeTimers();

    render(
      <LogFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by email or phone/i);
    fireEvent.change(searchInput, { target: { value: 'test@example.com' } });

    // Should not call immediately
    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // After 300ms debounce
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'test@example.com',
      });
    });

    vi.useRealTimers();
  });

  it('updates channel filter', () => {
    render(
      <LogFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    const channelSelect = screen.getByRole('combobox', { name: /channel/i });
    fireEvent.change(channelSelect, { target: { value: 'email' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      channel: 'email',
    });
  });

  it('updates status filter', () => {
    render(
      <LogFilters
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: 'failed' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: 'failed',
    });
  });

  it('displays active filter chips', () => {
    const activeFilters: NotificationLogFilters = {
      search: 'test@example.com',
      type: 'appointment_reminder',
      channel: 'email',
      status: 'sent',
    };

    render(
      <LogFilters
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    expect(screen.getByText(/search: "test@example.com"/i)).toBeInTheDocument();
    expect(screen.getByText(/type:/i)).toBeInTheDocument();
    expect(screen.getByText(/channel: email/i)).toBeInTheDocument();
    expect(screen.getByText(/status: sent/i)).toBeInTheDocument();
  });

  it('clears all filters', () => {
    const activeFilters: NotificationLogFilters = {
      search: 'test@example.com',
      channel: 'email',
      status: 'sent',
    };

    render(
      <LogFilters
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onApplyFilters={mockOnApplyFilters}
      />
    );

    const clearButton = screen.getByText(/clear all/i);
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: undefined,
      type: undefined,
      channel: 'all',
      status: 'all',
      start_date: undefined,
      end_date: undefined,
    });
  });
});

describe('LogTable Component', () => {
  const mockOnResend = vi.fn();
  const mockOnLoadDetail = vi.fn();

  const mockLogs: NotificationLogListItem[] = [
    {
      id: 'log-1',
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
    {
      id: 'log-2',
      customer_id: 'cust-2',
      customer_name: 'Jane Smith',
      type: 'appointment_reminder',
      channel: 'sms',
      recipient: '+15551234567',
      subject: null,
      status: 'failed',
      error_message: 'Invalid phone number',
      sent_at: null,
      created_at: '2024-01-20T08:00:00Z',
      is_test: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders log table with all rows', () => {
    render(
      <LogTable
        logs={mockLogs}
        onResend={mockOnResend}
        onLoadDetail={mockOnLoadDetail}
      />
    );

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('+15551234567')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(
      <LogTable
        logs={mockLogs}
        onResend={mockOnResend}
        onLoadDetail={mockOnLoadDetail}
      />
    );

    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows resend button only for failed notifications', () => {
    render(
      <LogTable
        logs={mockLogs}
        onResend={mockOnResend}
        onLoadDetail={mockOnLoadDetail}
      />
    );

    const resendButtons = screen.getAllByRole('button', { name: /resend/i });
    expect(resendButtons).toHaveLength(1); // Only for failed log
  });

  it('calls onResend when resend button clicked', () => {
    render(
      <LogTable
        logs={mockLogs}
        onResend={mockOnResend}
        onLoadDetail={mockOnLoadDetail}
      />
    );

    const resendButton = screen.getByRole('button', { name: /resend/i });
    fireEvent.click(resendButton);

    expect(mockOnResend).toHaveBeenCalledWith('log-2');
  });

  it('expands row and loads detail on click', async () => {
    const mockDetail: NotificationLogDetail = {
      ...mockLogs[0],
      content: 'Email content here',
      template_data: { name: 'John' },
      clicked_at: null,
      delivered_at: '2024-01-20T10:05:00Z',
      message_id: 'msg-123',
      tracking_id: null,
    };

    mockOnLoadDetail.mockResolvedValue(mockDetail);

    render(
      <LogTable
        logs={mockLogs}
        onResend={mockOnResend}
        onLoadDetail={mockOnLoadDetail}
      />
    );

    // Click first row
    const firstRow = screen.getByText('john@example.com').closest('tr');
    fireEvent.click(firstRow!);

    await waitFor(() => {
      expect(mockOnLoadDetail).toHaveBeenCalledWith('log-1');
    });

    await waitFor(() => {
      expect(screen.getByText('Email content here')).toBeInTheDocument();
    });
  });

  it('displays empty state when no logs', () => {
    render(<LogTable logs={[]} onResend={mockOnResend} onLoadDetail={mockOnLoadDetail} />);

    expect(screen.getByText('No notification logs found')).toBeInTheDocument();
  });
});

describe('ExportButton Component', () => {
  const mockOnExportAll = vi.fn();

  const mockLogs: NotificationLogListItem[] = [
    {
      id: 'log-1',
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export button', () => {
    render(
      <ExportButton
        logs={mockLogs}
        filters={{}}
        totalCount={1}
        onExportAll={mockOnExportAll}
      />
    );

    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('disables button when no logs', () => {
    render(
      <ExportButton logs={[]} filters={{}} totalCount={0} onExportAll={mockOnExportAll} />
    );

    const button = screen.getByRole('button', { name: /export csv/i });
    expect(button).toBeDisabled();
  });

  it('shows total count when there are more logs', () => {
    render(
      <ExportButton
        logs={mockLogs}
        filters={{}}
        totalCount={100}
        onExportAll={mockOnExportAll}
      />
    );

    expect(screen.getByText(/100 logs/i)).toBeInTheDocument();
  });
});

describe('ResendModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnResend = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockLog: NotificationLogListItem = {
    id: 'log-1',
    customer_id: 'cust-1',
    customer_name: 'John Doe',
    type: 'appointment_reminder',
    channel: 'email',
    recipient: 'john@example.com',
    subject: 'Your appointment',
    status: 'failed',
    error_message: 'SMTP connection failed',
    sent_at: null,
    created_at: '2024-01-20T09:00:00Z',
    is_test: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <ResendModal
        log={mockLog}
        isOpen={true}
        onClose={mockOnClose}
        onResend={mockOnResend}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/resend notification/i)).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('SMTP connection failed')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ResendModal
        log={mockLog}
        isOpen={false}
        onClose={mockOnClose}
        onResend={mockOnResend}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText(/resend notification/i)).not.toBeInTheDocument();
  });

  it('calls onResend when resend button clicked', async () => {
    mockOnResend.mockResolvedValue({ success: true, message: 'Resent successfully' });

    render(
      <ResendModal
        log={mockLog}
        isOpen={true}
        onClose={mockOnClose}
        onResend={mockOnResend}
        onSuccess={mockOnSuccess}
      />
    );

    const resendButton = screen.getByRole('button', { name: /resend notification/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(mockOnResend).toHaveBeenCalledWith('log-1');
    });
  });

  it('shows success message after successful resend', async () => {
    mockOnResend.mockResolvedValue({ success: true, message: 'Resent successfully' });

    render(
      <ResendModal
        log={mockLog}
        isOpen={true}
        onClose={mockOnClose}
        onResend={mockOnResend}
        onSuccess={mockOnSuccess}
      />
    );

    const resendButton = screen.getByRole('button', { name: /resend notification/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Resent successfully')).toBeInTheDocument();
    });
  });

  it('shows error message after failed resend', async () => {
    mockOnResend.mockResolvedValue({ success: false, message: 'Failed to resend' });

    render(
      <ResendModal
        log={mockLog}
        isOpen={true}
        onClose={mockOnClose}
        onResend={mockOnResend}
        onSuccess={mockOnSuccess}
      />
    );

    const resendButton = screen.getByRole('button', { name: /resend notification/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to resend')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button clicked', () => {
    render(
      <ResendModal
        log={mockLog}
        isOpen={true}
        onClose={mockOnClose}
        onResend={mockOnResend}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
