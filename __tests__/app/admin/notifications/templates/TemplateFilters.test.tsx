import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TemplateFilters,
  FilterOptions,
} from '@/app/admin/notifications/templates/components/TemplateFilters';

describe('TemplateFilters', () => {
  const mockFilters: FilterOptions = {
    search: '',
    channel: 'all',
    status: 'all',
  };

  const mockOnFilterChange = vi.fn();

  it('renders all filter controls', () => {
    render(<TemplateFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />);

    expect(
      screen.getByPlaceholderText(/search by name or trigger event/i)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Channels')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    render(<TemplateFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search by name or trigger event/i);
    fireEvent.change(searchInput, { target: { value: 'reminder' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      search: 'reminder',
    });
  });

  it('calls onFilterChange when channel filter changes', () => {
    render(<TemplateFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />);

    const channelSelect = screen.getByDisplayValue('All Channels');
    fireEvent.change(channelSelect, { target: { value: 'email' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      channel: 'email',
    });
  });

  it('calls onFilterChange when status filter changes', () => {
    render(<TemplateFilters filters={mockFilters} onFilterChange={mockOnFilterChange} />);

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: 'active',
    });
  });

  it('displays current filter values', () => {
    const activeFilters: FilterOptions = {
      search: 'test',
      channel: 'sms',
      status: 'inactive',
    };

    render(<TemplateFilters filters={activeFilters} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SMS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Inactive')).toBeInTheDocument();
  });
});
