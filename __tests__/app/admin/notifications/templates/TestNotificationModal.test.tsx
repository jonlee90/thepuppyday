import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestNotificationModal } from '@/app/admin/notifications/templates/[id]/edit/components/TestNotificationModal';
import { TemplateVariable } from '@/types/template';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TestNotificationModal', () => {
  const mockVariables: TemplateVariable[] = [
    {
      name: 'customer_name',
      description: 'Customer first name',
      required: true,
      example_value: 'John',
    },
  ];

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('does not render when closed', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Send Test Notification')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Send Test Notification')).toBeInTheDocument();
  });

  it('shows email input for email channel', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Recipient Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
  });

  it('shows phone input for SMS channel', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="sms"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Recipient Phone Number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+1 \(555\) 123-4567/i)).toBeInTheDocument();
  });

  it('displays sample data editor with variables', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Sample Data')).toBeInTheDocument();
    expect(screen.getByText('customer_name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('shows message when no variables', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={[]}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No variables in this template')).toBeInTheDocument();
  });

  it('sends test notification successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message_id: 'msg-123',
      }),
    });

    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill in recipient
    const recipientInput = screen.getByPlaceholderText(/example@email.com/i);
    fireEvent.change(recipientInput, { target: { value: 'test@example.com' } });

    // Send test
    const sendButton = screen.getByRole('button', { name: /send test/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/notifications/templates/test-123/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            recipient: 'test@example.com',
            sample_data: { customer_name: 'John' },
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test sent successfully!')).toBeInTheDocument();
      expect(screen.getByText(/msg-123/i)).toBeInTheDocument();
    });
  });

  it('shows error when recipient is missing', async () => {
    const alertSpy = vi.spyOn(global, 'alert').mockImplementation(() => {});

    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const sendButton = screen.getByRole('button', { name: /send test/i });
    fireEvent.click(sendButton);

    expect(alertSpy).toHaveBeenCalledWith('Please enter a email address');
    alertSpy.mockRestore();
  });

  it('handles send error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Invalid recipient',
      }),
    });

    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const recipientInput = screen.getByPlaceholderText(/example@email.com/i);
    fireEvent.change(recipientInput, { target: { value: 'test@example.com' } });

    const sendButton = screen.getByRole('button', { name: /send test/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send test')).toBeInTheDocument();
      expect(screen.getByText('Invalid recipient')).toBeInTheDocument();
    });
  });

  it('allows resetting form', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill in data
    const recipientInput = screen.getByPlaceholderText(/example@email.com/i);
    fireEvent.change(recipientInput, { target: { value: 'test@example.com' } });

    const sampleDataInput = screen.getByDisplayValue('John');
    fireEvent.change(sampleDataInput, { target: { value: 'Jane' } });

    // Reset
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    // Check values reset
    expect(recipientInput).toHaveValue('');
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables send button while loading', async () => {
    (global.fetch as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(
      <TestNotificationModal
        templateId="test-123"
        channel="email"
        variables={mockVariables}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const recipientInput = screen.getByPlaceholderText(/example@email.com/i);
    fireEvent.change(recipientInput, { target: { value: 'test@example.com' } });

    const sendButton = screen.getByRole('button', { name: /send test/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Sending.../i)).toBeInTheDocument();
    });
  });
});
