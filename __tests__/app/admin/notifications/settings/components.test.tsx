/**
 * Tests for notification settings components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, ToastContainer } from '@/app/admin/notifications/settings/components/Toast';
import { ChannelToggle } from '@/app/admin/notifications/settings/components/ChannelToggle';
import { SettingsStats } from '@/app/admin/notifications/settings/components/SettingsStats';
import { NotificationSettingCard } from '@/app/admin/notifications/settings/components/NotificationSettingCard';
import type { NotificationSettingsRow } from '@/lib/notifications/database-types';

describe('Toast', () => {
  it('should render success toast', () => {
    const onClose = vi.fn();
    render(<Toast message="Success message" type="success" onClose={onClose} duration={0} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    const onClose = vi.fn();
    render(<Toast message="Error message" type="error" onClose={onClose} duration={0} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" type="success" onClose={onClose} duration={0} />);

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ToastContainer', () => {
  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1', type: 'success' as const },
      { id: '2', message: 'Toast 2', type: 'error' as const },
    ];
    const onRemoveToast = vi.fn();

    render(<ToastContainer toasts={toasts} onRemoveToast={onRemoveToast} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });
});

describe('ChannelToggle', () => {
  it('should render email toggle', () => {
    const onToggle = vi.fn();
    render(
      <ChannelToggle
        channel="email"
        enabled={true}
        notificationType="appointment_reminder"
        notificationLabel="Appointment Reminder"
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle Email notifications for Appointment Reminder')).toBeInTheDocument();
  });

  it('should render SMS toggle', () => {
    const onToggle = vi.fn();
    render(
      <ChannelToggle
        channel="sms"
        enabled={false}
        notificationType="appointment_reminder"
        notificationLabel="Appointment Reminder"
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('should show enabled state correctly', () => {
    const onToggle = vi.fn();
    const { unmount } = render(
      <ChannelToggle
        channel="email"
        enabled={true}
        notificationType="appointment_reminder"
        notificationLabel="Appointment Reminder"
        onToggle={onToggle}
      />
    );

    let toggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder') as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    unmount();

    // Render with disabled state
    render(
      <ChannelToggle
        channel="email"
        enabled={false}
        notificationType="appointment_reminder"
        notificationLabel="Appointment Reminder"
        onToggle={onToggle}
      />
    );

    toggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
  });

  it('should be disabled when disabled prop is true', () => {
    const onToggle = vi.fn();
    render(
      <ChannelToggle
        channel="email"
        enabled={true}
        notificationType="appointment_reminder"
        notificationLabel="Appointment Reminder"
        onToggle={onToggle}
        disabled={true}
      />
    );

    const toggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder');
    expect(toggle).toBeDisabled();
  });
});

describe('SettingsStats', () => {
  it('should render statistics', () => {
    const now = new Date();
    const lastSentAt = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

    render(
      <SettingsStats
        lastSentAt={lastSentAt}
        totalSentCount={1500}
        totalFailedCount={25}
      />
    );

    expect(screen.getByText('Last sent:')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('Total sent (30d):')).toBeInTheDocument();
    expect(screen.getByText('1,500 messages')).toBeInTheDocument();
    expect(screen.getByText('Failure rate:')).toBeInTheDocument();
    expect(screen.getByText('1.7%')).toBeInTheDocument();
  });

  it('should show "Never" when last_sent_at is null', () => {
    render(
      <SettingsStats
        lastSentAt={null}
        totalSentCount={0}
        totalFailedCount={0}
      />
    );

    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should show "N/A" for failure rate when no messages sent', () => {
    render(
      <SettingsStats
        lastSentAt={null}
        totalSentCount={0}
        totalFailedCount={0}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should color-code failure rates', () => {
    const { rerender } = render(
      <SettingsStats
        lastSentAt={null}
        totalSentCount={100}
        totalFailedCount={3}
      />
    );

    // Good rate (<5%) - green
    let failureRateElement = screen.getByText('3.0%');
    expect(failureRateElement).toHaveClass('text-green-600');

    // Warning rate (5-10%) - amber
    rerender(
      <SettingsStats
        lastSentAt={null}
        totalSentCount={100}
        totalFailedCount={7}
      />
    );
    failureRateElement = screen.getByText('7.0%');
    expect(failureRateElement).toHaveClass('text-amber-600');

    // Critical rate (>10%) - red
    rerender(
      <SettingsStats
        lastSentAt={null}
        totalSentCount={100}
        totalFailedCount={15}
      />
    );
    failureRateElement = screen.getByText('15.0%');
    expect(failureRateElement).toHaveClass('text-red-600');
  });
});

describe('NotificationSettingCard', () => {
  const mockSetting: NotificationSettingsRow = {
    notification_type: 'appointment_reminder',
    email_enabled: true,
    sms_enabled: false,
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
  };

  it('should render notification setting card', () => {
    const onUpdateSetting = vi.fn();
    render(
      <NotificationSettingCard
        setting={mockSetting}
        onUpdateSetting={onUpdateSetting}
      />
    );

    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    expect(screen.getByText('appointment_reminder')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('should show automated schedule', () => {
    const onUpdateSetting = vi.fn();
    render(
      <NotificationSettingCard
        setting={mockSetting}
        onUpdateSetting={onUpdateSetting}
      />
    );

    expect(screen.getByText('Automated')).toBeInTheDocument();
    expect(screen.getByText('Daily at 9:00 AM')).toBeInTheDocument();
  });

  it('should show manual schedule when schedule_enabled is false', () => {
    const onUpdateSetting = vi.fn();
    const manualSetting = { ...mockSetting, schedule_enabled: false, schedule_cron: null };
    render(
      <NotificationSettingCard
        setting={manualSetting}
        onUpdateSetting={onUpdateSetting}
      />
    );

    // Use getAllByText since "Manual" appears twice (title and description)
    const manualTexts = screen.getAllByText('Manual');
    expect(manualTexts.length).toBeGreaterThan(0);
  });

  it('should display statistics section', () => {
    const onUpdateSetting = vi.fn();
    render(
      <NotificationSettingCard
        setting={mockSetting}
        onUpdateSetting={onUpdateSetting}
      />
    );

    expect(screen.getByText('Last sent:')).toBeInTheDocument();
    expect(screen.getByText('Total sent (30d):')).toBeInTheDocument();
    expect(screen.getByText('Failure rate:')).toBeInTheDocument();
  });

  it('should render toggles in correct state', () => {
    const onUpdateSetting = vi.fn();
    render(
      <NotificationSettingCard
        setting={mockSetting}
        onUpdateSetting={onUpdateSetting}
      />
    );

    const emailToggle = screen.getByLabelText('Toggle Email notifications for Appointment Reminder') as HTMLInputElement;
    const smsToggle = screen.getByLabelText('Toggle SMS notifications for Appointment Reminder') as HTMLInputElement;

    expect(emailToggle.checked).toBe(true);
    expect(smsToggle.checked).toBe(false);
  });
});
