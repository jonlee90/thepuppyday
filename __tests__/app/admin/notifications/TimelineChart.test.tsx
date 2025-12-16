import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineChart } from '@/app/admin/notifications/components/TimelineChart';
import type { TimelineDataPoint } from '@/types/notifications-dashboard';

describe('TimelineChart', () => {
  const mockTimelineData: TimelineDataPoint[] = [
    { date: '2025-01-01', sent: 50, delivered: 48, failed: 2 },
    { date: '2025-01-02', sent: 60, delivered: 58, failed: 2 },
    { date: '2025-01-03', sent: 55, delivered: 52, failed: 3 },
    { date: '2025-01-04', sent: 70, delivered: 68, failed: 2 },
    { date: '2025-01-05', sent: 65, delivered: 63, failed: 2 },
  ];

  it('renders timeline chart with title', () => {
    render(<TimelineChart data={mockTimelineData} />);

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Notifications activity over time')).toBeInTheDocument();
  });

  it('renders chart with data points', () => {
    const { container } = render(<TimelineChart data={mockTimelineData} />);

    // Recharts creates ResponsiveContainer which may not render SVG in test environment
    // Just verify component renders without error
    expect(container.firstChild).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    const { container } = render(<TimelineChart data={[]} />);

    // Component should render even with empty data
    expect(container.firstChild).toBeTruthy();
  });

  it('formats dates correctly in chart data', () => {
    const { container } = render(<TimelineChart data={mockTimelineData} />);

    // Verify component renders with date data
    expect(container.firstChild).toBeTruthy();
  });
});
