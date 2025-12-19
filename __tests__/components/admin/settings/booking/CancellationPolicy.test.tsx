/**
 * Tests for CancellationPolicy component
 * Task 0182: Cancellation policy settings
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CancellationPolicy } from '@/components/admin/settings/booking/CancellationPolicy';

// Mock fetch
global.fetch = jest.fn();

describe('CancellationPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<CancellationPolicy />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('fetches and displays current settings', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Cancellation Policy')).toBeInTheDocument();
    });

    // Should show 24 hours policy
    expect(screen.getByText(/must be made at least 1 day before/i)).toBeInTheDocument();
  });

  it('shows flexible policy warning when cutoff is 0', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 0,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText(/Flexible policy/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/may increase no-shows/i)).toBeInTheDocument();
  });

  it('updates policy when preset button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Cancellation Policy')).toBeInTheDocument();
    });

    // Click "2 days" preset button
    const twoDaysButton = screen.getByRole('button', { name: /2 days/i });
    fireEvent.click(twoDaysButton);

    // Should update the policy text
    await waitFor(() => {
      expect(screen.getByText(/must be made at least 2 days before/i)).toBeInTheDocument();
    });

    // Should show unsaved changes indicator
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
  });

  it('saves updated settings when save button is clicked', async () => {
    // Mock GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Cancellation Policy')).toBeInTheDocument();
    });

    // Change to 48 hours
    const twoDaysButton = screen.getByRole('button', { name: /2 days/i });
    fireEvent.click(twoDaysButton);

    // Mock GET for current settings (before save)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    // Mock PUT request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 48,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
        message: 'Booking settings updated successfully',
      }),
    });

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
    });

    // Verify PUT was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/settings/booking',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"cancellation_cutoff_hours":48'),
      })
    );
  });

  it('displays timeline for non-zero cutoff', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Timeline:')).toBeInTheDocument();
    });

    expect(screen.getByText('24h cutoff')).toBeInTheDocument();
    expect(screen.getByText('✅ Can cancel')).toBeInTheDocument();
    expect(screen.getByText('❌ Cannot cancel')).toBeInTheDocument();
  });

  it('shows information badges', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText(/appears in booking confirmations/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/applies to new bookings only/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load settings/i)).toBeInTheDocument();
    });
  });

  it('disables save button when no changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [0],
        },
      }),
    });

    render(<CancellationPolicy />);

    await waitFor(() => {
      expect(screen.getByText('Cancellation Policy')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });
});
