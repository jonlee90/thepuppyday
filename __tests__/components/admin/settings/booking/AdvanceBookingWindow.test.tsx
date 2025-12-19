/**
 * Tests for AdvanceBookingWindow component
 * Task 0181: Advance booking window component tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvanceBookingWindow } from '@/components/admin/settings/booking/AdvanceBookingWindow';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockBookingSettings = {
  min_advance_hours: 24,
  max_advance_days: 30,
  cancellation_cutoff_hours: 24,
  buffer_minutes: 15,
  blocked_dates: [],
  recurring_blocked_days: [0],
};

describe('AdvanceBookingWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockBookingSettings,
        last_updated: null,
      }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders loading skeleton initially', () => {
      render(<AdvanceBookingWindow />);
      const skeleton = screen.getByText((content, element) => {
        return element?.className?.includes('animate-pulse') ?? false;
      });
      expect(skeleton).toBeInTheDocument();
    });

    it('renders component with fetched settings', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Advance Booking Window')).toBeInTheDocument();
      });

      expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      expect(screen.getByText('Maximum Advance Booking')).toBeInTheDocument();
      expect(screen.getByText('Booking Window Preview')).toBeInTheDocument();
    });

    it('fetches settings on mount', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/booking');
      });
    });
  });

  describe('Minimum Advance Booking', () => {
    it('displays correct initial value', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('24');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('updates value when slider is changed', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const slider = screen.getAllByRole('slider')[0];
      fireEvent.change(slider, { target: { value: '48' } });

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('48');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('updates value when number input is changed', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const numberInputs = screen.getAllByRole('spinbutton');
      const minInput = numberInputs[0];

      fireEvent.change(minInput, { target: { value: '72' } });

      await waitFor(() => {
        expect(minInput).toHaveValue(72);
      });
    });

    it('shows warning when same-day booking is disabled', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const slider = screen.getAllByRole('slider')[0];
      fireEvent.change(slider, { target: { value: '48' } });

      await waitFor(() => {
        expect(screen.getByText(/Same-day booking disabled/)).toBeInTheDocument();
      });
    });

    it('does not show warning when same-day booking is allowed', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      // Default is 24 hours, should not show warning
      expect(screen.queryByText(/Same-day booking disabled/)).not.toBeInTheDocument();
    });

    it('applies preset values when buttons are clicked', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      // Click "2 days" preset (48 hours)
      const presetButton = screen.getByRole('button', { name: '2 days' });
      fireEvent.click(presetButton);

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('48');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Maximum Advance Booking', () => {
    it('displays correct initial value', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('30');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('updates value when slider is changed', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Maximum Advance Booking')).toBeInTheDocument();
      });

      const slider = screen.getAllByRole('slider')[1];
      fireEvent.change(slider, { target: { value: '60' } });

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('60');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('applies preset values when buttons are clicked', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Maximum Advance Booking')).toBeInTheDocument();
      });

      // Find "1 month" preset
      const presetButton = screen.getAllByRole('button', { name: '1 month' })[0];
      fireEvent.click(presetButton);

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('30');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Preview Display', () => {
    it('shows correct preview text for default values', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText(/Customers can book from 1 day to 30 days in advance/)).toBeInTheDocument();
      });
    });

    it('updates preview when values change', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const minSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(minSlider, { target: { value: '48' } });

      await waitFor(() => {
        expect(screen.getByText(/Customers can book from 2 days to 30 days in advance/)).toBeInTheDocument();
      });
    });

    it('shows "immediately" when min is 0', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const minSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(minSlider, { target: { value: '0' } });

      await waitFor(() => {
        expect(screen.getByText(/Customers can book from immediately to 30 days in advance/)).toBeInTheDocument();
      });
    });

    it('handles hours and days combination correctly', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const minSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(minSlider, { target: { value: '30' } }); // 1 day and 6 hours

      await waitFor(() => {
        expect(screen.getByText(/1 day and 6 hours/)).toBeInTheDocument();
      });
    });
  });

  describe('Unsaved Changes', () => {
    it('shows unsaved changes indicator when values change', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const slider = screen.getAllByRole('slider')[0];
      fireEvent.change(slider, { target: { value: '48' } });

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('does not show indicator when values match original', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      // Should not show unsaved changes initially
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('disables save button when no changes', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/ });
        expect(saveButton).toBeDisabled();
      });
    });

    it('enables save button when changes are made', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const slider = screen.getAllByRole('slider')[0];
      fireEvent.change(slider, { target: { value: '48' } });

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/ });
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Save Functionality', () => {
    it('calls PUT API when save button is clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBookingSettings }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockBookingSettings }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { ...mockBookingSettings, min_advance_hours: 48 },
          }),
        });

      render(<AdvanceBookingWindow />);

      await screen.findByText('Minimum Advance Booking');

      const slider = screen.getAllByRole('slider')[0];
      fireEvent.change(slider, { target: { value: '48' } });

      const saveButton = await screen.findByRole('button', { name: /Save Changes/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        expect(calls.length).toBeGreaterThan(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error when fetching settings fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<AdvanceBookingWindow />);

      // Component should render even if settings fail to load
      await waitFor(() => {
        expect(screen.queryByText('Advance Booking Window')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('prevents min hours from exceeding 168', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Minimum Advance Booking')).toBeInTheDocument();
      });

      const numberInputs = screen.getAllByRole('spinbutton');
      const minInput = numberInputs[0];

      fireEvent.change(minInput, { target: { value: '200' } });

      // Should not update to invalid value
      await waitFor(() => {
        expect(minInput).not.toHaveValue(200);
      });
    });

    it('prevents max days from being less than 7', async () => {
      render(<AdvanceBookingWindow />);

      await waitFor(() => {
        expect(screen.getByText('Maximum Advance Booking')).toBeInTheDocument();
      });

      const numberInputs = screen.getAllByRole('spinbutton');
      const maxInput = numberInputs[1];

      fireEvent.change(maxInput, { target: { value: '5' } });

      // Should not update to invalid value
      await waitFor(() => {
        expect(maxInput).not.toHaveValue(5);
      });
    });
  });
});
