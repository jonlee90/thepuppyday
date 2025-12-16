import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NotificationsDashboardPage from '@/app/admin/notifications/dashboard/page';
import type { NotificationsDashboardData } from '@/types/notifications-dashboard';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDashboardData: NotificationsDashboardData = {
  period: {
    start: '2025-01-01',
    end: '2025-01-31',
    label: '30 days',
  },
  summary: {
    total_sent: 1500,
    total_delivered: 1420,
    total_failed: 80,
    delivery_rate: 94.67,
    click_rate: 12.5,
    sms_cost_cents: 15000,
    trends: {
      sent_change_percent: 15.2,
      delivery_rate_change_percent: -2.1,
    },
  },
  by_channel: {
    email: {
      sent: 1000,
      delivered: 950,
      failed: 50,
      delivery_rate: 95.0,
    },
    sms: {
      sent: 500,
      delivered: 470,
      failed: 30,
      delivery_rate: 94.0,
    },
  },
  by_type: [
    {
      type: 'appointment_confirmation',
      sent: 500,
      delivered: 490,
      failed: 10,
      success_rate: 98.0,
    },
    {
      type: 'appointment_reminder',
      sent: 450,
      delivered: 440,
      failed: 10,
      success_rate: 97.8,
    },
  ],
  timeline: [
    { date: '2025-01-01', sent: 50, delivered: 48, failed: 2 },
    { date: '2025-01-02', sent: 60, delivered: 58, failed: 2 },
    { date: '2025-01-03', sent: 55, delivered: 52, failed: 3 },
  ],
  recent_failures: [
    {
      id: '1',
      type: 'appointment_reminder',
      channel: 'email',
      recipient: 'test@example.com',
      error_message: 'Invalid email address',
      created_at: '2025-01-15T10:30:00Z',
    },
  ],
  failure_reasons: [
    { reason: 'Invalid email', count: 30, percentage: 37.5 },
    { reason: 'Network timeout', count: 20, percentage: 25.0 },
  ],
};

describe('NotificationsDashboardPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title and description', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData,
    });

    render(<NotificationsDashboardPage />);

    expect(screen.getByText('Notifications Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitor notification delivery and performance')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => mockDashboardData }), 1000);
        })
    );

    render(<NotificationsDashboardPage />);

    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('fetches and displays dashboard data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData,
    });

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('1,500')).toBeInTheDocument(); // Total sent
      expect(screen.getByText('94.7%')).toBeInTheDocument(); // Delivery rate
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/notifications/dashboard?period=30d');
  });

  it('displays error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to fetch dashboard data: Internal Server Error')
      ).toBeInTheDocument();
    });
  });

  it('allows period selection', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData,
    });

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    // Click on 7 days button
    const sevenDaysButton = screen.getByText('7 days');
    fireEvent.click(sevenDaysButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/notifications/dashboard?period=7d');
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData,
    });

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    // Initial call
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Find and click refresh button
    const refreshButton = screen.getByTitle('Refresh data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('renders all dashboard sections', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData,
    });

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      // Overview cards section
      expect(screen.getByText('Total Sent')).toBeInTheDocument();

      // Timeline section
      expect(screen.getByText('Timeline')).toBeInTheDocument();

      // Channel breakdown
      expect(screen.getByText('Channel Breakdown')).toBeInTheDocument();

      // Type breakdown
      expect(screen.getByText('Notification Types')).toBeInTheDocument();

      // Recent failures
      expect(screen.getByText('Recent Failures')).toBeInTheDocument();
    });
  });

  it('retries fetch when try again button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    });

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    });

    // Mock successful response for retry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData,
    });

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays period labels correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData,
    });

    render(<NotificationsDashboardPage />);

    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('90 days')).toBeInTheDocument();
  });
});
