import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChannelBreakdown } from '@/app/admin/notifications/components/ChannelBreakdown';
import type { NotificationsByChannel } from '@/types/notifications-dashboard';

describe('ChannelBreakdown', () => {
  const mockChannelData: NotificationsByChannel = {
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
  };

  it('renders channel breakdown title', () => {
    render(<ChannelBreakdown data={mockChannelData} />);

    expect(screen.getByText('Channel Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Performance by delivery channel')).toBeInTheDocument();
  });

  it('displays both email and SMS channels', () => {
    render(<ChannelBreakdown data={mockChannelData} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('shows delivery rates for both channels', () => {
    render(<ChannelBreakdown data={mockChannelData} />);

    // Email delivery rate
    expect(screen.getByText('95.0%')).toBeInTheDocument();
    // SMS delivery rate
    expect(screen.getByText('94.0%')).toBeInTheDocument();
  });

  it('displays sent, delivered, and failed counts', () => {
    render(<ChannelBreakdown data={mockChannelData} />);

    expect(screen.getByText('1,000')).toBeInTheDocument(); // Email sent
    expect(screen.getByText('950')).toBeInTheDocument(); // Email delivered
    expect(screen.getByText('50')).toBeInTheDocument(); // Email failed
    expect(screen.getByText('500')).toBeInTheDocument(); // SMS sent
    expect(screen.getByText('470')).toBeInTheDocument(); // SMS delivered
    expect(screen.getByText('30')).toBeInTheDocument(); // SMS failed
  });

  it('shows warning for low delivery rate', () => {
    const lowDeliveryData: NotificationsByChannel = {
      email: {
        sent: 1000,
        delivered: 850,
        failed: 150,
        delivery_rate: 85.0,
      },
      sms: {
        sent: 500,
        delivered: 470,
        failed: 30,
        delivery_rate: 94.0,
      },
    };

    render(<ChannelBreakdown data={lowDeliveryData} />);

    expect(screen.getByText(/investigate failures/)).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const zeroData: NotificationsByChannel = {
      email: {
        sent: 0,
        delivered: 0,
        failed: 0,
        delivery_rate: 0,
      },
      sms: {
        sent: 0,
        delivered: 0,
        failed: 0,
        delivery_rate: 0,
      },
    };

    render(<ChannelBreakdown data={zeroData} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });
});
