/**
 * Tests for notification settings page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NotificationSettingsPage from '@/app/admin/notifications/settings/page';
import type { NotificationSettingsRow } from '@/lib/notifications/database-types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSettings: NotificationSettingsRow[] = [
  {
    notification_type: 'appointment_reminder',
    email_enabled: true,
    sms_enabled: true,
    email_template_id: null,
    sms_template_id: null,
    schedule_enabled: true,
    schedule_cron: '0 9 * * *',
    max_retries: 3,
    retry_delays_seconds: [60, 300],
    last_sent_at: new Date().toISOString(),
    total_sent_count: 1500,
    total_failed_count: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    notification_type: 'report_card_sent',
    email_enabled: true,
    sms_enabled: false,
    email_template_id: null,
    sms_template_id: null,
    schedule_enabled: false,
    schedule_cron: null,
    max_retries: 2,
    retry_delays_seconds: [30, 300],
    last_sent_at: null,
    total_sent_count: 0,
    total_failed_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render page header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    render(<NotificationSettingsPage />);

    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Configure notification channels and delivery settings for each notification type')
    ).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<NotificationSettingsPage />);

    expect(screen.getByLabelText('Loading settings')).toBeInTheDocument();
  });

  it('should fetch and display settings on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
      expect(screen.getByText('Report Card')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/notifications/settings');
  });

  it('should show error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
      // Use getAllByText since the error message appears both in the page and toast
      const errorMessages = screen.getAllByText('Failed to fetch notification settings');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('should show try again button on error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Click try again
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    });
  });

  it('should show empty state when no settings', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: [] }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('No notification settings found')).toBeInTheDocument();
    });
  });

  it('should update setting when toggle clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    });

    // Mock the update API call
    const updatedSetting = { ...mockSettings[0], email_enabled: false };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: updatedSetting }),
    });

    // Click email toggle
    const emailToggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder');
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/notifications/settings/appointment_reminder',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email_enabled: false }),
        })
      );
    });
  });

  it('should show success toast on successful update', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    });

    // Mock the update API call
    const updatedSetting = { ...mockSettings[0], email_enabled: false };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: updatedSetting }),
    });

    // Click email toggle
    const emailToggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder');
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(screen.getByText('Email notifications disabled for Appointment Reminder')).toBeInTheDocument();
    });
  });

  it('should show error toast on failed update', async () => {
    // Suppress console errors for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    });

    // Mock the update API call to fail
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Update failed' }),
    });

    // Click email toggle
    const emailToggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder');
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should render settings in grid layout', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    const { container } = render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    });

    // Check for grid layout class
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
  });

  it('should close toast when close button clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    });

    // Mock the update API call
    const updatedSetting = { ...mockSettings[0], email_enabled: false };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: updatedSetting }),
    });

    // Click email toggle to show toast
    const emailToggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder');
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(screen.getByText('Email notifications disabled for Appointment Reminder')).toBeInTheDocument();
    });

    // Close the toast
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Email notifications disabled for Appointment Reminder')).not.toBeInTheDocument();
    });
  });
});
