import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LivePreview } from '@/app/admin/notifications/templates/[id]/edit/components/LivePreview';
import { TemplateVariable } from '@/types/template';

describe('LivePreview', () => {
  const mockVariables: TemplateVariable[] = [
    {
      name: 'customer_name',
      description: 'Customer first name',
      required: true,
      example_value: 'John',
    },
    {
      name: 'appointment_time',
      description: 'Appointment time',
      required: true,
      example_value: '10:00 AM',
    },
  ];

  it('renders email preview correctly', () => {
    render(
      <LivePreview
        channel="email"
        subject="Appointment for {{customer_name}}"
        htmlContent="<p>Hello {{customer_name}}</p>"
        textContent="Hello {{customer_name}}"
        variables={mockVariables}
      />
    );

    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('renders SMS preview correctly', () => {
    render(
      <LivePreview
        channel="sms"
        smsContent="Hi {{customer_name}}, your appointment is at {{appointment_time}}"
        variables={mockVariables}
      />
    );

    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.getByText('SMS Message')).toBeInTheDocument();
  });

  it('replaces variables with sample data in email subject', () => {
    render(
      <LivePreview
        channel="email"
        subject="Appointment for {{customer_name}}"
        htmlContent=""
        variables={mockVariables}
      />
    );

    expect(screen.getByText('Appointment for John')).toBeInTheDocument();
  });

  it('replaces variables with sample data in SMS content', () => {
    render(
      <LivePreview
        channel="sms"
        smsContent="Hi {{customer_name}}, your appointment is at {{appointment_time}}"
        variables={mockVariables}
      />
    );

    expect(
      screen.getByText('Hi John, your appointment is at 10:00 AM')
    ).toBeInTheDocument();
  });

  it('toggles between preview and sample data editor', () => {
    render(
      <LivePreview
        channel="sms"
        smsContent="Hi {{customer_name}}"
        variables={mockVariables}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit sample data/i });
    fireEvent.click(editButton);

    expect(screen.getByText(/Edit sample values to preview/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();

    const viewButton = screen.getByRole('button', { name: /view preview/i });
    fireEvent.click(viewButton);

    expect(screen.getByText('SMS Message')).toBeInTheDocument();
  });

  it('allows editing sample data values', () => {
    render(
      <LivePreview
        channel="sms"
        smsContent="Hi {{customer_name}}"
        variables={mockVariables}
      />
    );

    // Open sample data editor
    const editButton = screen.getByRole('button', { name: /edit sample data/i });
    fireEvent.click(editButton);

    // Edit customer_name
    const input = screen.getByDisplayValue('John');
    fireEvent.change(input, { target: { value: 'Jane' } });

    // Switch back to preview
    const viewButton = screen.getByRole('button', { name: /view preview/i });
    fireEvent.click(viewButton);

    // Check updated value
    expect(screen.getByText('Hi Jane')).toBeInTheDocument();
  });

  it('shows required indicator for required variables in editor', () => {
    render(
      <LivePreview
        channel="sms"
        smsContent="Test"
        variables={mockVariables}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit sample data/i });
    fireEvent.click(editButton);

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  it('renders email HTML in iframe', () => {
    const { container } = render(
      <LivePreview
        channel="email"
        htmlContent="<p>Hello {{customer_name}}</p>"
        variables={mockVariables}
      />
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute('sandbox')).toBe('allow-same-origin');
  });

  it('shows plain text version for email', () => {
    render(
      <LivePreview
        channel="email"
        textContent="Hello {{customer_name}}"
        variables={mockVariables}
      />
    );

    expect(screen.getByText('Plain Text Version')).toBeInTheDocument();
    expect(screen.getByText('Hello John')).toBeInTheDocument();
  });

  it('shows phone mockup for SMS preview', () => {
    render(
      <LivePreview
        channel="sms"
        smsContent="Test message"
        variables={[]}
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(
      screen.getByText(/Preview shows how message will appear on customer's device/i)
    ).toBeInTheDocument();
  });

  it('handles missing variable values gracefully', () => {
    const variablesWithoutExamples: TemplateVariable[] = [
      {
        name: 'test_var',
        description: 'Test variable',
        required: false,
      },
    ];

    render(
      <LivePreview
        channel="sms"
        smsContent="Value: {{test_var}}"
        variables={variablesWithoutExamples}
      />
    );

    // Should show placeholder when no example value
    expect(screen.getByText('Value: [test_var]')).toBeInTheDocument();
  });
});
