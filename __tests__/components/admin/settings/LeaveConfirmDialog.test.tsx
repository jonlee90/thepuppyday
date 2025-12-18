/**
 * Tests for LeaveConfirmDialog Component
 * Task 0166: Shared form patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveConfirmDialog } from '@/components/admin/settings/LeaveConfirmDialog';

// Mock Next.js router
const mockPush = vi.fn();
const mockPathname = '/admin/settings/test';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe('LeaveConfirmDialog', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.body.innerHTML = '';
  });

  describe('browser navigation warning', () => {
    it('should add beforeunload listener when dirty', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const { unmount } = render(
        <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      unmount();
    });

    it('should not add beforeunload listener when not dirty', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<LeaveConfirmDialog isDirty={false} onSave={mockOnSave} />);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should remove beforeunload listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });
  });

  describe('internal navigation interception', () => {
    it('should show dialog when clicking internal navigation link with unsaved changes', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate Away</a>
        </div>
      );

      const link = screen.getByText('Navigate Away');
      await user.click(link);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });
    });

    it('should not show dialog when clicking same page link', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href={mockPathname}>Same Page</a>
        </div>
      );

      const link = screen.getByText('Same Page');
      await user.click(link);

      // Dialog should NOT appear
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('should not show dialog for hash links', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="#section">Hash Link</a>
        </div>
      );

      const link = screen.getByText('Hash Link');
      await user.click(link);

      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('should not show dialog when not dirty', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={false} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      const link = screen.getByText('Navigate');
      await user.click(link);

      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });
  });

  describe('dialog interactions', () => {
    it('should close dialog when cancel clicked', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
      });
    });

    it.skip('should navigate when "Leave" clicked', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      // Click leave
      const leaveButton = screen.getByRole('button', { name: /Leave/i });
      await user.click(leaveButton);

      // Should navigate
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/settings/other');
      });
    });

    it('should save and navigate when "Save & Leave" clicked with successful save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValueOnce(true);

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      // Click save & leave
      const saveButton = screen.getByRole('button', { name: /Save & Leave/i });
      await user.click(saveButton);

      // Should call save
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      // Should navigate after successful save
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/settings/other');
      });
    });

    it('should not navigate when save fails', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValueOnce(false); // Save failed

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      // Click save & leave
      const saveButton = screen.getByRole('button', { name: /Save & Leave/i });
      await user.click(saveButton);

      // Should call save
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      // Should NOT navigate
      expect(mockPush).not.toHaveBeenCalled();

      // Dialog should remain open
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });

    it('should close dialog when clicking backdrop', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog isDirty={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      // Click backdrop (the fixed overlay div)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/40');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);
      }

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
      });
    });
  });

  describe('custom message', () => {
    it('should display custom message when provided', async () => {
      const customMessage = 'Custom warning message here';
      const user = userEvent.setup();

      render(
        <div>
          <LeaveConfirmDialog
            isDirty={true}
            onSave={mockOnSave}
            message={customMessage}
          />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText(customMessage)).toBeInTheDocument();
      });
    });
  });

  describe('saving state', () => {
    it.skip('should disable buttons when saving', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <div>
          <LeaveConfirmDialog isDirty={true} isSaving={false} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Trigger dialog
      await user.click(screen.getByText('Navigate'));

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      // Update to saving state
      rerender(
        <div>
          <LeaveConfirmDialog isDirty={true} isSaving={true} onSave={mockOnSave} />
          <a href="/admin/settings/other">Navigate</a>
        </div>
      );

      // Buttons should be disabled
      const buttons = screen.getAllByRole('button');

      // Find each button by exact content
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel'));
      const leaveButton = buttons.find(btn => btn.textContent === 'Leave');
      const saveButton = buttons.find(btn => btn.textContent?.includes('Saving'));

      expect(cancelButton).toBeDefined();
      expect(leaveButton).toBeDefined();
      expect(saveButton).toBeDefined();

      expect(cancelButton).toBeDisabled();
      expect(leaveButton).toBeDisabled();
      expect(saveButton).toBeDisabled();
    });
  });
});
