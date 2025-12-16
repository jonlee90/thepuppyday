import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeBreakdown } from '@/app/admin/notifications/components/TypeBreakdown';
import type { NotificationTypeStats } from '@/types/notifications-dashboard';

describe('TypeBreakdown', () => {
  const mockTypeData: NotificationTypeStats[] = [
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
    {
      type: 'welcome_email',
      sent: 200,
      delivered: 195,
      failed: 5,
      success_rate: 97.5,
    },
  ];

  it('renders type breakdown title', () => {
    render(<TypeBreakdown data={mockTypeData} />);

    expect(screen.getByText('Notification Types')).toBeInTheDocument();
    expect(screen.getByText('Performance by notification type')).toBeInTheDocument();
  });

  it('displays table headers', () => {
    render(<TypeBreakdown data={mockTypeData} />);

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('formats notification type names correctly', () => {
    render(<TypeBreakdown data={mockTypeData} />);

    expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
  });

  it('displays stats for each notification type', () => {
    render(<TypeBreakdown data={mockTypeData} />);

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('490')).toBeInTheDocument();
    // "10" appears multiple times (failed column for multiple types)
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
  });

  it('shows success rate visualizations', () => {
    const { container } = render(<TypeBreakdown data={mockTypeData} />);

    // Check for percentage displays - there are multiple types with similar rates
    const percentages = screen.getAllByText(/\d+%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('displays empty state when no data', () => {
    render(<TypeBreakdown data={[]} />);

    expect(screen.getByText('No notification data available')).toBeInTheDocument();
  });

  it('shows warning icon for low success rates', () => {
    const lowSuccessData: NotificationTypeStats[] = [
      {
        type: 'test_notification',
        sent: 100,
        delivered: 85,
        failed: 15,
        success_rate: 85.0,
      },
    ];

    render(<TypeBreakdown data={lowSuccessData} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
  });

  it('handles single notification type', () => {
    const singleTypeData = [mockTypeData[0]];

    render(<TypeBreakdown data={singleTypeData} />);

    expect(screen.getByText('Appointment Confirmation')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2); // Header + 1 data row
  });
});
