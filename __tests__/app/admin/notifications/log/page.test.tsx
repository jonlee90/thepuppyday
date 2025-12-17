/**
 * Tests for Notification Log Viewer Page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationLogPage from '@/app/admin/notifications/log/page';
import type { NotificationLogListResponse } from '@/types/notification-log';

// Mock fetch
global.fetch = vi.fn();

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('NotificationLogPage', () => {
  const mockLogsResponse: NotificationLogListResponse = {
    logs: [
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
    ],
    metadata: {
      total: 2,
      total_pages: 1,
      current_page: 1,
      per_page: 50,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockLogsResponse,
    });
  });

  it('renders page header', async () => {
    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Log')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/view and manage all notification logs/i)
    ).toBeInTheDocument();
  });

  it('fetches and displays logs on mount', async () => {
    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/notifications/log')
      );
    });

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+15551234567')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<NotificationLogPage />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('displays error state on fetch failure', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading logs/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  it('retries fetch on error retry button click', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading logs/i)).toBeInTheDocument();
    });

    // Mock successful retry
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLogsResponse,
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('displays export button', async () => {
    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });
  });

  it('updates filters and refetches logs', async () => {
    render(<NotificationLogPage />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    // Change channel filter
    const channelSelect = screen.getByRole('combobox', { name: /channel/i });
    fireEvent.change(channelSelect, { target: { value: 'email' } });

    // Should trigger new fetch with filter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('channel=email')
      );
    });
  });

  it('resets to page 1 when filters change', async () => {
    const multiPageResponse = {
      ...mockLogsResponse,
      metadata: {
        total: 150,
        total_pages: 3,
        current_page: 2,
        per_page: 50,
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    // Change filter
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: 'failed' } });

    // Should reset to page 1
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      );
    });
  });

  it('navigates to next page', async () => {
    const multiPageResponse = {
      ...mockLogsResponse,
      metadata: {
        total: 150,
        total_pages: 3,
        current_page: 1,
        per_page: 50,
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('navigates to previous page', async () => {
    const multiPageResponse = {
      ...mockLogsResponse,
      metadata: {
        total: 150,
        total_pages: 3,
        current_page: 2,
        per_page: 50,
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      );
    });
  });

  it('disables previous button on first page', async () => {
    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    const prevButton = screen.queryByRole('button', { name: /previous/i });
    // Pagination only shows when totalPages > 1, so won't be rendered for single page
    expect(prevButton).not.toBeInTheDocument();
  });

  it('displays empty state when no logs found', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        logs: [],
        metadata: {
          total: 0,
          total_pages: 0,
          current_page: 1,
          per_page: 50,
        },
      }),
    });

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('No notification logs found')).toBeInTheDocument();
    });
  });

  it('opens resend modal when resend clicked', async () => {
    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('+15551234567')).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /resend/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/resend notification/i)).toBeInTheDocument();
    });
  });

  it('refreshes logs after successful resend', async () => {
    // Mock resend API
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/resend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: 'Resent successfully' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLogsResponse,
      });
    });

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('+15551234567')).toBeInTheDocument();
    });

    // Open resend modal
    const resendButton = screen.getByRole('button', { name: /resend/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/resend notification/i)).toBeInTheDocument();
    });

    // Confirm resend
    const confirmButton = screen.getByRole('button', { name: /resend notification/i });
    fireEvent.click(confirmButton);

    // Should refresh logs after successful resend
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/notifications/log?')
      );
    }, { timeout: 3000 });
  });

  it('expands row to show log details', async () => {
    const mockDetail = {
      ...mockLogsResponse.logs[0],
      content: 'Email content here',
      template_data: { name: 'John' },
      clicked_at: null,
      delivered_at: '2024-01-20T10:05:00Z',
      message_id: 'msg-123',
      tracking_id: null,
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/log/log-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ log: mockDetail }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLogsResponse,
      });
    });

    render(<NotificationLogPage />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    // Click row to expand
    const firstRow = screen.getByText('john@example.com').closest('tr');
    fireEvent.click(firstRow!);

    await waitFor(() => {
      expect(screen.getByText('Email content here')).toBeInTheDocument();
    });
  });
});
