import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariableInserter } from '@/app/admin/notifications/templates/components/VariableInserter';
import { TemplateVariable } from '@/types/template';

describe('VariableInserter', () => {
  const mockVariables: TemplateVariable[] = [
    {
      name: 'customer_name',
      description: 'Customer first name',
      required: true,
      example_value: 'John',
    },
    {
      name: 'appointment_date',
      description: 'Date of the appointment',
      required: true,
      example_value: 'Jan 15, 2024',
    },
    {
      name: 'pet_name',
      description: 'Name of the pet',
      required: false,
      example_value: 'Buddy',
    },
  ];

  const mockOnInsert = vi.fn();

  it('renders insert variable button', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    expect(screen.getByRole('button', { name: /insert variable/i })).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    expect(screen.getByText('Available Variables')).toBeInTheDocument();
  });

  it('displays all variables in dropdown', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    expect(screen.getByText('{{customer_name}}')).toBeInTheDocument();
    expect(screen.getByText('{{appointment_date}}')).toBeInTheDocument();
    expect(screen.getByText('{{pet_name}}')).toBeInTheDocument();
  });

  it('shows variable descriptions', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    expect(screen.getByText('Customer first name')).toBeInTheDocument();
    expect(screen.getByText('Date of the appointment')).toBeInTheDocument();
    expect(screen.getByText('Name of the pet')).toBeInTheDocument();
  });

  it('shows required badge for required variables', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges).toHaveLength(2); // customer_name and appointment_date
  });

  it('shows example values', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    expect(screen.getByText(/Example: John/i)).toBeInTheDocument();
    expect(screen.getByText(/Example: Jan 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Example: Buddy/i)).toBeInTheDocument();
  });

  it('calls onInsert with correct variable when clicked', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    const variableButton = screen.getByText('{{customer_name}}').closest('button');
    fireEvent.click(variableButton!);

    expect(mockOnInsert).toHaveBeenCalledWith('{{customer_name}}');
  });

  it('closes dropdown after inserting variable', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    const variableButton = screen.getByText('{{customer_name}}').closest('button');
    fireEvent.click(variableButton!);

    expect(screen.queryByText('Available Variables')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking backdrop', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    const backdrop = document.querySelector('.fixed.inset-0.z-10');
    fireEvent.click(backdrop!);

    expect(screen.queryByText('Available Variables')).not.toBeInTheDocument();
  });

  it('shows message when no variables available', () => {
    render(<VariableInserter variables={[]} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    expect(screen.getByText('No variables available')).toBeInTheDocument();
  });

  it('shows helper text in footer', () => {
    render(<VariableInserter variables={mockVariables} onInsert={mockOnInsert} />);

    const button = screen.getByRole('button', { name: /insert variable/i });
    fireEvent.click(button);

    expect(
      screen.getByText(/Variables will be replaced with actual values/i)
    ).toBeInTheDocument();
  });
});
