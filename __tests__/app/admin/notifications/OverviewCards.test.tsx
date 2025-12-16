import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewCards } from '@/app/admin/notifications/components/OverviewCards';
import type { NotificationsSummary } from '@/types/notifications-dashboard';

describe('OverviewCards', () => {
  const mockSummary: NotificationsSummary = {
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
  };

  it('renders all four overview cards', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="30 days" />);

    expect(screen.getByText('Total Sent')).toBeInTheDocument();
    expect(screen.getByText('Delivery Rate')).toBeInTheDocument();
    expect(screen.getByText('Failed Notifications')).toBeInTheDocument();
    expect(screen.getByText(/SMS Cost/)).toBeInTheDocument();
  });

  it('displays total sent with trend indicator', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="30 days" />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('15.2%')).toBeInTheDocument();
  });

  it('displays delivery rate with percentage', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="30 days" />);

    expect(screen.getByText('94.7%')).toBeInTheDocument();
  });

  it('shows warning when delivery rate is low', () => {
    const lowDeliveryRateSummary = {
      ...mockSummary,
      delivery_rate: 85.5,
    };

    render(<OverviewCards summary={lowDeliveryRateSummary} periodLabel="30 days" />);

    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText(/Below 90% threshold/)).toBeInTheDocument();
  });

  it('displays failed count', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="30 days" />);

    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('1,420 delivered')).toBeInTheDocument();
  });

  it('displays SMS cost in dollars', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="30 days" />);

    expect(screen.getByText('150.00')).toBeInTheDocument();
  });

  it('shows negative trend indicator correctly', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="30 days" />);

    expect(screen.getByText('2.1%')).toBeInTheDocument(); // Delivery rate change
  });

  it('handles zero values', () => {
    const zeroSummary: NotificationsSummary = {
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      delivery_rate: 0,
      click_rate: 0,
      sms_cost_cents: 0,
      trends: {
        sent_change_percent: 0,
        delivery_rate_change_percent: 0,
      },
    };

    render(<OverviewCards summary={zeroSummary} periodLabel="7 days" />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('displays period label in cards', () => {
    render(<OverviewCards summary={mockSummary} periodLabel="90 days" />);

    expect(screen.getAllByText(/90 days/).length).toBeGreaterThan(0);
  });
});
