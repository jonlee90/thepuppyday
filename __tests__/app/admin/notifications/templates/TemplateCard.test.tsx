import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from '@/app/admin/notifications/templates/components/TemplateCard';
import { NotificationTemplate } from '@/types/template';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('TemplateCard', () => {
  const mockTemplate: NotificationTemplate = {
    id: 'test-123',
    name: 'Appointment Reminder',
    description: 'Send reminder 24h before appointment',
    trigger_event: 'appointment.reminder.24h',
    channel: 'email',
    subject: 'Your appointment tomorrow',
    html_template: '<p>Test</p>',
    text_template: 'Test',
    variables: [],
    is_active: true,
    version: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
  };

  const mockOnTest = vi.fn();
  const mockOnToggleActive = vi.fn();

  it('renders template information correctly', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    expect(screen.getByText('appointment.reminder.24h')).toBeInTheDocument();
    expect(screen.getByText('Send reminder 24h before appointment')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
  });

  it('displays active status badge', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays inactive status badge for inactive templates', () => {
    const inactiveTemplate = { ...mockTemplate, is_active: false };

    render(
      <TemplateCard
        template={inactiveTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays correct channel badge', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    expect(screen.getByText('EMAIL')).toBeInTheDocument();
  });

  it('calls onTest when test button is clicked', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    expect(mockOnTest).toHaveBeenCalledWith('test-123');
  });

  it('calls onToggleActive when power button is clicked', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    const powerButton = screen.getByRole('button', { name: /deactivate/i });
    fireEvent.click(powerButton);

    expect(mockOnToggleActive).toHaveBeenCalledWith('test-123', true);
  });

  it('formats date correctly', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        onTest={mockOnTest}
        onToggleActive={mockOnToggleActive}
      />
    );

    // Check that date is formatted (exact format may vary by locale)
    expect(screen.getByText(/Jan 20, 2024/i)).toBeInTheDocument();
  });
});
