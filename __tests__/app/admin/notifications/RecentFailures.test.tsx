import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentFailures } from '@/app/admin/notifications/components/RecentFailures';
import type { RecentFailure, FailureReason } from '@/types/notifications-dashboard';

describe('RecentFailures', () => {
  const mockFailures: RecentFailure[] = [
    {
      id: '1',
      type: 'appointment_reminder',
      channel: 'email',
      recipient: 'test@example.com',
      error_message: 'Invalid email address',
      created_at: '2025-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'appointment_confirmation',
      channel: 'sms',
      recipient: '+15555551234',
      error_message: 'Phone number not in service',
      created_at: '2025-01-15T11:00:00Z',
    },
  ];

  const mockFailureReasons: FailureReason[] = [
    { reason: 'Invalid email', count: 30, percentage: 37.5 },
    { reason: 'Phone not in service', count: 25, percentage: 31.25 },
    { reason: 'Network timeout', count: 20, percentage: 25.0 },
  ];

  it('renders recent failures title', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    expect(screen.getByText('Recent Failures')).toBeInTheDocument();
    expect(screen.getByText('Last 10 failed notifications')).toBeInTheDocument();
  });

  it('displays all failure items', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+15555551234')).toBeInTheDocument();
  });

  it('shows error messages', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByText('Phone number not in service')).toBeInTheDocument();
  });

  it('displays channel badges', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    expect(screen.getByText('EMAIL')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('shows empty state when no failures', () => {
    render(<RecentFailures failures={[]} failureReasons={[]} />);

    expect(screen.getByText('No recent failures')).toBeInTheDocument();
    expect(screen.getByText('All notifications are being delivered successfully')).toBeInTheDocument();
  });

  it('toggles error groups visibility', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    const toggleButton = screen.getByText('Show Error Groups');
    expect(toggleButton).toBeInTheDocument();

    // Error groups should not be visible initially
    expect(screen.queryByText('Error Types Summary')).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(toggleButton);
    expect(screen.getByText('Error Types Summary')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();

    // Click to hide
    fireEvent.click(screen.getByText('Hide Error Groups'));
    expect(screen.queryByText('Error Types Summary')).not.toBeInTheDocument();
  });

  it('displays failure reasons with counts and percentages', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    // Show the error groups
    fireEvent.click(screen.getByText('Show Error Groups'));

    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('(38%)')).toBeInTheDocument();

    expect(screen.getByText('Phone not in service')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('(31%)')).toBeInTheDocument();

    expect(screen.getByText('Network timeout')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('(25%)')).toBeInTheDocument();
  });

  it('truncates long error messages', () => {
    const longErrorMessage = 'A'.repeat(100);
    const failuresWithLongMessage: RecentFailure[] = [
      {
        id: '1',
        type: 'test',
        channel: 'email',
        recipient: 'test@example.com',
        error_message: longErrorMessage,
        created_at: '2025-01-15T10:30:00Z',
      },
    ];

    render(<RecentFailures failures={failuresWithLongMessage} failureReasons={[]} />);

    // Should truncate to 80 chars + "..."
    const truncatedText = screen.getByText(/A{80}\.\.\./);
    expect(truncatedText).toBeInTheDocument();
  });

  it('renders action buttons for each failure', () => {
    const { container } = render(
      <RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />
    );

    // Each failure should have 2 action buttons (view log and retry)
    const buttons = container.querySelectorAll('button[title]');
    const actionButtons = Array.from(buttons).filter(
      (btn) => btn.getAttribute('title') === 'View full log' || btn.getAttribute('title') === 'Retry notification'
    );

    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('formats timestamps correctly', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    // Check for formatted date (format: MMM dd, yyyy - hh:mm a) - there are 2 failures so 2 dates
    const timestamps = screen.getAllByText(/Jan 15, 2025/);
    expect(timestamps.length).toBe(2);
  });

  it('shows link to view all logs', () => {
    render(<RecentFailures failures={mockFailures} failureReasons={mockFailureReasons} />);

    const link = screen.getByText('View All Notification Logs');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/admin/notifications/logs');
  });
});
